CREATE TABLE IF NOT EXISTS skills_reference (
  id            SERIAL PRIMARY KEY,
  skill_name    TEXT UNIQUE NOT NULL,
  default_bonus INT NOT NULL,
  display_order INT NOT NULL
);

CREATE TABLE IF NOT EXISTS character_skill_overrides (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name  TEXT NOT NULL,
  bonus       INT NOT NULL,
  UNIQUE(user_id, skill_name)
);

-- Default skill list (matches existing site)
INSERT INTO skills_reference (skill_name, default_bonus, display_order) VALUES
  ('Assassination',              8, 1),
  ('Blade Mastery',              8, 2),
  ('Use of the Force',           8, 3),
  ('Stealth & Infiltration',     7, 4),
  ('Dexterity & Acrobatics',     7, 5),
  ('Investigation & Intel',      7, 6),
  ('Deception & Disguise',       6, 7),
  ('Force Intuition',            6, 8),
  ('Escape & Pursuit',           5, 9),
  ('Athletics',                  2, 10),
  ('Unarmed Engagement',         4, 11)
ON CONFLICT (skill_name) DO NOTHING;
