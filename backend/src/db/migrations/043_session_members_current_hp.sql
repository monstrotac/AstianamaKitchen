-- Add current HP tracking for session combat
ALTER TABLE session_members ADD COLUMN IF NOT EXISTS current_hp INT;
