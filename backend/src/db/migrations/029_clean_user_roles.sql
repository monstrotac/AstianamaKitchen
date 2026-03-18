-- Remove faction from users (it lives on spire_characters)
-- Normalize role to guest / user / admin only

-- Fix any remaining non-standard roles
UPDATE users SET role = 'user'
WHERE role NOT IN ('guest', 'user', 'admin');

-- Drop and recreate role CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('guest', 'user', 'admin'));

-- Drop faction column (belongs on spire_characters now)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_faction_check;
ALTER TABLE users DROP COLUMN IF EXISTS faction;
