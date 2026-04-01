-- Add conditions tracking (JSONB array of condition IDs) for session combat
ALTER TABLE session_members ADD COLUMN IF NOT EXISTS conditions JSONB NOT NULL DEFAULT '[]';
