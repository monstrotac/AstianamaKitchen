-- Remap skill attributes from the old 6-attribute system to the new 9-attribute system.
-- CON -> STA, WIS -> PER/WIT (per skill), CHA split across CHA/MAN/APP

-- CON skills -> STA
UPDATE spire_skills SET attribute = 'sta' WHERE attribute = 'con';

-- WIS skills -> PER (perception-based)
UPDATE spire_skills SET attribute = 'per'
  WHERE attribute = 'wis'
    AND skill_name IN ('Animal Ken', 'Awareness', 'Empathy', 'Search');

-- WIS skills -> WIT (mental discipline)
UPDATE spire_skills SET attribute = 'wit'
  WHERE attribute = 'wis'
    AND skill_name IN ('Force Intuition', 'High Ritual', 'Lucid Dreaming', 'Meditation');

-- WIS skills -> MAN (social manipulation)
UPDATE spire_skills SET attribute = 'man'
  WHERE attribute = 'wis'
    AND skill_name IN ('Politics');

-- WIS skills -> STA (endurance)
UPDATE spire_skills SET attribute = 'sta'
  WHERE attribute = 'wis'
    AND skill_name IN ('Survival');

-- Catch any remaining WIS skills (fallback to PER)
UPDATE spire_skills SET attribute = 'per' WHERE attribute = 'wis';

-- CHA skills -> APP (appearance/presence)
UPDATE spire_skills SET attribute = 'app'
  WHERE attribute = 'cha'
    AND skill_name IN ('Artistic Expression', 'Seduction');

-- CHA skills -> MAN (manipulation/subterfuge)
UPDATE spire_skills SET attribute = 'man'
  WHERE attribute = 'cha'
    AND skill_name IN ('Etiquette', 'Intimidation', 'Media', 'Streetwise', 'Subterfuge');

-- CHA skills -> INT (intellectual)
UPDATE spire_skills SET attribute = 'int_score'
  WHERE attribute = 'cha'
    AND skill_name IN ('Crafts');

-- Remaining CHA skills stay as CHA (personality-based)
-- Acting, Carousing, Expression, Leadership remain under CHA
