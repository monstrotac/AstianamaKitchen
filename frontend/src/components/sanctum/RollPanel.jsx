/**
 * RollPanel — collapsible roll widget for edit pages.
 *
 * Props:
 *   charId    UUID of the character to roll for (lazy-loads attrs/skills)
 *   onInsert  (text) => void  — called when user clicks "Insert Roll"
 */
import { useState, useEffect, useRef } from 'react';
import { getCharacter, getSkills } from '../../api/sanctum';
import RollCalculator from './RollCalculator';

const OUTCOME_LABELS = {
  nat20: 'CRITICAL SUCCESS',
  nat1:  'CRITICAL FAILURE',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

export default function RollPanel({ charId, onInsert }) {
  const [open, setOpen]       = useState(false);
  const [attrs, setAttrs]     = useState(null);
  const [skills, setSkills]   = useState([]);
  const [rollData, setRollData] = useState(null);
  const loaded = useRef(false);

  // Reset when charId changes
  useEffect(() => {
    loaded.current = false;
    setAttrs(null);
    setSkills([]);
    setRollData(null);
  }, [charId]);

  // Lazy-load character data when panel is first opened
  useEffect(() => {
    if (!open || !charId || loaded.current) return;
    loaded.current = true;
    Promise.all([getCharacter(charId), getSkills(charId)])
      .then(([c, s]) => {
        setAttrs({
          str:       c.str       ?? 1,
          dex:       c.dex       ?? 1,
          con:       c.con       ?? 1,
          int_score: c.int_score ?? 1,
          wis:       c.wis       ?? 1,
          cha:       c.cha       ?? 1,
        });
        setSkills(s);
      })
      .catch(() => {});
  }, [open, charId]);

  if (!charId) return null;

  function handleInsert() {
    if (!rollData?.nat) return;
    const outcome = OUTCOME_LABELS[rollData.outcome] || '';
    const sign     = rollData.totalMod >= 0 ? '+' : '';
    const text = `[ROLL] ${rollData.label}: ${rollData.nat} ${sign}${rollData.totalMod} = ${rollData.total} vs DC ${rollData.dc} — ${outcome}`;
    onInsert?.(text);
  }

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <button
        type="button"
        className="s-btn-ghost"
        style={{ fontSize: '0.72rem', padding: '3px 8px' }}
        onClick={() => setOpen(p => !p)}
      >
        {open ? '▲ Hide rolls' : '◆ Roll dice'}
      </button>

      {open && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.75rem',
          border: '1px solid var(--border)',
          borderRadius: 3,
          background: 'rgba(255,255,255,0.02)',
        }}>
          {!attrs ? (
            <div style={{ color: 'var(--dim)', fontSize: '0.75rem' }}>Loading character…</div>
          ) : (
            <>
              <RollCalculator attrs={attrs} skills={skills} onChange={setRollData} compact />
              <button
                type="button"
                className="s-btn small"
                style={{ marginTop: '0.5rem' }}
                disabled={!rollData?.nat}
                onClick={handleInsert}
              >
                ◆ Insert Roll
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
