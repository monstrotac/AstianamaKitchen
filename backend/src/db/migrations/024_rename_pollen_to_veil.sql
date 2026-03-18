-- Rename the pollen faction to veil across all tables
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_faction_check;
UPDATE users SET faction = 'veil' WHERE faction = 'pollen';
ALTER TABLE users ADD CONSTRAINT users_faction_check
  CHECK (faction IN ('veil', 'scythes', 'solstice', 'patron', 'guest'));
