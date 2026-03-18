ALTER TABLE spire_characters
  ADD COLUMN IF NOT EXISTS saving_throw_profs TEXT[] NOT NULL DEFAULT '{}';
