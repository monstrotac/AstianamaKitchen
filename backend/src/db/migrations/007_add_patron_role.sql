-- Add 'patron' to the role and faction check constraints

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('gardener','solstice','patron'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_faction_check;
ALTER TABLE users ADD CONSTRAINT users_faction_check
  CHECK (faction IN ('pollen','scythes','solstice','patron'));
