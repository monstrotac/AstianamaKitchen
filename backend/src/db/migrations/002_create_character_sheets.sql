CREATE TABLE IF NOT EXISTS character_sheets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  species       TEXT,
  alignment     TEXT DEFAULT 'The Order',
  specialties   TEXT[] DEFAULT '{}',
  bio           TEXT,
  base_modifier INT NOT NULL DEFAULT 3,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
