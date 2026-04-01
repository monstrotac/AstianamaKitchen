import { ATTR_LABELS, ARMOR_TYPES, computeCombatAbility } from '../../utils/rollUtils';

const modStr = v => (v >= 0 ? `+${v}` : `${v}`);

const SECTION_TITLES = {
  attack: 'Attack',
  defense: 'Defense',
  saving_throw: 'Saving Throws',
};
const SECTION_ORDER = ['attack', 'defense', 'saving_throw'];

const ARMOR_LABELS = {
  unarmored: 'Unarmored (0 soak)',
  light: 'Light (1 soak)',
  medium: 'Medium (2 soak, -2 dodge)',
  heavy: 'Heavy (3 soak, -4 dodge)',
};

const getArmorInfo = armor =>
  ARMOR_TYPES.find(a => a.name.toLowerCase() === armor) ?? ARMOR_TYPES[0];

export default function CombatPanel({
  attrs, skills = [], combatAbilities = [], armor = 'unarmored',
  editing = false, onArmorChange, onRoll,
}) {
  const armorInfo = getArmorInfo(armor);

  // Group combat abilities by type
  const grouped = {};
  for (const ca of combatAbilities) {
    if (!grouped[ca.type]) grouped[ca.type] = [];
    grouped[ca.type].push(ca);
  }
  const derivedStats = grouped['derived_stat'] ?? [];

  // Build skill rank lookup for computeCombatAbility
  // combatAbilities use skill_name (snake_case DB fields)
  // skills from the API have { skill_name, attribute, rank }
  const skillRanks = skills.map(s => ({
    skill_name: s.skill_name,
    attribute: s.attribute,
    rank: s.rank ?? 0,
  }));

  return (
    <div>
      {/* Armor selector */}
      <div className="s-combat-armor-row">
        <span className="s-combat-armor-label">Armor</span>
        {editing && onArmorChange ? (
          <div className="s-armor-picker">
            {Object.entries(ARMOR_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`s-armor-option${armor === key ? ' active' : ''}`}
                onClick={() => onArmorChange(key)}
              >
                <span className="s-armor-option-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="s-armor-option-detail">
                  {key === 'unarmored' ? '0 soak' : key === 'light' ? '1 soak' : key === 'medium' ? '2 soak, -2 dodge' : '3 soak, -4 dodge'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '0.72rem' }}>{ARMOR_LABELS[armor]}</span>
        )}
      </div>

      <div className="s-combat-panel">
        {SECTION_ORDER.map(type => {
          const items = grouped[type];
          if (!items?.length) return null;
          return (
            <div key={type} className="s-combat-section">
              <div className="s-combat-section-title">{SECTION_TITLES[type]}</div>
              {items.map(ca => {
                const formula = {
                  attribute_key: ca.attribute_key,
                  alternate_attribute_keys: ca.alternate_attribute_keys ?? [],
                  skill_name: ca.skill_name,
                  skill_multiplier: ca.skill_multiplier ?? 2,
                  base_value: ca.base_value,
                  minimum_value: ca.minimum_value,
                };
                let bonus = computeCombatAbility(formula, attrs, skillRanks);
                const allKeys = [formula.attribute_key, ...(formula.alternate_attribute_keys)];
                const hasAlternates = allKeys.length > 1;

                const isDodge = type === 'defense' && ca.name === 'Dodge';
                const dodgePenalty = isDodge ? armorInfo.dodgePenalty : 0;
                bonus += dodgePenalty;

                const isDefense = type === 'defense';
                const staticDC = isDefense ? 10 + bonus : null;

                const attrOptions = hasAlternates
                  ? allKeys.map(key => {
                      const altFormula = { ...formula, attribute_key: key };
                      let mod = computeCombatAbility(altFormula, attrs, skillRanks);
                      if (isDodge) mod += dodgePenalty;
                      return { key, label: ATTR_LABELS[key] ?? key, modifier: mod };
                    })
                  : undefined;

                const isCombatRoll = type === 'attack';

                return (
                  <div key={ca.id} className="s-combat-row">
                    <div className="s-combat-left">
                      <span className="s-combat-bonus">{modStr(bonus)}</span>
                      <span className="s-combat-name">
                        {ca.name}
                        {isDodge && dodgePenalty !== 0 && (
                          <span className="s-penalty-note"> ({dodgePenalty})</span>
                        )}
                      </span>
                      <span className="s-combat-attr">
                        {allKeys.map(k => ATTR_LABELS[k] ?? k).join('/')}
                        {ca.skill_name ? ` + ${ca.skill_name}` : ''}
                      </span>
                    </div>
                    <div className="s-combat-right">
                      {isDefense && staticDC != null && (
                        <span className="s-dc-badge">DC {staticDC}</span>
                      )}
                      {!editing && onRoll && (
                        <button
                          type="button"
                          className="s-btn small"
                          onClick={() => onRoll(ca.name, bonus, attrOptions, isCombatRoll)}
                        >
                          Roll
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Soak display */}
      {armorInfo.soak > 0 && (
        <div className="s-derived-stat-row">
          <span className="s-derived-stat-label">Soak</span>
          <span className="s-derived-stat-value">{armorInfo.soak}</span>
          <span className="s-derived-stat-breakdown">({armorInfo.name} armor)</span>
        </div>
      )}

      {/* Derived Stats (HP, Toxin Resistance) */}
      {derivedStats.map(ca => {
        const formula = {
          attribute_key: ca.attribute_key,
          skill_name: ca.skill_name,
          skill_multiplier: ca.skill_multiplier ?? 1,
          base_value: ca.base_value,
          minimum_value: ca.minimum_value,
        };
        const value = computeCombatAbility(formula, attrs, skillRanks);
        const attrMod = attrs[ca.attribute_key] ?? 0;
        const skillRank = ca.skill_name
          ? (skillRanks.find(s => s.skill_name === ca.skill_name)?.rank ?? 0)
          : 0;
        return (
          <div key={ca.id} className="s-derived-stat-row">
            <span className="s-derived-stat-label">{ca.name}</span>
            <span className="s-derived-stat-value">{value}</span>
            <span className="s-derived-stat-breakdown">
              ({ca.base_value != null ? `${ca.base_value} + ` : ''}
              {ATTR_LABELS[ca.attribute_key]} {modStr(attrMod)}
              {ca.skill_name ? ` + ${ca.skill_name} ${skillRank}` : ''})
            </span>
          </div>
        );
      })}

      {combatAbilities.length === 0 && (
        <div style={{ opacity: 0.5, fontSize: '0.75rem', padding: '0.5rem 0' }}>
          No combat abilities defined. Run the seed script to populate defaults.
        </div>
      )}
    </div>
  );
}
