-- Add faction column to spire_characters (users.faction no longer exists)
ALTER TABLE spire_characters
  ADD COLUMN IF NOT EXISTS faction TEXT
    CHECK (faction IN ('scythes', 'veil', 'solstice', 'patron'));
