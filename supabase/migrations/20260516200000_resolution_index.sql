-- Store which option index won for multi-option predictions
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS resolution_index smallint;
