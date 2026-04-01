// ── Attribute modifier — the score IS the modifier (1 to 5) ─────────────────
export const ATTR_MOD = score => score ?? 0;

// ── 9 Attributes (Physical / Social / Mental) ───────────────────────────────
export const ATTRS = ['str', 'dex', 'sta', 'cha', 'man', 'app', 'per', 'int_score', 'wit'];

export const ATTR_LABELS = {
  str: 'STR', dex: 'DEX', sta: 'STA',
  cha: 'CHA', man: 'MAN', app: 'APP',
  per: 'PER', int_score: 'INT', wit: 'WIT',
};

export const ATTRIBUTE_FULL_NAMES = {
  str: 'Strength', dex: 'Dexterity', sta: 'Stamina',
  cha: 'Charisma', man: 'Manipulation', app: 'Appearance',
  per: 'Perception', int_score: 'Intelligence', wit: 'Wits',
};

export const ATTRIBUTE_DESCRIPTIONS = {
  str: 'Raw physical power. Governs melee damage, lifting, and feats of brute force.',
  dex: 'Agility, reflexes, and hand-eye coordination. Governs ranged accuracy, evasion, and finesse.',
  sta: 'Endurance, resilience, and physical toughness. Governs health, poison resistance, and staying power.',
  cha: 'Personal magnetism, social influence, and force of personality. Governs persuasion and leadership.',
  man: 'Ability to twist others to your point of view and get what you want through subtlety and cunning.',
  app: 'First impressions, bearing, and the ability to appeal to others through looks and presence.',
  per: 'Awareness of your surroundings, alertness, and the ability to notice details others miss.',
  int_score: 'Cognitive ability, memory, and analytical reasoning. Governs technical and academic skills.',
  wit: 'Quick thinking and mental reflexes. The ability to react swiftly and think on your feet.',
};

export const ATTRIBUTE_CATEGORIES = {
  Physical: ['str', 'dex', 'sta'],
  Social:   ['cha', 'man', 'app'],
  Mental:   ['per', 'int_score', 'wit'],
};

export const ATTRIBUTE_MIN = 0;
export const ATTRIBUTE_MAX = 5;
export const ATTRIBUTE_DEFAULT = 0;

// ── Force System ─────────────────────────────────────────────────────────────
export const FORCE_ATTUNEMENT_MIN = 0;
export const FORCE_ATTUNEMENT_MAX = 10;
export const WILLPOWER_MIN = 0;
export const WILLPOWER_MAX = 10;
export const DISCIPLINE_MIN = 0;
export const DISCIPLINE_MAX = 5;
export const DISCIPLINE_NAMES = ['control', 'sense', 'alter'];

// ── Rank Tiers ───────────────────────────────────────────────────────────────
export const RANK_TIERS = ['—', 'Novice', 'Trained', 'Skilled', 'Expert', 'Master'];

// ── DC Options (2d10 system) ─────────────────────────────────────────────────
export const DC_OPTIONS = [
  { value: 6,  label: 'Routine - DC 6' },
  { value: 8,  label: 'Simple - DC 8' },
  { value: 12, label: 'Standard - DC 12' },
  { value: 16, label: 'Demanding - DC 16' },
  { value: 20, label: 'Punishing - DC 20' },
  { value: 24, label: 'Extreme - DC 24' },
  { value: 28, label: 'Impossible - DC 28' },
  { value: -1, label: 'Custom DC\u2026' },
];

// ── Damage Tiers (margin-based) ──────────────────────────────────────────────
export const DAMAGE_TIERS = [
  { min: 0,  max: 3,        label: 'Glancing',     damage: 1 },
  { min: 4,  max: 6,        label: 'Solid',        damage: 2 },
  { min: 7,  max: 9,        label: 'Hard',         damage: 3 },
  { min: 10, max: Infinity,  label: 'Devastating',  damage: 4 },
];

// ── Armor Types ──────────────────────────────────────────────────────────────
export const ARMOR_TYPES = [
  { name: 'Unarmored', soak: 0, dodgePenalty: 0 },
  { name: 'Light',     soak: 1, dodgePenalty: 0 },
  { name: 'Medium',    soak: 2, dodgePenalty: -2 },
  { name: 'Heavy',     soak: 3, dodgePenalty: -4 },
];

