-- Replace binary proficiency/expertise flags with a numeric rank (0-5)
-- Purge old DND/FRC skill rows — all invalid under new system

ALTER TABLE spire_skills
  DROP COLUMN IF EXISTS is_proficient,
  DROP COLUMN IF EXISTS is_expert,
  DROP COLUMN IF EXISTS description,
  ADD COLUMN IF NOT EXISTS rank INT NOT NULL DEFAULT 0
    CHECK (rank BETWEEN 0 AND 5);

-- Wipe old skill rows (mapped to DND skills that no longer exist)
TRUNCATE spire_skills;
