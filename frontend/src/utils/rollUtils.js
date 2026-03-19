// ── Attribute modifier — dot value IS the modifier (-2 to 5 scale) ──────────
export const ATTR_MOD = score => score ?? -2;

// ── Attribute display labels ──────────────────────────────────────────────────
export const ATTRS = ['str', 'dex', 'con', 'int_score', 'wis', 'cha'];
export const ATTR_LABELS = {
  str: 'STR', dex: 'DEX', con: 'CON', int_score: 'INT', wis: 'WIS', cha: 'CHA',
};

// ── Canonical skill list ───────────────────────────────────────────────────────
export const SKILL_LIST = [
  // Strength
  { skill_name: 'Athletics',      attribute: 'str' },
  { skill_name: 'Unarmed Combat', attribute: 'str' },
  { skill_name: 'Melee',          attribute: 'str' },
  // Dexterity
  { skill_name: 'Acrobatics',     attribute: 'dex' },
  { skill_name: 'Stealth',        attribute: 'dex' },
  { skill_name: 'Ranged Weapons', attribute: 'dex' },
  { skill_name: 'Lightsabers',    attribute: 'dex' },
  { skill_name: 'Piloting',       attribute: 'dex' },
  { skill_name: 'Ground Vehicles',attribute: 'dex' },
  { skill_name: 'Jetpack',        attribute: 'dex' },
  { skill_name: 'Riding',         attribute: 'dex' },
  { skill_name: 'Slugthrowers',   attribute: 'dex' },
  { skill_name: 'Swoop Bikes',    attribute: 'dex' },
  // Constitution
  { skill_name: 'Resilience',     attribute: 'con' },
  // Intelligence
  { skill_name: 'Academics',               attribute: 'int_score' },
  { skill_name: 'Ancient Technology',      attribute: 'int_score' },
  { skill_name: 'Astrography',             attribute: 'int_score' },
  { skill_name: 'Biology',                 attribute: 'int_score' },
  { skill_name: 'Biotech',                 attribute: 'int_score' },
  { skill_name: 'Computing',               attribute: 'int_score' },
  { skill_name: 'Demolitions',             attribute: 'int_score' },
  { skill_name: 'Droids',                  attribute: 'int_score' },
  { skill_name: 'Engineering',             attribute: 'int_score' },
  { skill_name: 'Enigmas',                 attribute: 'int_score' },
  { skill_name: 'Esoterica',               attribute: 'int_score' },
  { skill_name: 'Finance',                 attribute: 'int_score' },
  { skill_name: 'Force Alchemy',           attribute: 'int_score' },
  { skill_name: 'Force Knowledge',         attribute: 'int_score' },
  { skill_name: 'Force Traditions',        attribute: 'int_score' },
  { skill_name: 'Investigation',           attribute: 'int_score' },
  { skill_name: 'Law',                     attribute: 'int_score' },
  { skill_name: 'Medicine',                attribute: 'int_score' },
  { skill_name: 'Military',                attribute: 'int_score' },
  { skill_name: 'Pharmacopoeia/Poisons',   attribute: 'int_score' },
  { skill_name: 'Repair',                  attribute: 'int_score' },
  { skill_name: 'Research',                attribute: 'int_score' },
  { skill_name: 'Science',                 attribute: 'int_score' },
  { skill_name: 'Technology',              attribute: 'int_score' },
  { skill_name: 'Torture',                 attribute: 'int_score' },
  // Wisdom
  { skill_name: 'Animal Ken',      attribute: 'wis' },
  { skill_name: 'Awareness',      attribute: 'wis' },
  { skill_name: 'Empathy',        attribute: 'wis' },
  { skill_name: 'Force Intuition',attribute: 'wis' },
  { skill_name: 'High Ritual',    attribute: 'wis' },
  { skill_name: 'Lucid Dreaming', attribute: 'wis' },
  { skill_name: 'Meditation',     attribute: 'wis' },
  { skill_name: 'Politics',       attribute: 'wis' },
  { skill_name: 'Search',         attribute: 'wis' },
  { skill_name: 'Survival',       attribute: 'wis' },
  // Charisma
  { skill_name: 'Acting',              attribute: 'cha' },
  { skill_name: 'Artistic Expression', attribute: 'cha' },
  { skill_name: 'Carousing',           attribute: 'cha' },
  { skill_name: 'Crafts',              attribute: 'cha' },
  { skill_name: 'Etiquette',           attribute: 'cha' },
  { skill_name: 'Expression',          attribute: 'cha' },
  { skill_name: 'Intimidation',        attribute: 'cha' },
  { skill_name: 'Leadership',          attribute: 'cha' },
  { skill_name: 'Media',               attribute: 'cha' },
  { skill_name: 'Seduction',           attribute: 'cha' },
  { skill_name: 'Streetwise',          attribute: 'cha' },
  { skill_name: 'Subterfuge',          attribute: 'cha' },
];

