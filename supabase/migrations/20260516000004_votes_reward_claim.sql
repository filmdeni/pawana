-- Add reward tracking columns to votes table
ALTER TABLE votes
  ADD COLUMN IF NOT EXISTS reward_claimed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reward_amount  integer  NOT NULL DEFAULT 0;
