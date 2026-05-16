-- Track first-time welcome and daily ญาณ claim
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcomed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS daily_claimed_at timestamptz;
