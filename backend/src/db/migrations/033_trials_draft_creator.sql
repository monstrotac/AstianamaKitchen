-- Add draft/publish flow and creator character to trials
ALTER TABLE trials
  ADD COLUMN IF NOT EXISTS is_published        BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS creator_character_id UUID    REFERENCES spire_characters(id) ON DELETE SET NULL;

UPDATE trials SET is_published = TRUE WHERE is_published IS NULL;

CREATE INDEX IF NOT EXISTS idx_trials_published ON trials(is_published);