// ── Saving throws ─────────────────────────────────────────────────────────────
export const SAVING_THROWS = [
  { key: 'fortitude', label: 'Fortitude', attr: 'con' },
  { key: 'reflex',    label: 'Reflex',    attr: 'dex' },
  { key: 'willpower', label: 'Willpower', attr: 'wis' },
];

// ── Combat / weapon skills only (for attack rolls) ────────────────────────────
export const ATTACK_SKILLS = [
  { skill_name: 'Unarmed Combat', attribute: 'str' },
  { skill_name: 'Melee',         attribute: 'str' },
  { skill_name: 'Ranged Weapons',attribute: 'dex' },
  { skill_name: 'Lightsabers',   attribute: 'dex' },
];

// ── Roll type definitions ─────────────────────────────────────────────────────
export const ROLL_TYPES = [
  { value: 'attack',       label: 'Attack' },
  { value: 'skill',        label: 'Skill Check' },
  { value: 'attribute',    label: 'Attribute Check' },
  { value: 'saving_throw', label: 'Saving Throw' },
];

// ── XP costs ──────────────────────────────────────────────────────────────────
export const XP_COST = {
  attribute:  v => v * 4,
  skill:      v => v * 3,
  forcePower: v => v * 5,
};

// ── Suggested starting XP by rank (not enforced) ─────────────────────────────
export const STARTING_XP = { acolyte: 30, apprentice: 65, lord: 110, darth: 170 };

// ── Derived stats ─────────────────────────────────────────────────────────────
export const computeHealth  = (attrs, skills = []) =>
  Math.max(2, 2 + (attrs.con ?? -2) + (skills.find(s => s.skill_name === 'Resilience')?.rank ?? 0));

export const computeDefense = (attrs) => 10 + (attrs.dex ?? -2);

export const computeXPSpent = (attrs, skills = []) => {
  const attrCost  = ATTRS.reduce((sum, k) => sum + XP_COST.attribute(attrs[k] ?? -2), 0);
  const skillCost = skills.reduce((sum, s) => sum + XP_COST.skill(s.rank ?? 0), 0);
  return attrCost + skillCost;
};

// ── Compute total modifier for a roll ────────────────────────────────────────
/**
 * @param {object} opts
 * @param {'attack'|'attribute'|'skill'|'saving_throw'} opts.rollType
 * @param {string}  opts.attrKey   - attribute key for attack/attribute/saving throw rolls
 * @param {string}  opts.saveKey   - 'fortitude'|'reflex'|'willpower' for saving throws
 * @param {object}  opts.attrs     - { str, dex, con, int_score, wis, cha }
 * @param {array}   opts.skills    - spire_skills rows with { skill_name, attribute, rank }
 * @param {string}  opts.skillKey  - skill_name for skill/attack rolls
 * @returns {{ attrMod: number, skillRank: number, total: number, label: string }}
 */
export function getRollBonus({ rollType, attrKey, saveKey, attrs = {}, skills = [], skillKey }) {
  if (rollType === 'attack') {
    const sk       = skills.find(s => s.skill_name === skillKey);
    const linked   = sk?.attribute || attrKey || 'str';
    const attrMod  = ATTR_MOD(attrs[linked] ?? -2);
    const skillRank = sk?.rank ?? 0;
    return { attrMod, skillRank, total: attrMod + skillRank * 2, label: skillKey || 'Attack' };
  }

  if (rollType === 'attribute') {
    const key    = attrKey || 'str';
    const attrMod = ATTR_MOD(attrs[key] ?? -2);
    return { attrMod, skillRank: 0, total: attrMod, label: `${ATTR_LABELS[key]} Check` };
  }

  if (rollType === 'skill') {
    const sk       = skills.find(s => s.skill_name === skillKey);
    const linked   = sk?.attribute || attrKey || 'str';
    const attrMod  = ATTR_MOD(attrs[linked] ?? -2);
    const skillRank = sk?.rank ?? 0;
    return { attrMod, skillRank, total: attrMod + skillRank * 2, label: sk?.skill_name || 'Skill Check' };
  }

  if (rollType === 'saving_throw') {
    const save    = SAVING_THROWS.find(s => s.key === saveKey) || SAVING_THROWS[0];
    const attrMod = ATTR_MOD(attrs[save.attr] ?? -2);
    return { attrMod, skillRank: 0, total: attrMod, label: `${save.label} Save` };
  }

  return { attrMod: 0, skillRank: 0, total: 0, label: 'Unknown' };
}
