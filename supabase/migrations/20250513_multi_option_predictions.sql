-- Support multi-option predictions (3+ choices)
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS options jsonb;
-- Array of pool amounts per option, parallel to options array
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS option_pools jsonb;
-- For multi-option votes: index into options array (null = use boolean choice)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS choice_index smallint;
