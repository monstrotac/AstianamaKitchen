-- Allow multiple characters per user
ALTER TABLE spire_characters DROP CONSTRAINT IF EXISTS spire_characters_user_id_key;

-- Keep a regular index for lookups by user_id
CREATE INDEX IF NOT EXISTS idx_spire_characters_user_id ON spire_characters(user_id);
