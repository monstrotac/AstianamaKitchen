-- Collapse old multi-role system into guest / user / admin
-- Faction now lives on spire_characters, not on the users row

-- Drop old constraint first (it doesn't allow 'user'), then migrate, then re-add
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Promote solstice to admin, demote gardener/patron to user
UPDATE users SET role = 'admin' WHERE role = 'solstice';
UPDATE users SET role = 'user'  WHERE role IN ('gardener', 'patron');

-- Add new constraint with simplified role set
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('guest', 'user', 'admin'));
