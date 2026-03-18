CREATE TABLE IF NOT EXISTS contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  classification   TEXT NOT NULL DEFAULT '—',
  priority         TEXT NOT NULL DEFAULT 'Standard'
                     CHECK (priority IN ('Standard','Priority','Critical')),
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','pending','complete','compromised')),
  method           TEXT NOT NULL DEFAULT 'Unspecified'
                     CHECK (method IN ('Unspecified','Silent Kill','Public Elimination','Blackmail')),
  weapon           TEXT,
  notes_briefing   TEXT,
  notes_intel      TEXT,
  notes_exec       TEXT,
  notes_exfil      TEXT,
  closed_approach  TEXT,
  closed_method    TEXT,
  closed_notes     TEXT,
  closed_date      DATE,
  created_by       UUID NOT NULL REFERENCES users(id),
  assigned_to      UUID REFERENCES users(id),
  is_public        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_assigned_to ON contracts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
