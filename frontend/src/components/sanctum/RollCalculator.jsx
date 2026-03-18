/**
 * RollCalculator — shared roll UI used in Contracts (RollForm) and Trials.
 *
 * Props:
 *   attrs       { str, dex, con, int_score, wis, cha }
 *   skills      array of { skill_name, attribute, rank }
 *   onChange    called with { rollType, label, attrMod, skillRank, totalMod, nat, total, dc, outcome }
 *               whenever any field changes
 *   compact     bool — renders without outer panel chrome (for embedding)
 */
import { useState, useRef, useCallback } from 'react';
import {
  ATTRS, ATTR_LABELS, SKILL_LIST, ATTACK_SKILLS,
  SAVING_THROWS, ROLL_TYPES, getRollBonus,
} from '../../utils/rollUtils';

const DC_OPTS = [
  { v: 10, l: 'Easy — DC 10' },
  { v: 15, l: 'Standard — DC 15' },
  { v: 20, l: 'Hard — DC 20' },
  { v: 25, l: 'Very Hard — DC 25' },
  { v: 30, l: 'Near Impossible — DC 30' },
  { v: 'custom', l: 'Custom DC…' },
];

function outcomeClass(outcome) {
  if (!outcome) return '';
  if (outcome === 'nat20') return 'rc-outcome nat20';
  if (outcome === 'nat1')  return 'rc-outcome nat1';
  if (outcome === 'success') return 'rc-outcome success';
  return 'rc-outcome failure';
}

function outcomeText(outcome) {
  const map = { nat20: 'CRITICAL SUCCESS', nat1: 'CRITICAL FAILURE', success: 'SUCCESS', failure: 'FAILURE' };
  return map[outcome] || '';
}

