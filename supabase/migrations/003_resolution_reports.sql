-- Resolution Reports — community votes on prediction outcomes after deadline

-- Track community reports
create table public.resolution_reports (
  id            uuid primary key default uuid_generate_v4(),
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  outcome       boolean not null,  -- true=YES won, false=NO won
  created_at    timestamptz default now(),
  unique (prediction_id, user_id)
);

alter table public.resolution_reports enable row level security;
create policy "reports_read_all"   on public.resolution_reports for select using (true);
create policy "reports_insert_own" on public.resolution_reports for insert with check (auth.uid() = user_id);

create index resolution_reports_prediction_idx on public.resolution_reports(prediction_id);

-- Add resolution window to predictions (24h after ends_at)
alter table public.predictions
  add column if not exists resolution_window_end timestamptz;

-- Function: check consensus and resolve prediction if ≥70% agree
create or replace function public.try_resolve_prediction(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_total     int;
  v_yes_count int;
  v_yes_pct   numeric;
  v_outcome   boolean;
  v_yes_pool  bigint;
  v_no_pool   bigint;
  v_total_pool bigint;
begin
  -- Count reports
  select
    count(*),
    count(*) filter (where outcome = true)
  into v_total, v_yes_count
  from public.resolution_reports
  where prediction_id = p_id;

  -- Need at least 3 reports
  if v_total < 3 then return; end if;

  v_yes_pct := v_yes_count::numeric / v_total * 100;

  -- Consensus: ≥70% one way
  if v_yes_pct >= 70 then
    v_outcome := true;
  elsif v_yes_pct <= 30 then
    v_outcome := false;
  else
    return; -- no consensus yet
  end if;

  -- Resolve the prediction
  update public.predictions
  set resolution = v_outcome, resolved_at = now()
  where id = p_id and resolution is null;

  -- If not updated (already resolved), bail
  if not found then return; end if;

  -- Get pool amounts
  select yes_pool, no_pool, yes_pool + no_pool
  into v_yes_pool, v_no_pool, v_total_pool
  from public.predictions where id = p_id;

  -- Distribute rewards to winners (95% of total pool, proportional to bet)
  if v_outcome then
    -- YES won: reward YES voters
    update public.profiles p
    set coins = p.coins + floor(v.amount::numeric / v_yes_pool * v_total_pool * 0.95)
    from public.votes v
    where v.prediction_id = p_id and v.choice = true and v.user_id = p.id;
  else
    -- NO won: reward NO voters
    update public.profiles p
    set coins = p.coins + floor(v.amount::numeric / v_no_pool * v_total_pool * 0.95)
    from public.votes v
    where v.prediction_id = p_id and v.choice = false and v.user_id = p.id;
  end if;

  -- Update correct_predictions for winners
  if v_outcome then
    update public.profiles p
    set correct_predictions = correct_predictions + 1
    from public.votes v
    where v.prediction_id = p_id and v.choice = true and v.user_id = p.id;
  else
    update public.profiles p
    set correct_predictions = correct_predictions + 1
    from public.votes v
    where v.prediction_id = p_id and v.choice = false and v.user_id = p.id;
  end if;

  -- Notify winners
  insert into public.notifications (user_id, type, title, body, data)
  select
    v.user_id,
    'win',
    'ชะตาลิขิตแล้ว — ท่านทำนายถูก! 🔮',
    'พยากรณ์ปิดผลแล้ว เหรียญถูกโอนเข้าบัญชีของท่าน',
    jsonb_build_object('prediction_id', p_id)
  from public.votes v
  where v.prediction_id = p_id and v.choice = v_outcome;

  -- Notify losers
  insert into public.notifications (user_id, type, title, body, data)
  select
    v.user_id,
    'lose',
    'โชคชะตาครั้งนี้ไม่เป็นใจ',
    'พยากรณ์ปิดผลแล้ว ขอให้โชคดีในครั้งหน้า',
    jsonb_build_object('prediction_id', p_id)
  from public.votes v
  where v.prediction_id = p_id and v.choice != v_outcome;
end;
$$;
