-- Combat ability definitions table — stores formulas for attacks, defenses,
-- saving throws, and derived stats.

CREATE TABLE IF NOT EXISTS combat_ability_definitions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT NOT NULL UNIQUE,
  type                     TEXT NOT NULL CHECK (type IN ('attack','defense','saving_throw','derived_stat')),
  attribute_key            TEXT NOT NULL,
  alternate_attribute_keys TEXT[] DEFAULT '{}',
  skill_name               TEXT,
  skill_multiplier         INT DEFAULT 2,
  base_value               INT,
  minimum_value            INT,
  description              TEXT DEFAULT '',
  sort_order               INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_combat_ability_type ON combat_ability_definitions(type, sort_order);

-- Seed all 14 combat abilities

-- Attacks
INSERT INTO combat_ability_definitions (name, type, attribute_key, alternate_attribute_keys, skill_name, skill_multiplier, description, sort_order) VALUES
  ('Brawl Attack',       'attack', 'str', '{dex}', 'Brawl',        2, 'STR + Brawl',        0),
  ('Melee Attack',       'attack', 'str', '{dex}', 'Melee',        2, 'STR + Melee',        1),
  ('Blaster Attack',     'attack', 'dex', '{str}', 'Blasters',     2, 'DEX + Blasters',     2),
  ('Slugthrower Attack', 'attack', 'dex', '{str}', 'Slugthrowers', 2, 'DEX + Slugthrowers', 3),
  ('Lightsaber Attack',  'attack', 'dex', '{str}', 'Lightsabers',  2, 'DEX + Lightsabers',  4);

-- Defenses
INSERT INTO combat_ability_definitions (name, type, attribute_key, alternate_attribute_keys, skill_name, skill_multiplier, description, sort_order) VALUES
  ('Dodge',            'defense', 'dex', '{str}', 'Acrobatics',  2, 'DEX + Acrobatics',  0),
  ('Melee Parry',      'defense', 'str', '{dex}', 'Melee',       2, 'STR + Melee',       1),
  ('Lightsaber Parry', 'defense', 'dex', '{str}', 'Lightsabers', 2, 'DEX + Lightsabers', 2),
  ('Brawl Parry',      'defense', 'str', '{dex}', 'Brawl',       2, 'STR + Brawl',       3);

-- Saving Throws
INSERT INTO combat_ability_definitions (name, type, attribute_key, alternate_attribute_keys, skill_name, skill_multiplier, description, sort_order) VALUES
  ('Fortitude', 'saving_throw', 'sta', '{}', 'Resilience',      1, 'STA + Resilience (saves use x1 multiplier)',                   0),
  ('Reflex',    'saving_throw', 'dex', '{}', 'Acrobatics',      1, 'DEX + Acrobatics (saves use x1 multiplier)',                   1),
  ('Willpower', 'saving_throw', 'wit', '{}', 'Force Intuition', 1, 'WIT + Force Intuition or Meditation (saves use x1 multiplier)', 2);

-- Derived Stats
INSERT INTO combat_ability_definitions (name, type, attribute_key, alternate_attribute_keys, skill_name, skill_multiplier, base_value, minimum_value, description, sort_order) VALUES
  ('HP',               'derived_stat', 'sta', '{}', 'Resilience',  1, 2, 2, '2 + STA + Resilience (min 2)', 0),
  ('Toxin Resistance', 'derived_stat', 'sta', '{}', 'Metabolism',  1, NULL, NULL, 'STA + Metabolism',         1);
