import { useState } from 'react';
import {
  ATTRS, ATTR_LABELS, ATTRIBUTE_FULL_NAMES, ATTRIBUTE_DESCRIPTIONS,
  ATTRIBUTE_CATEGORIES, ATTRIBUTE_MIN, ATTRIBUTE_MAX,
} from '../../utils/rollUtils';

function modStr(value) { return value >= 0 ? `+${value}` : `${value}`; }

export default function AttributeBlock({ attrs, editing = false, onChange, onRoll, descriptions = [] }) {
  const [expandedAttr, setExpandedAttr] = useState(null);

  function change(key, delta) {
    const cur  = attrs[key] ?? 0;
    const next = cur + delta;
    if (next < ATTRIBUTE_MIN || next > ATTRIBUTE_MAX) return;
    onChange?.({ ...attrs, [key]: next });
    setExpandedAttr(key);
  }

  return (
    <div>
      {Object.entries(ATTRIBUTE_CATEGORIES).map(([category, keys]) => (
        <div key={category} className="s-attr-category">
          <div className="s-attr-category-label">{category}</div>
          <div className="s-attr-grid s-attr-grid-3">
            {keys.map(a => {
              const val = attrs[a] ?? 0;
              const clickable = !editing && onRoll;
              const desc = descriptions.find(d => d.type === 'attribute' && d.key === a);
              const rankDesc = desc?.rank_descriptions?.find(rd => rd.rank === val);
              return (
                <div
                  key={a}
                  className={`s-attr-cell${clickable ? ' s-attr-cell-clickable' : ''}`}
                  onClick={() => clickable && onRoll(a, val)}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onKeyDown={e => {
                    if (clickable && (e.key === 'Enter' || e.key === ' ')) onRoll(a, val);
                  }}
                >
                  <div className="s-attr-label">{ATTR_LABELS[a]}</div>
                  <div className="s-attr-full-name">{ATTRIBUTE_FULL_NAMES[a]}</div>
                  {editing ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <button
                        className="s-btn small"
                        style={{ padding: '0.1rem 0.4rem', fontFamily: 'inherit' }}
                        onClick={e => { e.stopPropagation(); change(a, -1); }}
                        disabled={val <= ATTRIBUTE_MIN}
                      >&minus;</button>
                      <span className="s-attr-score">{val}</span>
                      <button
                        className="s-btn small"
                        style={{ padding: '0.1rem 0.4rem', fontFamily: 'inherit' }}
                        onClick={e => { e.stopPropagation(); change(a, 1); }}
                        disabled={val >= ATTRIBUTE_MAX}
                      >+</button>
                    </div>
                  ) : (
                    <div className="s-attr-score">{val}</div>
                  )}
                  {rankDesc && <div className="s-attr-rank-label">{rankDesc.label}</div>}
                  <div className="s-attr-mod">{modStr(val)}</div>
                  <button
                    className="s-expand-btn"
                    onClick={e => { e.stopPropagation(); setExpandedAttr(expandedAttr === a ? null : a); }}
                  >
                    {expandedAttr === a ? '▴' : '▾'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {expandedAttr && (() => {
        const desc = descriptions.find(d => d.type === 'attribute' && d.key === expandedAttr);
        const val = attrs[expandedAttr] ?? 0;
        const rankDesc = desc?.rank_descriptions?.find(rd => rd.rank === val);
        return (
          <div className="s-desc-panel">
            <span className="s-desc-panel-label">{ATTRIBUTE_FULL_NAMES[expandedAttr]}</span>
            <p style={{ margin: '0 0 0.5rem' }}>{desc?.description || ATTRIBUTE_DESCRIPTIONS[expandedAttr]}</p>
            {rankDesc && (
              <div className="s-rank-flavor">
                <span className="s-rank-flavor-label">{val} — {rankDesc.label}</span>
                <span className="s-rank-flavor-desc">{rankDesc.description}</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
