-- Add per-rank flavor text descriptions (JSONB array)
-- Format: [{ "rank": 0, "label": "Negligible", "description": "..." }, ...]
ALTER TABLE spire_descriptions
  ADD COLUMN IF NOT EXISTS rank_descriptions JSONB DEFAULT '[]'::jsonb;
