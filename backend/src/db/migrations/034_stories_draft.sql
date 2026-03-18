-- Add draft/publish flow to character stories
ALTER TABLE character_stories
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE character_stories SET is_published = TRUE WHERE is_published IS NULL;

CREATE INDEX IF NOT EXISTS idx_stories_published ON character_stories(is_published);
