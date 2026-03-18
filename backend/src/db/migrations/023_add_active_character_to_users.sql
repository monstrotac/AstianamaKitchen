ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active_character_id UUID REFERENCES spire_characters(id) ON DELETE SET NULL;
