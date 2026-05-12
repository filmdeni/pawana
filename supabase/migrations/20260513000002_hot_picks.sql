-- Table for the 4 manually curated "กำลังร้อนแรง" cards on the home page
CREATE TABLE IF NOT EXISTS hot_picks (
  slot smallint PRIMARY KEY CHECK (slot BETWEEN 1 AND 4),
  prediction_id uuid REFERENCES predictions(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- Pre-populate 4 empty slots
INSERT INTO hot_picks (slot) VALUES (1),(2),(3),(4)
ON CONFLICT (slot) DO NOTHING;
