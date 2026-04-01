-- Normalize all 9 attributes to range -2 to 5
-- str, dex, cha, int_score already BETWEEN -2 AND 5 from migration 030
-- Update sta, man, app, per, wit from BETWEEN 1 AND 5 to BETWEEN -2 AND 5

ALTER TABLE spire_characters
  DROP CONSTRAINT IF EXISTS sta_range,
  DROP CONSTRAINT IF EXISTS man_range,
  DROP CONSTRAINT IF EXISTS app_range,
  DROP CONSTRAINT IF EXISTS per_range,
  DROP CONSTRAINT IF EXISTS wit_range;

ALTER TABLE spire_characters
  ADD CONSTRAINT sta_range CHECK (sta BETWEEN -2 AND 5),
  ADD CONSTRAINT man_range CHECK (man BETWEEN -2 AND 5),
  ADD CONSTRAINT app_range CHECK (app BETWEEN -2 AND 5),
  ADD CONSTRAINT per_range CHECK (per BETWEEN -2 AND 5),
  ADD CONSTRAINT wit_range CHECK (wit BETWEEN -2 AND 5);

-- Set default for new characters to 0 (average)
ALTER TABLE spire_characters
  ALTER COLUMN str       SET DEFAULT 0,
  ALTER COLUMN dex       SET DEFAULT 0,
  ALTER COLUMN sta       SET DEFAULT 0,
  ALTER COLUMN cha       SET DEFAULT 0,
  ALTER COLUMN man       SET DEFAULT 0,
  ALTER COLUMN app       SET DEFAULT 0,
  ALTER COLUMN per       SET DEFAULT 0,
  ALTER COLUMN int_score SET DEFAULT 0,
  ALTER COLUMN wit       SET DEFAULT 0;