// ── Canonical skill list ─────────────────────────────────────────────────────
export const SKILL_LIST = [
  // Strength
  { skill_name: 'Athletics',      attribute: 'str' },
  { skill_name: 'Brawl',          attribute: 'str' },
  { skill_name: 'Melee',          attribute: 'str' },
  // Dexterity
  { skill_name: 'Acrobatics',     attribute: 'dex' },
  { skill_name: 'Stealth',        attribute: 'dex' },
  { skill_name: 'Blasters',       attribute: 'dex' },
  { skill_name: 'Lightsabers',    attribute: 'dex' },
  { skill_name: 'Piloting',       attribute: 'dex' },
  { skill_name: 'Ground Vehicles',attribute: 'dex' },
  { skill_name: 'Jetpack',        attribute: 'dex' },
  { skill_name: 'Riding',         attribute: 'dex' },
  { skill_name: 'Slugthrowers',   attribute: 'dex' },
  { skill_name: 'Swoop Bikes',    attribute: 'dex' },
  // Stamina
  { skill_name: 'Resilience',     attribute: 'sta' },
  { skill_name: 'Survival',       attribute: 'sta' },
  { skill_name: 'Metabolism',     attribute: 'sta' },
  // Charisma
  { skill_name: 'Acting',              attribute: 'cha' },
  { skill_name: 'Carousing',           attribute: 'cha' },
  { skill_name: 'Expression',          attribute: 'cha' },
  { skill_name: 'Leadership',          attribute: 'cha' },
  // Manipulation
  { skill_name: 'Etiquette',           attribute: 'man' },
  { skill_name: 'Intimidation',        attribute: 'man' },
  { skill_name: 'Media',               attribute: 'man' },
  { skill_name: 'Politics',            attribute: 'man' },
  { skill_name: 'Streetwise',          attribute: 'man' },
  { skill_name: 'Subterfuge',          attribute: 'man' },
  // Appearance
  { skill_name: 'Artistic Expression', attribute: 'app' },
  { skill_name: 'Seduction',           attribute: 'app' },
  // Perception
  { skill_name: 'Animal Ken',     attribute: 'per' },
  { skill_name: 'Awareness',      attribute: 'per' },
  { skill_name: 'Empathy',        attribute: 'per' },
  { skill_name: 'Search',         attribute: 'per' },
  // Intelligence
  { skill_name: 'Academics',               attribute: 'int_score' },
  { skill_name: 'Ancient Technology',       attribute: 'int_score' },
  { skill_name: 'Astrography',             attribute: 'int_score' },
  { skill_name: 'Biology',                 attribute: 'int_score' },
  { skill_name: 'Biotech',                 attribute: 'int_score' },
  { skill_name: 'Computing',               attribute: 'int_score' },
  { skill_name: 'Crafts',                  attribute: 'int_score' },
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
  // Wits
  { skill_name: 'Force Intuition',attribute: 'wit' },
  { skill_name: 'High Ritual',    attribute: 'wit' },
  { skill_name: 'Lucid Dreaming', attribute: 'wit' },
  { skill_name: 'Meditation',     attribute: 'wit' },
];

// ── Saving throws ────────────────────────────────────────────────────────────
export const SAVING_THROWS = [
  { key: 'fortitude', label: 'Fortitude', attr: 'sta' },
  { key: 'reflex',    label: 'Reflex',    attr: 'dex' },
  { key: 'willpower', label: 'Willpower', attr: 'wit' },
];

// ── Combat / weapon skills only (for attack rolls) ──────────────────────────
export const ATTACK_SKILLS = [
  { skill_name: 'Brawl',          attribute: 'str' },
  { skill_name: 'Melee',          attribute: 'str' },
  { skill_name: 'Blasters',       attribute: 'dex' },
  { skill_name: 'Slugthrowers',   attribute: 'dex' },
  { skill_name: 'Lightsabers',    attribute: 'dex' },
];

// ── Roll type definitions ────────────────────────────────────────────────────
export const ROLL_TYPES = [
  { value: 'attack',       label: 'Attack' },
  { value: 'skill',        label: 'Skill Check' },
  { value: 'attribute',    label: 'Attribute Check' },
  { value: 'saving_throw', label: 'Saving Throw' },
];

