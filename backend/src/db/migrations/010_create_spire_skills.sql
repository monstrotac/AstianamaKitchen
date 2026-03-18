CREATE TABLE IF NOT EXISTS spire_skills (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name  TEXT NOT NULL,
  description TEXT,
  attribute   TEXT,
  UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_spire_skills_user ON spire_skills(user_id);