export default function RollCalculator({ attrs = {}, skills = [], onChange, compact = false }) {
  const [rollType, setRollType] = useState('attack');
  const [attrKey,  setAttrKey]  = useState('str');
  const [skillKey, setSkillKey] = useState(ATTACK_SKILLS[0].skill_name);
  const [saveKey,  setSaveKey]  = useState(SAVING_THROWS[0].key);
  const [dcSel,    setDcSel]    = useState(15);
  const [customDC, setCustomDC] = useState(15);
  const [nat,      setNat]      = useState('');
  const [rolling,  setRolling]  = useState(false);
  const ivRef = useRef(null);

  const dc = dcSel === 'custom' ? (parseInt(customDC) || 15) : Number(dcSel);

  // For attack rolls derive attribute from skill definition, not from attrKey
  function getEffectiveAttrs() {
    if (rollType === 'attack') {
      const def = ATTACK_SKILLS.find(s => s.skill_name === skillKey);
      return { ...attrs, _attackAttr: def?.attribute || 'str' };
    }
    return attrs;
  }

  const { attrMod, skillRank, total: totalMod, label: rollLabel } = getRollBonus({
    rollType,
    attrKey:  rollType === 'attack'
      ? (ATTACK_SKILLS.find(s => s.skill_name === skillKey)?.attribute || 'str')
      : attrKey,
    saveKey, attrs, skills, skillKey,
  });

  const natNum  = parseInt(nat) || 0;
  const total   = natNum ? natNum + totalMod : null;
  const outcome = natNum
    ? natNum === 20 ? 'nat20' : natNum === 1 ? 'nat1' : total >= dc ? 'success' : 'failure'
    : null;

  function notify(overrides = {}) {
    onChange?.({
      rollType, label: rollLabel, attrMod, skillRank, totalMod,
      nat: natNum, total, dc, outcome,
      ...overrides,
    });
  }

  const roll = useCallback(() => {
    if (rolling) return;
    clearInterval(ivRef.current);
    setRolling(true);
    setNat('');
    let count = 0;
    ivRef.current = setInterval(() => {
      const r = Math.floor(Math.random() * 20) + 1;
      setNat(String(r));
      count++;
      if (count >= 16) {
        clearInterval(ivRef.current);
        const final = Math.floor(Math.random() * 20) + 1;
        setNat(String(final));
        setRolling(false);
        const t = final + totalMod;
        const o = final === 20 ? 'nat20' : final === 1 ? 'nat1' : t >= dc ? 'success' : 'failure';
        notify({ nat: final, total: t, dc, outcome: o });
      }
    }, 55);
  }, [rolling, totalMod, dc]);

  // When roll type changes, reset skill key to appropriate default
  function handleRollTypeChange(val) {
    setRollType(val);
    setNat('');
    if (val === 'attack') setSkillKey(ATTACK_SKILLS[0].skill_name);
    else if (val === 'skill') setSkillKey(SKILL_LIST[0].skill_name);
  }

  const skillsForType = rollType === 'attack' ? ATTACK_SKILLS : SKILL_LIST;

  return (
    <div className={compact ? 'rc-compact' : 'rc-panel'}>
      {/* Row 1: Roll type + contextual selector */}
      <div className="rc-row">
        <div className="rc-field">
          <label className="rc-label">Type</label>
          <select className="rc-select" value={rollType} onChange={e => handleRollTypeChange(e.target.value)}>
            {ROLL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Attack → weapon skill (attribute auto-derived) */}
        {rollType === 'attack' && (
          <div className="rc-field">
            <label className="rc-label">Weapon</label>
            <select className="rc-select" value={skillKey} onChange={e => { setSkillKey(e.target.value); setNat(''); }}>
              {ATTACK_SKILLS.map(s => (
                <option key={s.skill_name} value={s.skill_name}>
                  {s.skill_name} ({ATTR_LABELS[s.attribute]})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Skill check → all skills */}
        {rollType === 'skill' && (
          <div className="rc-field">
            <label className="rc-label">Skill</label>
            <select className="rc-select" value={skillKey} onChange={e => { setSkillKey(e.target.value); setNat(''); }}>
              {SKILL_LIST.map(s => <option key={s.skill_name} value={s.skill_name}>{s.skill_name}</option>)}
            </select>
          </div>
        )}

        {/* Attribute check → attribute */}
        {rollType === 'attribute' && (
          <div className="rc-field">
            <label className="rc-label">Attribute</label>
            <select className="rc-select" value={attrKey} onChange={e => { setAttrKey(e.target.value); setNat(''); }}>
              {ATTRS.map(a => <option key={a} value={a}>{ATTR_LABELS[a]}</option>)}
            </select>
          </div>
        )}

        {/* Saving throw */}
        {rollType === 'saving_throw' && (
          <div className="rc-field">
            <label className="rc-label">Save</label>
            <select className="rc-select" value={saveKey} onChange={e => { setSaveKey(e.target.value); setNat(''); }}>
              {SAVING_THROWS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        )}

        {/* DC */}
        <div className="rc-field rc-field-dc">
          <label className="rc-label">Difficulty</label>
          <select className="rc-select" value={dcSel} onChange={e => setDcSel(e.target.value === 'custom' ? 'custom' : parseInt(e.target.value))}>
            {DC_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>

        {dcSel === 'custom' && (
          <div className="rc-field rc-field-sm">
            <label className="rc-label">DC</label>
            <input type="number" className="rc-input" value={customDC} min="1" max="60"
              onChange={e => setCustomDC(e.target.value)} />
          </div>
        )}
      </div>

      {/* Row 2: Bonus breakdown + roll */}
      <div className="rc-row rc-row-roll">
        {/* Bonus breakdown */}
        <div className="rc-bonus-breakdown">
          <span className="rc-bonus-label">{rollLabel}</span>
          <span className="rc-bonus-detail">
            {rollType !== 'saving_throw' && rollType !== 'attribute'
              ? `${ATTR_LABELS[ATTACK_SKILLS.find(s=>s.skill_name===skillKey)?.attribute || SKILL_LIST.find(s=>s.skill_name===skillKey)?.attribute || attrKey] || ''} +${attrMod}  ·  Rank +${skillRank}`
              : `+${attrMod}`
            }
          </span>
          <span className="rc-bonus-total">= +{totalMod}</span>
        </div>

        {/* Natural roll input + roll button */}
        <div className="rc-roll-input-row">
          <input
            type="number"
            className="rc-input rc-nat-input"
            value={nat}
            min="1" max="20"
            placeholder="d20"
            onChange={e => { setNat(e.target.value); notify({ nat: parseInt(e.target.value) || 0 }); }}
          />
          <button className="rc-roll-btn" onClick={roll} disabled={rolling}>
            {rolling ? '…' : '◆ Roll d20'}
          </button>
        </div>
      </div>

      {/* Row 3: Result */}
      {nat !== '' && natNum > 0 && (
        <div className="rc-result-row">
          <span className="rc-result-formula">
            {nat} + {totalMod} = <strong>{total}</strong> vs DC {dc}
          </span>
          {outcome && (
            <span className={outcomeClass(outcome)}>{outcomeText(outcome)}</span>
          )}
        </div>
      )}
    </div>
  );
}
