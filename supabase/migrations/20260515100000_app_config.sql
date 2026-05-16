create table if not exists app_config (
  key   text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table app_config enable row level security;

-- Only admins (service role) can write; anyone can read
create policy "public read app_config"
  on app_config for select using (true);

-- Seed default home sections visibility
insert into app_config (key, value) values (
  'home_sections',
  '{
    "hero": true,
    "stats_bar": true,
    "quick": true,
    "trending": true,
    "ending_soon": true,
    "for_you": true,
    "missions": true,
    "shop": true,
    "rank_card": true,
    "leaderboard": true,
    "community": true
  }'::jsonb
) on conflict (key) do nothing;
