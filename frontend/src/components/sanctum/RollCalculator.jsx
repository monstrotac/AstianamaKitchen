/**
 * RollCalculator — shared roll UI used in Contracts (RollForm) and Trials.
 *
 * Props:
 *   attrs       { str, dex, sta, cha, man, app, per, int_score, wit }
 *   skills      array of { skill_name, attribute, rank }
 *   onChange    called with { rollType, label, attrMod, skillRank, totalMod, die1, die2, total, dc, outcome, margin, damageTier }
 *   compact     bool — renders without outer panel chrome (for embedding)
 */
import { useState, useRef, useCallback } from 'react';
import {
  ATTRS, ATTR_LABELS, SKILL_LIST, ATTACK_SKILLS,
  SAVING_THROWS, ROLL_TYPES, DC_OPTIONS, getRollBonus, computeDamageTier,
} from '../../utils/rollUtils';

function outcomeClass(outcome) {
  if (!outcome) return '';
  if (outcome === 'crit_success') return 'rc-outcome crit-success';
  if (outcome === 'crit_failure')  return 'rc-outcome crit-failure';
  if (outcome === 'success') return 'rc-outcome success';
  return 'rc-outcome failure';
}

function outcomeText(outcome) {
  const map = { crit_success: 'CRITICAL SUCCESS', crit_failure: 'CRITICAL FAILURE', success: 'SUCCESS', failure: 'FAILURE' };
  return map[outcome] || '';
}

