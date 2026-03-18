CREATE TABLE IF NOT EXISTS spire_characters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spire_rank    TEXT NOT NULL DEFAULT 'acolyte'
                  CHECK (spire_rank IN ('acolyte','apprentice','lord','darth')),
  status_name   TEXT,
  species       TEXT,
  bio           TEXT,
  master_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  image_url     TEXT,
  str           INT NOT NULL DEFAULT 8,
  dex           INT NOT NULL DEFAULT 8,
  con           INT NOT NULL DEFAULT 8,
  int_score     INT NOT NULL DEFAULT 8,
  wis           INT NOT NULL DEFAULT 8,
  cha           INT NOT NULL DEFAULT 8,
  frc           INT NOT NULL DEFAULT 8,
  force_control INT NOT NULL DEFAULT 0,
  force_sense   INT NOT NULL DEFAULT 0,
  force_alter   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spire_characters_rank ON spire_characters(spire_rank);
