-- BTC 5-minute prediction rounds
CREATE TABLE public.btc_rounds (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at   timestamptz NOT NULL,
  ends_at     timestamptz NOT NULL,
  start_price numeric(18,2),
  end_price   numeric(18,2),
  result      text CHECK (result IN ('up','down')),  -- null = pending
  up_pool     numeric(18,2) NOT NULL DEFAULT 0,
  down_pool   numeric(18,2) NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  UNIQUE (starts_at)
);

ALTER TABLE public.btc_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "btc_rounds_read" ON public.btc_rounds FOR SELECT USING (true);
-- Only service role can insert/update (via Edge Function)

-- User bets per round
CREATE TABLE public.btc_bets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id   uuid NOT NULL REFERENCES public.btc_rounds(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction  text NOT NULL CHECK (direction IN ('up','down')),
  amount     numeric(18,2) NOT NULL CHECK (amount > 0),
  payout     numeric(18,2),           -- set after resolution
  won        boolean,                 -- set after resolution
  created_at timestamptz DEFAULT now(),
  UNIQUE (round_id, user_id)          -- one bet per round per user
);

ALTER TABLE public.btc_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "btc_bets_read_own"   ON public.btc_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "btc_bets_insert_own" ON public.btc_bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function: open or get current round
-- Called from server action when user loads the page
CREATE OR REPLACE FUNCTION public.get_or_create_btc_round(
  p_starts_at timestamptz,
  p_ends_at   timestamptz,
  p_start_price numeric
) RETURNS public.btc_rounds AS $$
DECLARE
  v_round public.btc_rounds;
BEGIN
  -- Try to get existing round for this window
  SELECT * INTO v_round FROM public.btc_rounds WHERE starts_at = p_starts_at;
  IF FOUND THEN
    RETURN v_round;
  END IF;
  -- Create new round
  INSERT INTO public.btc_rounds (starts_at, ends_at, start_price)
  VALUES (p_starts_at, p_ends_at, p_start_price)
  RETURNING * INTO v_round;
  RETURN v_round;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: place bet (deducts coins atomically)
CREATE OR REPLACE FUNCTION public.place_btc_bet(
  p_round_id  uuid,
  p_direction text,
  p_amount    numeric
) RETURNS public.btc_bets AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_round   public.btc_rounds;
  v_bet     public.btc_bets;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Lock round row
  SELECT * INTO v_round FROM public.btc_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'round_not_found';
  END IF;
  IF v_round.result IS NOT NULL THEN
    RAISE EXCEPTION 'round_closed';
  END IF;
  -- 30s lock before end
  IF now() >= v_round.ends_at - interval '30 seconds' THEN
    RAISE EXCEPTION 'round_locked';
  END IF;

  -- Deduct coins
  UPDATE public.profiles
  SET coins = coins - p_amount
  WHERE id = v_user_id AND coins >= p_amount;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_coins';
  END IF;

  -- Insert bet
  INSERT INTO public.btc_bets (round_id, user_id, direction, amount)
  VALUES (p_round_id, v_user_id, p_direction, p_amount)
  RETURNING * INTO v_bet;

  -- Update pool
  IF p_direction = 'up' THEN
    UPDATE public.btc_rounds SET up_pool = up_pool + p_amount WHERE id = p_round_id;
  ELSE
    UPDATE public.btc_rounds SET down_pool = down_pool + p_amount WHERE id = p_round_id;
  END IF;

  RETURN v_bet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: resolve round (called by Edge Function/cron)
CREATE OR REPLACE FUNCTION public.resolve_btc_round(
  p_round_id  uuid,
  p_end_price numeric
) RETURNS void AS $$
DECLARE
  v_round      public.btc_rounds;
  v_result     text;
  v_total_pool numeric;
  v_win_pool   numeric;
BEGIN
  SELECT * INTO v_round FROM public.btc_rounds WHERE id = p_round_id FOR UPDATE;
  IF NOT FOUND OR v_round.result IS NOT NULL THEN
    RETURN; -- already resolved
  END IF;

  -- Determine result
  IF p_end_price > v_round.start_price THEN
    v_result := 'up';
  ELSE
    v_result := 'down';
  END IF;

  v_total_pool := v_round.up_pool + v_round.down_pool;
  v_win_pool   := CASE v_result WHEN 'up' THEN v_round.up_pool ELSE v_round.down_pool END;

  -- Update round
  UPDATE public.btc_rounds
  SET end_price = p_end_price, result = v_result, resolved_at = now()
  WHERE id = p_round_id;

  -- Pay out winners (pool-based, 5% house cut)
  UPDATE public.btc_bets b
  SET
    won    = (direction = v_result),
    payout = CASE
      WHEN direction = v_result AND v_win_pool > 0
        THEN ROUND((b.amount / v_win_pool) * v_total_pool * 0.95, 2)
      ELSE 0
    END
  WHERE round_id = p_round_id;

  -- Add coins to winners
  UPDATE public.profiles p
  SET coins = coins + b.payout
  FROM public.btc_bets b
  WHERE b.round_id = p_round_id
    AND b.won = true
    AND b.user_id = p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
