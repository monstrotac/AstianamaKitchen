-- Remove FRC/Force columns and saving throw proficiencies
-- Migrate attribute scores from D&D 8-20 scale to 1-5 dot scale
-- Add XP tracking columns

ALTER TABLE spire_characters
  DROP COLUMN IF EXISTS frc,
  DROP COLUMN IF EXISTS force_control,
  DROP COLUMN IF EXISTS force_sense,
  DROP COLUMN IF EXISTS force_alter,
  DROP COLUMN IF EXISTS saving_throw_profs;

-- Translate existing 8-20 scores to 1-5 range
UPDATE spire_characters SET
  str       = GREATEST(1, LEAST(5, ROUND((str       - 8)::float / 3)::int)),
  dex       = GREATEST(1, LEAST(5, ROUND((dex       - 8)::float / 3)::int)),
  con       = GREATEST(1, LEAST(5, ROUND((con       - 8)::float / 3)::int)),
  int_score = GREATEST(1, LEAST(5, ROUND((int_score - 8)::float / 3)::int)),
  wis       = GREATEST(1, LEAST(5, ROUND((wis       - 8)::float / 3)::int)),
  cha       = GREATEST(1, LEAST(5, ROUND((cha       - 8)::float / 3)::int));

-- Set new defaults and add range constraints
ALTER TABLE spire_characters
  ALTER COLUMN str       SET DEFAULT 1,
  ALTER COLUMN dex       SET DEFAULT 1,
  ALTER COLUMN con       SET DEFAULT 1,
  ALTER COLUMN int_score SET DEFAULT 1,
  ALTER COLUMN wis       SET DEFAULT 1,
  ALTER COLUMN cha       SET DEFAULT 1,
  ADD CONSTRAINT str_range       CHECK (str       BETWEEN 1 AND 5),
  ADD CONSTRAINT dex_range       CHECK (dex       BETWEEN 1 AND 5),
  ADD CONSTRAINT con_range       CHECK (con       BETWEEN 1 AND 5),
  ADD CONSTRAINT int_score_range CHECK (int_score BETWEEN 1 AND 5),
  ADD CONSTRAINT wis_range       CHECK (wis       BETWEEN 1 AND 5),
  ADD CONSTRAINT cha_range       CHECK (cha       BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS total_xp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spent_xp INT NOT NULL DEFAULT 0;
