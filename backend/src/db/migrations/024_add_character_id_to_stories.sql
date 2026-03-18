-- Add character_id FK (nullable so existing rows can be migrated first)
ALTER TABLE character_stories
  ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES spire_characters(id) ON DELETE CASCADE;

-- Populate character_id from user_id via spire_characters
UPDATE character_stories cs
SET character_id = sc.id
FROM spire_characters sc
WHERE sc.user_id = cs.user_id
  AND cs.character_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_character_stories_char ON character_stories(character_id);
