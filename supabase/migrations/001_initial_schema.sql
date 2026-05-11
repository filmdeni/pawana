-- ภาวนา — Initial Schema
-- Run: supabase db push or paste in Supabase SQL Editor

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  title         text default 'นักพยากรณ์มือใหม่',
  tier          text default 'bronze' check (tier in ('bronze','silver','gold','diamond','legend')),
  coins         bigint default 1000 not null,
  xp            bigint default 0 not null,
  level         int default 1 not null,
  streak        int default 0 not null,
  last_login    date,
  rank_position int,
  total_predictions int default 0,
  correct_predictions int default 0,
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_read_all"  on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Categories ───────────────────────────────────────────────────────────────
create table public.categories (
  id    serial primary key,
  slug  text unique not null,
  label text not null,
  emoji text,
  sort_order int default 0
);

insert into public.categories (slug, label, emoji, sort_order) values
  ('drama',   'ดราม่า',   '💔', 1),
  ('game',    'เกม',      '🎮', 2),
  ('sports',  'กีฬา',     '⚽', 3),
  ('finance', 'การเงิน',  '₿',  4),
  ('viral',   'ไวรัล',    '🔥', 5),
  ('other',   'อื่นๆ',    '✨', 6);

alter table public.categories enable row level security;
create policy "categories_read_all" on public.categories for select using (true);

-- ─── Predictions ──────────────────────────────────────────────────────────────
create table public.predictions (
  id            uuid primary key default uuid_generate_v4(),
  creator_id    uuid not null references public.profiles(id) on delete cascade,
  category_id   int references public.categories(id),
  title         text not null,
  description   text,
  image_url     text,
  ends_at       timestamptz not null,
  resolved_at   timestamptz,
  resolution    boolean,  -- true=yes won, false=no won, null=pending
  yes_pool      bigint default 0,
  no_pool       bigint default 0,
  participant_count int default 0,
  view_count    int default 0,
  is_featured   boolean default false,
  is_trending   boolean default false,
  created_at    timestamptz default now()
);

alter table public.predictions enable row level security;

create policy "predictions_read_all"   on public.predictions for select using (true);
create policy "predictions_insert_own" on public.predictions for insert with check (auth.uid() = creator_id);
create policy "predictions_update_own" on public.predictions for update using (auth.uid() = creator_id);

create index predictions_ends_at_idx    on public.predictions(ends_at);
create index predictions_category_idx  on public.predictions(category_id);
create index predictions_trending_idx  on public.predictions(is_trending, created_at desc);

