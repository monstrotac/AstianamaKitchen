-- Migrate from 6 attributes (STR/DEX/CON/INT/WIS/CHA) to 9 attributes
-- (STR/DEX/STA/CHA/MAN/APP/PER/INT/WIT) plus Force and Armor systems.
-- Maps: CON -> STA, WIS -> WIT. New: MAN, APP, PER default to 1.

-- 1. Add new attribute columns
ALTER TABLE spire_characters
  ADD COLUMN IF NOT EXISTS sta INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS man INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS app INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS per INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS wit INT NOT NULL DEFAULT 1;

-- 2. Populate from existing data
UPDATE spire_characters SET
  sta = GREATEST(1, LEAST(5, con)),
  wit = GREATEST(1, LEAST(5, wis));

-- 3. Drop old constraints
ALTER TABLE spire_characters
  DROP CONSTRAINT IF EXISTS con_range,
  DROP CONSTRAINT IF EXISTS wis_range;

-- 4. Drop old columns
ALTER TABLE spire_characters
  DROP COLUMN IF EXISTS con,
  DROP COLUMN IF EXISTS wis;

-- 5. Clamp existing attributes to 1-5
UPDATE spire_characters SET
  str       = GREATEST(1, LEAST(5, str)),
  dex       = GREATEST(1, LEAST(5, dex)),
  cha       = GREATEST(1, LEAST(5, cha)),
  int_score = GREATEST(1, LEAST(5, int_score));

-- 6. Add range constraints for all 9 attributes
ALTER TABLE spire_characters
  ADD CONSTRAINT sta_range       CHECK (sta       BETWEEN 1 AND 5),
  ADD CONSTRAINT man_range       CHECK (man       BETWEEN 1 AND 5),
  ADD CONSTRAINT app_range       CHECK (app       BETWEEN 1 AND 5),
  ADD CONSTRAINT per_range       CHECK (per       BETWEEN 1 AND 5),
  ADD CONSTRAINT wit_range       CHECK (wit       BETWEEN 1 AND 5);

-- 7. Add Force system columns
ALTER TABLE spire_characters
  ADD COLUMN IF NOT EXISTS force_attunement INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS willpower_score  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS control          INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sense            INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alter_discipline INT NOT NULL DEFAULT 0;

ALTER TABLE spire_characters
  ADD CONSTRAINT force_attunement_range CHECK (force_attunement BETWEEN 0 AND 10),
  ADD CONSTRAINT willpower_score_range  CHECK (willpower_score  BETWEEN 0 AND 10),
  ADD CONSTRAINT control_range          CHECK (control          BETWEEN 0 AND 5),
  ADD CONSTRAINT sense_range            CHECK (sense            BETWEEN 0 AND 5),
  ADD CONSTRAINT alter_discipline_range CHECK (alter_discipline BETWEEN 0 AND 5);

-- 8. Add Armor column
ALTER TABLE spire_characters
  ADD COLUMN IF NOT EXISTS armor TEXT NOT NULL DEFAULT 'unarmored';

ALTER TABLE spire_characters
  ADD CONSTRAINT armor_type CHECK (armor IN ('unarmored','light','medium','heavy'));
