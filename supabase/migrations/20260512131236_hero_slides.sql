create table if not exists hero_slides (
  id            uuid primary key default gen_random_uuid(),
  sort_order    int         not null default 0,
  lines         text[]      not null default '{}',
  category      text        not null default '',
  yes_pct       int         not null default 50 check (yes_pct between 1 and 99),
  yes_label     text        not null default '',
  no_label      text        not null default '',
  yes_btn       text        not null default '',
  no_btn        text        not null default '',
  duration_hours int        not null default 2,
  viewers       int         not null default 0,
  heat_level    int         not null default 3 check (heat_level between 1 and 5),
  prediction_id text        not null default '',
  bg_image      text        not null default '',
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger hero_slides_updated_at
  before update on hero_slides
  for each row execute procedure update_updated_at();

alter table hero_slides enable row level security;

create policy "public read active slides"
  on hero_slides for select
  using (active = true);

create policy "admin full access"
  on hero_slides for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

insert into hero_slides (sort_order, lines, category, yes_pct, yes_label, no_label, yes_btn, no_btn, duration_hours, viewers, heat_level, prediction_id, bg_image, active)
values
  (0, array['คืนนี้ BTC', 'จะหลุด {100K} ไหม?'], 'คริปโต', 73, 'เชื่อว่าหลุด', 'เชื่อว่าไม่หลุด', 'ฉันว่าใช่', 'ไม่หลุดแน่นอน', 2, 3850, 4, '1', '/images/hero/btc.png', true),
  (1, array['โตรดกาว+บิ้ว', 'จะได้ {100 ล้านวิว}', 'ก่อนสิ้นเดือนไหม?'], 'ไวรัล', 58, 'เชื่อว่าได้', 'เชื่อว่าไม่ได้', 'ฉันว่าได้', 'ไม่ได้แน่นอน', 5, 2197, 3, '2', '/images/hero/drama.png', true);
