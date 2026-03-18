-- Garden-internal operative alias, only visible in Oversight and Contracts
ALTER TABLE users ADD COLUMN IF NOT EXISTS operative_name TEXT;
