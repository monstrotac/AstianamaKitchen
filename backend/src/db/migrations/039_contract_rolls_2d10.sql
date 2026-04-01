-- Migrate contract_rolls from 1d20 to 2d10 system.
-- Renames natural_roll -> die1, adds die2, updates outcome values.

-- 1. Drop the old range constraint on natural_roll
ALTER TABLE contract_rolls DROP CONSTRAINT IF EXISTS contract_rolls_natural_roll_check;

-- 2. Rename natural_roll to die1
ALTER TABLE contract_rolls RENAME COLUMN natural_roll TO die1;

-- 3. Add die2 column
ALTER TABLE contract_rolls ADD COLUMN IF NOT EXISTS die2 INT NOT NULL DEFAULT 1;

-- 4. For existing rows, set die2 to a reasonable value
-- (old d20 data cannot perfectly map; die1 stays as-is clamped to 1-10)
UPDATE contract_rolls SET
  die1 = GREATEST(1, LEAST(10, die1)),
  die2 = GREATEST(1, LEAST(10, die1));

-- 5. Add new range constraints for 2d10
ALTER TABLE contract_rolls
  ADD CONSTRAINT die1_range CHECK (die1 BETWEEN 1 AND 10),
  ADD CONSTRAINT die2_range CHECK (die2 BETWEEN 1 AND 10);

-- 6. Update outcome values from d20 to 2d10 terminology
UPDATE contract_rolls SET outcome = 'crit_success' WHERE outcome = 'nat20';
UPDATE contract_rolls SET outcome = 'crit_failure' WHERE outcome = 'nat1';

-- 7. Drop old outcome constraint and add new one
ALTER TABLE contract_rolls DROP CONSTRAINT IF EXISTS contract_rolls_outcome_check;
ALTER TABLE contract_rolls
  ADD CONSTRAINT contract_rolls_outcome_check
    CHECK (outcome IN ('success','failure','crit_success','crit_failure'));

-- 8. Add margin and damage_tier columns for combat rolls
ALTER TABLE contract_rolls
  ADD COLUMN IF NOT EXISTS margin      INT,
  ADD COLUMN IF NOT EXISTS damage_tier TEXT;
