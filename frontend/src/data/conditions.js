// ── Conditions (status effects with mechanical modifiers) ────────────────────
// Modifier keys:
//   ownAttack      — penalty to this character's attack rolls
//   allRolls       — penalty to ALL this character's rolls
//   allDefense     — penalty to ALL defense DCs
//   dodgeBonus     — penalty specifically to Dodge DC
//   noDodge        — cannot use Dodge defense
//   cantAct        — cannot take actions (narrative)
//   cantUseWeapon  — cannot use weapon-based attacks/defenses
//   narrativeOnly  — no mechanical modifier
//   meleeDefenseBonus — modifier to defense DC vs melee attacks (negative = easier to hit)
//   rangedDefenseBonus — modifier to defense DC vs ranged attacks (positive = harder to hit)

export const CONDITIONS = [
  {
    id: 'prone',
    name: 'Prone',
    description: '-2 own attacks; melee vs you +2; ranged vs you -2',
    modifiers: { ownAttack: -2, meleeDefenseBonus: -2, rangedDefenseBonus: 2 },
  },
  {
    id: 'stunned',
    name: 'Stunned',
    description: "Can't act; -4 defense (1 turn)",
    modifiers: { cantAct: true, allDefense: -4 },
  },
  {
    id: 'disarmed',
    name: 'Disarmed',
    description: "Can't use weapon; Action to retrieve",
    modifiers: { cantUseWeapon: true },
  },
  {
    id: 'grappled',
    name: 'Grappled',
    description: 'Immobile; -2 attacks; no Dodge',
    modifiers: { ownAttack: -2, noDodge: true },
  },
  {
    id: 'blinded',
    name: 'Blinded',
    description: '-4 attacks; -2 Dodge',
    modifiers: { ownAttack: -4, dodgeBonus: -2 },
  },
  {
    id: 'immobilized',
    name: 'Immobilized',
    description: "Can't move; -2 Dodge",
    modifiers: { dodgeBonus: -2 },
  },
  {
    id: 'frightened',
    name: 'Frightened',
    description: '-2 all rolls vs source; can\'t approach',
    modifiers: { allRolls: -2 },
  },
  {
    id: 'slowed',
    name: 'Slowed',
    description: "-2 Dodge; can't close distance",
    modifiers: { dodgeBonus: -2 },
  },
  {
    id: 'mind_controlled',
    name: 'Mind-Controlled',
    description: 'Actions controlled by caster',
    modifiers: { narrativeOnly: true },
  },
  {
    id: 'wounded',
    name: 'Wounded',
    description: '-2 to all rolls (at 1 HP)',
    autoApply: true,
    modifiers: { allRolls: -2 },
  },
];

export const CONDITIONS_MAP = Object.fromEntries(CONDITIONS.map(c => [c.id, c]));

// ── Force Powers ─────────────────────────────────────────────────────────────
export const FORCE_POWERS = [
  {
    id: 'combat_enhancement',
    name: 'Combat Enhancement',
    actionType: 'Minor',
    fpCost: 1,
    targetType: 'self',
    description: '+2 attack AND defense this round',
  },
  {
    id: 'force_speed',
    name: 'Force Speed',
    actionType: 'Minor',
    fpCost: 2,
    targetType: 'self',
    description: 'Two attacks, close+attack, or disengage+attack',
  },
  {
    id: 'force_lightning',
    name: 'Force Lightning',
    actionType: 'Action',
    fpCost: 2,
    targetType: 'other',
    description: 'Flat 2 damage + Stunned. Dark Side only.',
  },
  {
    id: 'force_push',
    name: 'Force Push',
    actionType: 'Action',
    fpCost: 1,
    targetType: 'other',
    description: 'Roll vs target — margin damage + Prone + knockback',
  },
  {
    id: 'force_healing',
    name: 'Force Healing',
    actionType: 'Action',
    fpCost: 1,
    targetType: 'self_roll',
    description: 'Restores HP based on margin. DC increases per use.',
  },
  {
    id: 'force_barrier',
    name: 'Force Barrier',
    actionType: 'Minor',
    fpCost: 1,
    targetType: 'self',
    description: '+2 soak this round',
  },
];

// Melee weapon skills (used for Prone defense modifier)
export const MELEE_SKILLS = ['Brawl', 'Melee', 'Lightsabers'];
