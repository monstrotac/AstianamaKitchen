-- Faction moves from users table (dropped in 029) to spire_characters
-- Migrate existing users.faction values where possible, then add column
ALTER TABLE spire_characters
  ADD COLUMN IF NOT EXISTS faction TEXT
    CHECK (faction IN ('scythes', 'veil', 'solstice', 'patron'));

CREATE INDEX IF NOT EXISTS idx_spire_characters_faction ON spire_characters(faction);
