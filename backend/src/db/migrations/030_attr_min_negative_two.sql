-- Change attribute minimum from 1 to -2 (starting characters begin at -2)

-- Drop old range constraints
ALTER TABLE spire_characters
  DROP CONSTRAINT IF EXISTS str_range,
  DROP CONSTRAINT IF EXISTS dex_range,
  DROP CONSTRAINT IF EXISTS con_range,
  DROP CONSTRAINT IF EXISTS int_score_range,
  DROP CONSTRAINT IF EXISTS wis_range,
  DROP CONSTRAINT IF EXISTS cha_range;

-- Move all characters currently at 1 (the old floor) down to -2
UPDATE spire_characters SET str       = -2 WHERE str       = 1;
UPDATE spire_characters SET dex       = -2 WHERE dex       = 1;
UPDATE spire_characters SET con       = -2 WHERE con       = 1;
UPDATE spire_characters SET int_score = -2 WHERE int_score = 1;
UPDATE spire_characters SET wis       = -2 WHERE wis       = 1;
UPDATE spire_characters SET cha       = -2 WHERE cha       = 1;

-- Set new defaults and constraints
ALTER TABLE spire_characters
  ALTER COLUMN str       SET DEFAULT -2,
  ALTER COLUMN dex       SET DEFAULT -2,
  ALTER COLUMN con       SET DEFAULT -2,
  ALTER COLUMN int_score SET DEFAULT -2,
  ALTER COLUMN wis       SET DEFAULT -2,
  ALTER COLUMN cha       SET DEFAULT -2,
  ADD CONSTRAINT str_range       CHECK (str       BETWEEN -2 AND 5),
  ADD CONSTRAINT dex_range       CHECK (dex       BETWEEN -2 AND 5),
  ADD CONSTRAINT con_range       CHECK (con       BETWEEN -2 AND 5),
  ADD CONSTRAINT int_score_range CHECK (int_score BETWEEN -2 AND 5),
  ADD CONSTRAINT wis_range       CHECK (wis       BETWEEN -2 AND 5),
  ADD CONSTRAINT cha_range       CHECK (cha       BETWEEN -2 AND 5);
