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
  crit_success: 'CRITICAL SUCCESS',
  crit_failure: 'CRITICAL FAILURE',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

export default function RollPanel({ charId, onInsert }) {
  const [open, setOpen]       = useState(false);
  const [attrs, setAttrs]     = useState(null);
  const [skills, setSkills]   = useState([]);
  const [rollData, setRollData] = useState(null);
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false;
    setAttrs(null);
    setSkills([]);
    setRollData(null);
  }, [charId]);

  useEffect(() => {
    if (!open || !charId || loaded.current) return;
    loaded.current = true;
    Promise.all([getCharacter(charId), getSkills(charId)])
      .then(([c, s]) => {
        setAttrs({
          str:       c.str       ?? 0,
          dex:       c.dex       ?? 0,
          sta:       c.sta       ?? 0,
          cha:       c.cha       ?? 0,
          man:       c.man       ?? 0,
          app:       c.app       ?? 0,
          per:       c.per       ?? 0,
          int_score: c.int_score ?? 0,
          wit:       c.wit       ?? 0,
        });
        setSkills(s);
      })
      .catch(() => {});
  }, [open, charId]);

  if (!charId) return null;

  function handleInsert() {
    if (!rollData?.die1 || !rollData?.die2) return;
    const outcome = OUTCOME_LABELS[rollData.outcome] || '';
    const sign = rollData.totalMod >= 0 ? '+' : '';
    const text = `[ROLL] ${rollData.label}: ${rollData.die1}+${rollData.die2} ${sign}${rollData.totalMod} = ${rollData.total} vs DC ${rollData.dc} — ${outcome}`;
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
        {open ? '\u25B2 Hide rolls' : '\u25C6 Roll dice'}
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
            <div style={{ color: 'var(--dim)', fontSize: '0.75rem' }}>Loading character\u2026</div>
          ) : (
            <>
              <RollCalculator attrs={attrs} skills={skills} onChange={setRollData} compact />
              <button
                type="button"
                className="s-btn small"
                style={{ marginTop: '0.5rem' }}
                disabled={!rollData?.die1 || !rollData?.die2}
                onClick={handleInsert}
              >
                \u25C6 Insert Roll
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