export default function RollCalculator({ attrs = {}, skills = [], onChange, compact = false }) {
  const [rollType, setRollType] = useState('attack');
  const [attrKey,  setAttrKey]  = useState('str');
  const [skillKey, setSkillKey] = useState(ATTACK_SKILLS[0].skill_name);
  const [saveKey,  setSaveKey]  = useState(SAVING_THROWS[0].key);
  const [dcSel,    setDcSel]    = useState(12);
  const [customDC, setCustomDC] = useState(12);
  const [die1,     setDie1]     = useState('');
  const [die2,     setDie2]     = useState('');
  const [rolling,  setRolling]  = useState(false);
  const ivRef = useRef(null);

  const dc = dcSel === -1 ? (parseInt(customDC) || 12) : Number(dcSel);

  const { attrMod, skillRank, total: totalMod, label: rollLabel } = getRollBonus({
    rollType,
    attrKey:  rollType === 'attack'
      ? (ATTACK_SKILLS.find(s => s.skill_name === skillKey)?.attribute || 'str')
      : attrKey,
    saveKey, attrs, skills, skillKey,
  });

  const d1Num   = parseInt(die1) || 0;
  const d2Num   = parseInt(die2) || 0;
  const total   = (d1Num && d2Num) ? d1Num + d2Num + totalMod : null;

  let outcome = null;
  let margin = null;
  let damageTier = null;
  if (d1Num && d2Num) {
    if (d1Num === 10 && d2Num === 10) {
      outcome = 'crit_success';
      margin = total - dc;
      damageTier = { label: 'Devastating', damage: 4 };
    } else if (d1Num === 1 && d2Num === 1) {
      outcome = 'crit_failure';
    } else if (total >= dc) {
      outcome = 'success';
      margin = total - dc;
      if (rollType === 'attack') damageTier = computeDamageTier(margin);
    } else {
      outcome = 'failure';
    }
  }

  function notify(overrides = {}) {
    onChange?.({
      rollType, label: rollLabel, attrMod, skillRank, totalMod,
      die1: d1Num, die2: d2Num, total, dc, outcome, margin, damageTier,
      ...overrides,
    });
  }

  const roll = useCallback(() => {
    if (rolling) return;
    clearInterval(ivRef.current);
    setRolling(true);
    setDie1('');
    setDie2('');
    let count = 0;
    ivRef.current = setInterval(() => {
      setDie1(String(Math.floor(Math.random() * 10) + 1));
      setDie2(String(Math.floor(Math.random() * 10) + 1));
      count++;
      if (count >= 18) {
        clearInterval(ivRef.current);
        const r1 = Math.floor(Math.random() * 10) + 1;
        const r2 = Math.floor(Math.random() * 10) + 1;
        setDie1(String(r1));
        setDie2(String(r2));
        setRolling(false);
        const t = r1 + r2 + totalMod;
        let o, m = null, dt = null;
        if (r1 === 10 && r2 === 10) { o = 'crit_success'; m = t - dc; dt = { label: 'Devastating', damage: 4 }; }
        else if (r1 === 1 && r2 === 1) { o = 'crit_failure'; }
        else if (t >= dc) { o = 'success'; m = t - dc; if (rollType === 'attack') dt = computeDamageTier(m); }
        else { o = 'failure'; }
        notify({ die1: r1, die2: r2, total: t, dc, outcome: o, margin: m, damageTier: dt });
      }
    }, 55);
  }, [rolling, totalMod, dc, rollType]);

  function handleRollTypeChange(val) {
    setRollType(val);
    setDie1('');
    setDie2('');
    if (val === 'attack') setSkillKey(ATTACK_SKILLS[0].skill_name);
    else if (val === 'skill') setSkillKey(SKILL_LIST[0].skill_name);
  }

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

        {rollType === 'attack' && (
          <div className="rc-field">
            <label className="rc-label">Weapon</label>
            <select className="rc-select" value={skillKey} onChange={e => { setSkillKey(e.target.value); setDie1(''); setDie2(''); }}>
              {ATTACK_SKILLS.map(s => (
                <option key={s.skill_name} value={s.skill_name}>
                  {s.skill_name} ({ATTR_LABELS[s.attribute]})
                </option>
              ))}
            </select>
          </div>
        )}

        {rollType === 'skill' && (
          <div className="rc-field">
            <label className="rc-label">Skill</label>
            <select className="rc-select" value={skillKey} onChange={e => { setSkillKey(e.target.value); setDie1(''); setDie2(''); }}>
              {SKILL_LIST.map(s => <option key={s.skill_name} value={s.skill_name}>{s.skill_name}</option>)}
            </select>
          </div>
        )}

        {rollType === 'attribute' && (
          <div className="rc-field">
            <label className="rc-label">Attribute</label>
            <select className="rc-select" value={attrKey} onChange={e => { setAttrKey(e.target.value); setDie1(''); setDie2(''); }}>
              {ATTRS.map(a => <option key={a} value={a}>{ATTR_LABELS[a]}</option>)}
            </select>
          </div>
        )}

        {rollType === 'saving_throw' && (
          <div className="rc-field">
            <label className="rc-label">Save</label>
            <select className="rc-select" value={saveKey} onChange={e => { setSaveKey(e.target.value); setDie1(''); setDie2(''); }}>
              {SAVING_THROWS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        )}

        <div className="rc-field rc-field-dc">
          <label className="rc-label">Difficulty</label>
          <select className="rc-select" value={dcSel} onChange={e => setDcSel(Number(e.target.value))}>
            {DC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {dcSel === -1 && (
          <div className="rc-field rc-field-sm">
            <label className="rc-label">DC</label>
            <input type="number" className="rc-input" value={customDC} min="1" max="60"
              onChange={e => setCustomDC(e.target.value)} />
          </div>
        )}
      </div>

      {/* Row 2: Bonus breakdown + roll */}
      <div className="rc-row rc-row-roll">
        <div className="rc-bonus-breakdown">
          <span className="rc-bonus-label">{rollLabel}</span>
          <span className="rc-bonus-detail">
            {rollType !== 'saving_throw' && rollType !== 'attribute'
              ? `${ATTR_LABELS[ATTACK_SKILLS.find(s=>s.skill_name===skillKey)?.attribute || SKILL_LIST.find(s=>s.skill_name===skillKey)?.attribute || attrKey] || ''} +${attrMod}  \u00b7  Rank +${skillRank}`
              : `+${attrMod}`
            }
          </span>
          <span className="rc-bonus-total">= +{totalMod}</span>
        </div>

        <div className="rc-roll-input-row">
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <input
              type="number" className="rc-input rc-nat-input"
              value={die1} min="1" max="10" placeholder="d10"
              onChange={e => { setDie1(e.target.value); }}
              style={{ width: '3rem' }}
            />
            <span style={{ color: 'var(--dim)' }}>+</span>
            <input
              type="number" className="rc-input rc-nat-input"
              value={die2} min="1" max="10" placeholder="d10"
              onChange={e => { setDie2(e.target.value); }}
              style={{ width: '3rem' }}
            />
          </div>
          <button className="rc-roll-btn" onClick={roll} disabled={rolling}>
            {rolling ? '\u2026' : '\u25C6 Roll 2d10'}
          </button>
        </div>
      </div>

      {/* Row 3: Result */}
      {d1Num > 0 && d2Num > 0 && (
        <div className="rc-result-row">
          <span className="rc-result-formula">
            {d1Num} + {d2Num} + {totalMod} = <strong>{total}</strong> vs DC {dc}
          </span>
          {outcome && (
            <span className={outcomeClass(outcome)}>{outcomeText(outcome)}</span>
          )}
          {margin != null && margin >= 0 && damageTier && (
            <span className="rc-damage-tier">
              Margin +{margin} \u2014 {damageTier.label} ({damageTier.damage} dmg)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