-- ─── Votes ────────────────────────────────────────────────────────────────────
create table public.votes (
  id            uuid primary key default uuid_generate_v4(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  choice        boolean not null,  -- true=yes, false=no
  amount        bigint not null check (amount > 0),
  potential_win bigint,
  created_at    timestamptz default now(),
  unique (prediction_id, user_id)
);

alter table public.votes enable row level security;

create policy "votes_read_all"    on public.votes for select using (true);
create policy "votes_insert_own"  on public.votes for insert with check (auth.uid() = user_id);
create policy "votes_update_own"  on public.votes for update using (auth.uid() = user_id);

-- Pool update trigger
create or replace function public.update_pools()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.choice then
    update public.predictions set yes_pool = yes_pool + new.amount, participant_count = participant_count + 1 where id = new.prediction_id;
    -- Deduct coins from voter
    update public.profiles set coins = coins - new.amount where id = new.user_id;
  else
    update public.predictions set no_pool = no_pool + new.amount, participant_count = participant_count + 1 where id = new.prediction_id;
    update public.profiles set coins = coins - new.amount where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger on_vote_inserted
  after insert on public.votes
  for each row execute procedure public.update_pools();

-- ─── Comments ─────────────────────────────────────────────────────────────────
create table public.comments (
  id            uuid primary key default uuid_generate_v4(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  parent_id     uuid references public.comments(id) on delete cascade,
  body          text not null,
  likes         int default 0,
  created_at    timestamptz default now()
);

alter table public.comments enable row level security;

create policy "comments_read_all"    on public.comments for select using (true);
create policy "comments_insert_own"  on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_update_own"  on public.comments for update using (auth.uid() = user_id);
create policy "comments_delete_own"  on public.comments for delete using (auth.uid() = user_id);

-- ─── Missions ─────────────────────────────────────────────────────────────────
create table public.missions (
  id          serial primary key,
  slug        text unique not null,
  label       text not null,
  description text,
  type        text not null check (type in ('daily','weekly','special')),
  goal        int not null,
  reward_coins int default 0,
  reward_xp   int default 0,
  reset_at    text  -- 'daily' | 'weekly' | null
);

create table public.user_missions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  mission_id  int not null references public.missions(id),
  progress    int default 0,
  completed   boolean default false,
  completed_at timestamptz,
  period_key  text,  -- '2024-W48' for weekly, '2024-11-30' for daily
  created_at  timestamptz default now(),
  unique (user_id, mission_id, period_key)
);

alter table public.missions enable row level security;
alter table public.user_missions enable row level security;

create policy "missions_read_all"        on public.missions for select using (true);
create policy "user_missions_read_own"   on public.user_missions for select using (auth.uid() = user_id);
create policy "user_missions_insert_own" on public.user_missions for insert with check (auth.uid() = user_id);
create policy "user_missions_update_own" on public.user_missions for update using (auth.uid() = user_id);

insert into public.missions (slug, label, type, goal, reward_coins, reward_xp, reset_at) values
  ('daily_login',    'ล็อกอินประจำวัน',      'daily',  1,  50,  20, 'daily'),
  ('daily_predict',  'ทำนาย 3 หัวข้อ',        'daily',  3,  150, 60, 'daily'),
  ('daily_comment',  'แสดงความคิดเห็น 1 ครั้ง','daily',  1,  100, 40, 'daily'),
  ('weekly_win5',    'ทำนายถูก 5 ครั้ง',      'weekly', 5,  500, 200, 'weekly'),
  ('weekly_invite',  'เชิญเพื่อน 1 คน',       'weekly', 1, 1000, 400, 'weekly'),
  ('special_100win', 'ทำนายถูก 100 ครั้ง',    'special',100, 5000,2000, null),
  ('special_streak30','สตรีค 30 วัน',         'special', 30, 3000,1000, null);

-- ─── Shop Items ───────────────────────────────────────────────────────────────
create table public.shop_items (
  id          serial primary key,
  name        text not null,
  description text,
  type        text not null check (type in ('boost','frame','badge','effect','box')),
  rarity      text not null check (rarity in ('uncommon','rare','epic','legendary')),
  price       int not null,
  emoji       text,
  effect_data jsonb,
  is_featured boolean default false,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table public.shop_items enable row level security;
create policy "shop_items_read_active" on public.shop_items for select using (is_active = true);

insert into public.shop_items (name, description, type, rarity, price, emoji, is_featured) values
  ('ซุพพีเชส จักรวาล', 'เพิ่มโอกาสทำนายถูก +10% เป็นเวลา 7 วัน', 'boost',  'epic',      2000, '🔮', true),
  ('พิมคำทำนาย',       'เพิ่มคำเตือนสำหรับการทำนาย',              'boost',  'rare',      1500, '📜', false),
  ('เหรียญนำโชค',      'รับพาราเพิ่ม +20% เป็นเวลา 3 วัน',        'boost',  'uncommon',  1000, '🪙', false),
  ('กล่องสุ่มไอเท็ม',  'สุ่มรับไอเท็มสุดหายาก',                  'box',    'legendary', 2500, '📦', false),
  ('กรอบ Cosmic',      'กรอบโปรไฟล์สไตล์จักรวาล',                 'frame',  'rare',      1200, '🌌', false),
  ('กรอบ Gold Crown',  'แสดงถึงสถานะสูงสุด',                      'frame',  'epic',      1500, '👑', false);

-- ─── User Inventory ───────────────────────────────────────────────────────────
create table public.user_inventory (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  item_id     int not null references public.shop_items(id),
  quantity    int default 1,
  expires_at  timestamptz,
  equipped    boolean default false,
  created_at  timestamptz default now()
);

alter table public.user_inventory enable row level security;
create policy "inventory_read_own"   on public.user_inventory for select using (auth.uid() = user_id);
create policy "inventory_insert_own" on public.user_inventory for insert with check (auth.uid() = user_id);
create policy "inventory_update_own" on public.user_inventory for update using (auth.uid() = user_id);

-- ─── Notifications ────────────────────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,  -- 'win' | 'lose' | 'rank' | 'mission' | 'comment' | 'system'
  title       text not null,
  body        text,
  data        jsonb,
  read        boolean default false,
  created_at  timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "notif_read_own"   on public.notifications for select using (auth.uid() = user_id);
create policy "notif_update_own" on public.notifications for update using (auth.uid() = user_id);
create policy "notif_insert_sys" on public.notifications for insert with check (true);

create index notifications_user_unread_idx on public.notifications(user_id, read, created_at desc);

-- ─── Helpful views (security_invoker = true for RLS) ─────────────────────────
create view public.leaderboard with (security_invoker = true) as
  select
    id, username, display_name, avatar_url, title, tier,
    coins, level, streak, rank_position,
    total_predictions, correct_predictions,
    case when total_predictions > 0
      then round(correct_predictions::numeric / total_predictions * 100, 1)
      else 0
    end as accuracy_pct
  from public.profiles
  order by coins desc;

-- Grant access to anon/authenticated
grant select on public.leaderboard to anon, authenticated;
