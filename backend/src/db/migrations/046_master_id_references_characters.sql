-- Change master_id to reference spire_characters instead of users
-- First clear any existing values (they pointed to user IDs, not character IDs)
UPDATE spire_characters SET master_id = NULL;

-- Drop the old FK constraint
ALTER TABLE spire_characters DROP CONSTRAINT IF EXISTS spire_characters_master_id_fkey;

-- Add the new FK constraint referencing spire_characters
ALTER TABLE spire_characters
  ADD CONSTRAINT spire_characters_master_id_fkey
  FOREIGN KEY (master_id) REFERENCES spire_characters(id) ON DELETE SET NULL;
