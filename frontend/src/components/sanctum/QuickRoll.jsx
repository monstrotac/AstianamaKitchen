import { useState, useCallback, useRef } from 'react';
import { DC_OPTIONS, computeDamageTier } from '../../utils/rollUtils';

function computeOutcome(d1, d2, total, dc) {
  if (d1 === 10 && d2 === 10) return { text: 'CRITICAL SUCCESS', cls: 'crit-success', margin: total - dc };
  if (d1 === 1 && d2 === 1) return { text: 'CRITICAL FAILURE', cls: 'crit-failure' };
  if (total >= dc) return { text: 'SUCCESS', cls: 'success', margin: total - dc };
  return { text: 'FAILURE', cls: 'failure' };
}

export default function QuickRoll({ label, modifier: defaultModifier, attributeOptions, isCombatRoll, onClose }) {
  const hasAttrChoice = attributeOptions && attributeOptions.length > 1;
  const [selectedAttrIdx, setSelectedAttrIdx] = useState(0);
  const modifier = hasAttrChoice ? attributeOptions[selectedAttrIdx].modifier : defaultModifier;

  const [dcSel, setDcSel] = useState(12);
  const [customDC, setCustomDC] = useState('12');
  const [die1, setDie1] = useState(null);
  const [die2, setDie2] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [display1, setDisplay1] = useState('\u2014');
  const [display2, setDisplay2] = useState('\u2014');
  const ivRef = useRef(null);

  const dc = dcSel === -1 ? parseInt(customDC) || 12 : dcSel;
  const total = die1 != null && die2 != null ? die1 + die2 + modifier : null;
  const outcome = die1 != null && die2 != null && total != null
    ? computeOutcome(die1, die2, total, dc)
    : null;

  const roll = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setDie1(null);
    setDie2(null);
    let count = 0;
    ivRef.current = setInterval(() => {
      setDisplay1(String(Math.floor(Math.random() * 10) + 1));
      setDisplay2(String(Math.floor(Math.random() * 10) + 1));
      count++;
      if (count >= 18) {
        clearInterval(ivRef.current);
        const r1 = Math.floor(Math.random() * 10) + 1;
        const r2 = Math.floor(Math.random() * 10) + 1;
        setDisplay1(String(r1));
        setDisplay2(String(r2));
        setDie1(r1);
        setDie2(r2);
        setRolling(false);
      }
    }, 55);
  }, [rolling]);

  function getDieClassName(die, otherDie) {
    if (rolling) return 's-die-rolling';
    if (die === 10 && otherDie === 10) return 's-die-crit-success';
    if (die === 1 && otherDie === 1) return 's-die-crit-failure';
    if (die != null) return 's-die-normal';
    return '';
  }

  return (
    <>
      <div className="s-overlay" onClick={onClose} />
      <div className="s-quick-roll-panel">
        {/* Header */}
        <div className="s-quick-roll-top">
          <span className="s-quick-roll-label">{label}</span>
          <button type="button" className="s-btn small" onClick={onClose}>{'\u2715'}</button>
        </div>

        {/* Attribute picker (versatile abilities) */}
        {hasAttrChoice && (
          <div className="s-attr-picker">
            <div className="s-attr-picker-label">Choose attribute</div>
            <div className="s-attr-picker-row">
              {attributeOptions.map((opt, idx) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`s-btn small${idx === selectedAttrIdx ? ' active' : ''}`}
                  onClick={() => { setSelectedAttrIdx(idx); setDie1(null); setDie2(null); }}
                >
                  {opt.label} ({opt.modifier >= 0 ? `+${opt.modifier}` : opt.modifier})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modifier */}
        <div className="s-quick-roll-mod">{modifier >= 0 ? `+${modifier}` : modifier}</div>
        <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--dim)', marginBottom: '0.5rem' }}>Modifier</div>

        {/* DC selector + Roll button */}
        <div className="s-quick-roll-controls">
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--dim)', display: 'block', marginBottom: '0.25rem' }}>
              Select the task difficulty
            </span>
            <select className="s-input" value={dcSel} onChange={e => setDcSel(Number(e.target.value))}>
              {DC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {dcSel === -1 && (
              <input
                type="number"
                className="s-input"
                style={{ width: '4rem', marginLeft: '0.5rem' }}
                value={customDC}
                min="1"
                max="60"
                onChange={e => setCustomDC(e.target.value)}
              />
            )}
          </div>
          <button type="button" className="s-btn" onClick={roll} disabled={rolling}>
            {rolling ? '\u2026' : '\u25C6 Roll 2d10'}
          </button>
        </div>

        {/* Result */}
        {(die1 != null || rolling) && (
          <div className="s-quick-roll-result">
            <div className="s-die-display-row">
              <div className={`s-die-display ${getDieClassName(die1, die2)}`}>{display1}</div>
              <div className="s-die-plus">+</div>
              <div className={`s-die-display ${getDieClassName(die2, die1)}`}>{display2}</div>
            </div>
            {outcome && total != null && (
              <>
                <div className={`s-outcome-text s-outcome-${outcome.cls}`}>{outcome.text}</div>
                <div className="s-outcome-formula">
                  {die1} + {die2} + {modifier >= 0 ? `(+${modifier})` : `(${modifier})`} = {total} vs DC {dc}
                </div>
                {outcome.margin != null && outcome.margin >= 0 && (
                  <div className="s-outcome-margin">
                    Margin: +{outcome.margin}
                    {isCombatRoll && (() => {
                      const tier = computeDamageTier(outcome.margin);
                      return <span className="s-damage-tier"> {tier.label} ({tier.damage} dmg)</span>;
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
