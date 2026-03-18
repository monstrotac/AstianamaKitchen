-- Operative name per character (Garden-internal alias, visible only in Oversight and Contracts)
ALTER TABLE spire_characters ADD COLUMN IF NOT EXISTS operative_name TEXT;
