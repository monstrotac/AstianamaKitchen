CREATE TABLE IF NOT EXISTS trial_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id    UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  body        TEXT NOT NULL,
  entry_type  TEXT NOT NULL DEFAULT 'narrative'
                CHECK (entry_type IN ('narrative','roll','verdict')),
  roll_data   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trial_entries_trial ON trial_entries(trial_id);
