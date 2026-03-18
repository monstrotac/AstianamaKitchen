-- Add draft/publish flow and creator character to reports
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS is_published        BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS creator_character_id UUID    REFERENCES spire_characters(id) ON DELETE SET NULL;

-- Existing rows are already "published"
UPDATE reports SET is_published = TRUE WHERE is_published IS NULL;

CREATE INDEX IF NOT EXISTS idx_reports_published ON reports(is_published);
