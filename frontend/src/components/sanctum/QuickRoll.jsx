import { useState, useCallback, useRef } from 'react';
import { ATTR_MOD } from '../../utils/rollUtils';

const DC_OPTS = [
  { v: 8,  l: 'Routine — DC 8' },
  { v: 12, l: 'Somewhat Difficult — DC 12' },
  { v: 15, l: 'Difficult — DC 15' },
  { v: 18, l: 'Very Difficult — DC 18' },
  { v: 22, l: 'Extremely Difficult — DC 22' },
  { v: 25, l: 'Near Impossible — DC 25' },
];

function computeOutcome(nat, total, dc) {
  if (nat === 20) return { text: 'CRITICAL SUCCESS', cls: 'n20' };
  if (nat === 1)  return { text: 'CRITICAL FAILURE', cls: 'n1' };
  if (total >= dc) return { text: 'SUCCESS', cls: 'ok' };
  return { text: 'FAILURE', cls: 'no' };
}

export default function QuickRoll({ label, modifier, onClose }) {
  const [dc, setDc]           = useState(12);
  const [nat, setNat]         = useState(null);
  const [rolling, setRolling] = useState(false);
  const [display, setDisplay] = useState('—');
  const ivRef = useRef(null);

  const total   = nat != null ? nat + modifier : null;
  const outcome = nat != null ? computeOutcome(nat, total, dc) : null;

  const roll = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    setNat(null);
    let count = 0;
    ivRef.current = setInterval(() => {
      setDisplay(Math.floor(Math.random() * 20) + 1);
      count++;
      if (count >= 18) {
        clearInterval(ivRef.current);
        const result = Math.floor(Math.random() * 20) + 1;
        setDisplay(result);
        setNat(result);
        setRolling(false);
      }
    }, 55);
  }, [rolling]);

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Label + close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--mono)' }}>
          {label} — Mod: {modifier >= 0 ? `+${modifier}` : modifier}
        </span>
        <button className="s-btn small danger" onClick={onClose}>✕</button>
      </div>

      {/* DC selector + roll button */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="s-select" value={dc} onChange={e => setDc(Number(e.target.value))}>
          {DC_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <button className="s-btn" onClick={roll} disabled={rolling} style={{ minWidth: '100px' }}>
          ◆ Roll
        </button>
      </div>

      {/* Die display */}
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: '1.6rem',
        color: rolling ? 'var(--dim)' : nat === 20 ? '#f0b832' : nat === 1 ? '#c55' : 'var(--bright-red)',
        letterSpacing: '0.1em',
        transition: 'color 0.2s',
        flexShrink: 0,
        minWidth: '2.5rem',
        textAlign: 'center',
      }}>
        {display}
      </div>

      {/* Outcome */}
      {outcome && (
        <div style={{ flexShrink: 0 }}>
          <div style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.15em',
            color: outcome.cls === 'n20' ? '#f0b832' : outcome.cls === 'ok' ? '#5c9' : '#c55',
            marginBottom: '0.2rem',
          }}>
            {outcome.text}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--dim)' }}>
            {nat} + {modifier >= 0 ? `+${modifier}` : modifier} = {total} vs DC {dc}
          </div>
        </div>
      )}
    </div>
  );
}
