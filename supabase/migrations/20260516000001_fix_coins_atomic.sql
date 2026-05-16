-- ─── Fix 1: Vote trigger — prevent coins going negative ───────────────────────
-- Before: UPDATE profiles SET coins = coins - amount (no guard)
-- After:  Checks coins >= amount inside trigger; raises exception if insufficient
--         Exception rolls back the vote INSERT automatically (AFTER trigger)

CREATE OR REPLACE FUNCTION public.update_pools()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Guard: ensure voter has enough coins (prevents negative balance)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.user_id AND coins >= NEW.amount
  ) THEN
    RAISE EXCEPTION 'insufficient_coins: user % has less than % coins', NEW.user_id, NEW.amount;
  END IF;

  IF NEW.choice THEN
    UPDATE public.predictions
    SET yes_pool = yes_pool + NEW.amount,
        participant_count = participant_count + 1
    WHERE id = NEW.prediction_id;
  ELSE
    UPDATE public.predictions
    SET no_pool = no_pool + NEW.amount,
        participant_count = participant_count + 1
    WHERE id = NEW.prediction_id;
  END IF;

  -- Atomic deduction (single UPDATE, no read-then-write)
  UPDATE public.profiles
  SET coins = coins - NEW.amount
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;


-- ─── Fix 2: Atomic coin increment RPC ─────────────────────────────────────────
-- Used by: mission claim, daily claim
-- Replaces: read profile.coins → compute new value → write (race-prone)
-- This function runs as SECURITY DEFINER so RLS doesn't block the UPDATE

CREATE OR REPLACE FUNCTION public.add_coins_and_xp(
  p_user_id uuid,
  p_coins   int,
  p_xp      int DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Caller must be the user themselves (no privilege escalation)
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  UPDATE public.profiles
  SET coins = coins + p_coins,
      xp    = xp    + p_xp
  WHERE id = p_user_id
  RETURNING jsonb_build_object('coins', coins, 'xp', xp) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  RETURN v_result;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.add_coins_and_xp(uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_coins_and_xp(uuid, int, int) TO authenticated;


-- ─── Fix 3: Atomic option_pools increment ─────────────────────────────────────
-- Replaces application-level read-modify-write of option_pools array

CREATE OR REPLACE FUNCTION public.increment_option_pool(
  p_prediction_id uuid,
  p_index         int,  -- 0-based index from JavaScript
  p_amount        int
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Postgres arrays are 1-indexed; p_index + 1 converts from JS 0-based
  UPDATE public.predictions
  SET option_pools[p_index + 1] = COALESCE(option_pools[p_index + 1], 0) + p_amount
  WHERE id = p_prediction_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_option_pool(uuid, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_option_pool(uuid, int, int) TO authenticated;
