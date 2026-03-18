import { useState } from 'react';
import { ATTRS, ATTR_LABELS } from '../../utils/rollUtils';

const ATTR_FULL = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int_score: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

function modStr(value) { return value >= 0 ? `+${value}` : `${value}`; }

export default function AttributeBlock({ attrs, editing = false, onChange, descriptions = [] }) {
  const [expandedAttr, setExpandedAttr] = useState(null);

  function change(key, delta) {
    const cur  = attrs[key] ?? -2;
    const next = cur + delta;
    if (next < -2 || next > 5) return;
    onChange?.({ ...attrs, [key]: next });
  }

  const expandedDesc = expandedAttr
    ? descriptions.find(d => d.type === 'attribute' && d.key === expandedAttr)
    : null;

  return (
    <div>
      <div className="s-attr-grid">
        {ATTRS.map(a => {
          const val = attrs[a] ?? -2;
          const desc = descriptions.find(d => d.type === 'attribute' && d.key === a);
          return (
            <div key={a} className="s-attr-cell">
              <div className="s-attr-label">{ATTR_LABELS[a]}</div>
              {editing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  <button
                    className="s-btn small"
                    style={{ padding: '0.1rem 0.4rem', fontFamily: 'inherit' }}
                    onClick={() => change(a, -1)}
                    disabled={val <= -2}
                  >−</button>
                  <span className="s-attr-score">{val}</span>
                  <button
                    className="s-btn small"
                    style={{ padding: '0.1rem 0.4rem', fontFamily: 'inherit' }}
                    onClick={() => change(a, 1)}
                    disabled={val >= 5}
                  >+</button>
                </div>
              ) : (
                <div className="s-attr-score">{val}</div>
              )}
              <div className="s-attr-mod">{modStr(val)}</div>
              {desc && (
                <button
                  className="s-expand-btn"
                  onClick={() => setExpandedAttr(expandedAttr === a ? null : a)}
                >
                  {expandedAttr === a ? '▴' : '▾'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {expandedDesc && (
        <div className="s-desc-panel">
          <span className="s-desc-panel-label">{ATTR_FULL[expandedAttr]}</span>
          {expandedDesc.description}
        </div>
      )}
    </div>
  );
}
