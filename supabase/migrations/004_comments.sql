-- Comments on predictions

create table public.comments (
  id            uuid primary key default uuid_generate_v4(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 500),
  created_at    timestamptz default now()
);

alter table public.comments enable row level security;
create policy "comments_read_all"   on public.comments for select using (true);
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = user_id);

create index comments_prediction_idx on public.comments(prediction_id, created_at desc);

-- Comment likes (toggle)
create table public.comment_likes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;
create policy "comment_likes_read_all"   on public.comment_likes for select using (true);
create policy "comment_likes_insert_own" on public.comment_likes for insert with check (auth.uid() = user_id);
create policy "comment_likes_delete_own" on public.comment_likes for delete using (auth.uid() = user_id);

-- View: comments with like count and author info
create or replace view public.comments_enriched as
select
  c.id,
  c.prediction_id,
  c.user_id,
  c.body,
  c.created_at,
  p.username,
  p.display_name,
  p.tier,
  p.avatar_url,
  count(cl.user_id)::int as like_count
from public.comments c
join public.profiles p on p.id = c.user_id
left join public.comment_likes cl on cl.comment_id = c.id
group by c.id, p.username, p.display_name, p.tier, p.avatar_url;
