CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  code_name     TEXT NOT NULL,
  faction       TEXT NOT NULL CHECK (faction IN ('pollen','scythes','solstice')),
  role          TEXT NOT NULL DEFAULT 'gardener' CHECK (role IN ('gardener','solstice')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
