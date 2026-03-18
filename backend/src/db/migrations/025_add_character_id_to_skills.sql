-- Add character_id FK
ALTER TABLE spire_skills
  ADD COLUMN IF NOT EXISTS character_id UUID REFERENCES spire_characters(id) ON DELETE CASCADE;

-- Populate character_id from user_id via spire_characters
UPDATE spire_skills ss
SET character_id = sc.id
FROM spire_characters sc
WHERE sc.user_id = ss.user_id
  AND ss.character_id IS NULL;

-- Drop old user+skill unique constraint, add character-based one
ALTER TABLE spire_skills DROP CONSTRAINT IF EXISTS spire_skills_user_id_skill_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS spire_skills_char_skill_uq
  ON spire_skills(character_id, skill_name)
  WHERE character_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spire_skills_char ON spire_skills(character_id);
