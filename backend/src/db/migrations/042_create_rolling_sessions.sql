-- Rolling Sessions: real-time chat rooms with dice rolling

CREATE TABLE IF NOT EXISTS rolling_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rolling_sessions_active  ON rolling_sessions(is_active);
CREATE INDEX idx_rolling_sessions_creator ON rolling_sessions(created_by);

CREATE TABLE IF NOT EXISTS session_members (
  session_id    UUID NOT NULL REFERENCES rolling_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id  UUID NOT NULL REFERENCES spire_characters(id) ON DELETE CASCADE,
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

CREATE TABLE IF NOT EXISTS session_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES rolling_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id  UUID NOT NULL REFERENCES spire_characters(id) ON DELETE CASCADE,
  msg_type      TEXT NOT NULL DEFAULT 'chat' CHECK (msg_type IN ('chat', 'roll', 'system')),
  content       TEXT,
  roll_data     JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_messages_session ON session_messages(session_id, created_at);
