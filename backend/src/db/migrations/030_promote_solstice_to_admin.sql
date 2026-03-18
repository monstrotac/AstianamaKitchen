-- Ensure the initial admin account (seeded as solstice) has the admin role
-- Migration 028 demoted all solstice roles to 'user'; promote the seed account back
UPDATE users
SET role = 'admin'
WHERE email = 'solstice@order.local' AND role = 'user';
