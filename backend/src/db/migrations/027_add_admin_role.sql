-- Add 'admin' as a proper role separate from 'solstice'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('gardener', 'solstice', 'patron', 'guest', 'admin', 'user'));