// ── XP costs ─────────────────────────────────────────────────────────────────
export const XP_COST = {
  attribute:  v => v * 4,
  skill:      v => v * 3,
  forcePower: v => v * 5,
};

// ── Suggested starting XP by rank (not enforced) ────────────────────────────
export const STARTING_XP = { acolyte: 30, apprentice: 65, lord: 110, darth: 170 };

// ── Generic combat ability computation ──────────────────────────────────────
export function computeCombatAbility(formula, attrs, skills = []) {
  const attrMod = ATTR_MOD(attrs[formula.attribute_key]);
  let value = attrMod;
  if (formula.skill_name) {
    const sk = skills.find(s => s.skill_name === formula.skill_name);
    const rank = sk?.rank ?? 0;
    value += rank * (formula.skill_multiplier ?? 2);
  }
  if (formula.base_value != null) value += formula.base_value;
  if (formula.minimum_value != null) value = Math.max(formula.minimum_value, value);
  return value;
}

// ── Damage tier from margin ─────────────────────────────────────────────────
export function computeDamageTier(margin) {
  for (const tier of DAMAGE_TIERS) {
    if (margin >= tier.min && margin <= tier.max) {
      return { label: tier.label, damage: tier.damage };
    }
  }
  return { label: 'Devastating', damage: 4 };
}

// ── Derived stats ────────────────────────────────────────────────────────────
export const computeHealth = (attrs, skills = []) =>
  Math.max(2, 2 + (attrs.sta ?? 0) + (skills.find(s => s.skill_name === 'Resilience')?.rank ?? 0));

export const computeDefense = (attrs) => 10 + (attrs.dex ?? 0);

export const computeXPSpent = (attrs, skills = []) => {
  const attrCost  = ATTRS.reduce((sum, k) => sum + XP_COST.attribute(attrs[k] ?? 0), 0);
  const skillCost = skills.reduce((sum, s) => sum + XP_COST.skill(s.rank ?? 0), 0);
  return attrCost + skillCost;
};

// ── Compute total modifier for a roll ───────────────────────────────────────
/**
 * @param {object} opts
 * @param {'attack'|'attribute'|'skill'|'saving_throw'} opts.rollType
 * @param {string}  opts.attrKey   - attribute key for attack/attribute/saving throw rolls
 * @param {string}  opts.saveKey   - 'fortitude'|'reflex'|'willpower' for saving throws
 * @param {object}  opts.attrs     - { str, dex, sta, cha, man, app, per, int_score, wit }
 * @param {array}   opts.skills    - spire_skills rows with { skill_name, attribute, rank }
 * @param {string}  opts.skillKey  - skill_name for skill/attack rolls
 * @returns {{ attrMod: number, skillRank: number, total: number, label: string }}
 */
export function getRollBonus({ rollType, attrKey, saveKey, attrs = {}, skills = [], skillKey }) {
  if (rollType === 'attack') {
    const sk       = skills.find(s => s.skill_name === skillKey);
    const linked   = sk?.attribute || attrKey || 'str';
    const attrMod  = ATTR_MOD(attrs[linked]);
    const skillRank = sk?.rank ?? 0;
    return { attrMod, skillRank, total: attrMod + skillRank * 2, label: skillKey || 'Attack' };
  }

  if (rollType === 'attribute') {
    const key    = attrKey || 'str';
    const attrMod = ATTR_MOD(attrs[key]);
    return { attrMod, skillRank: 0, total: attrMod, label: `${ATTR_LABELS[key]} Check` };
  }

  if (rollType === 'skill') {
    const sk       = skills.find(s => s.skill_name === skillKey);
    const linked   = sk?.attribute || attrKey || 'str';
    const attrMod  = ATTR_MOD(attrs[linked]);
    const skillRank = sk?.rank ?? 0;
    return { attrMod, skillRank, total: attrMod + skillRank * 2, label: skillKey || 'Skill Check' };
  }

  if (rollType === 'saving_throw') {
    const save    = SAVING_THROWS.find(s => s.key === saveKey) || SAVING_THROWS[0];
    const attrMod = ATTR_MOD(attrs[save.attr]);
    return { attrMod, skillRank: 0, total: attrMod, label: `${save.label} Save` };
  }

  return { attrMod: 0, skillRank: 0, total: 0, label: 'Unknown' };
}
