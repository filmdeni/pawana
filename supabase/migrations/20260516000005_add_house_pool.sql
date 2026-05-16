-- Add house pool (liquidity bot) to predictions
-- Each side gets house_pool added to its effective pool for reward calculation
-- yes_pool / no_pool store USER contributions only
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS house_pool integer NOT NULL DEFAULT 500;
