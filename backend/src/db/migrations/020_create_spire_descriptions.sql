-- Stores canonical descriptions for attributes and skills
-- Displayed as info tooltips in the character sheet

CREATE TABLE IF NOT EXISTS spire_descriptions (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('attribute', 'skill', 'save')),
  key         TEXT NOT NULL,
  label       TEXT NOT NULL,
  description TEXT NOT NULL,
  UNIQUE(type, key)
);

CREATE INDEX IF NOT EXISTS idx_spire_descriptions_type ON spire_descriptions(type);
