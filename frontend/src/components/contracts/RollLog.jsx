import { useState } from 'react';

const OUTCOME_LABELS = {
  crit_success: 'CRITICAL SUCCESS',
  crit_failure: 'CRITICAL FAILURE',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

export default function RollLog({ rolls }) {
  const [open, setOpen] = useState(false);
  if (!rolls || rolls.length === 0) return null;

  return (
    <div className="ct-rolls-section">
      <div className="ct-rolls-header" onClick={() => setOpen(o => !o)}>
        <span>Mission Rolls \u2014 {rolls.length} Logged</span>
        <span className="ct-rolls-chevron">{open ? '\u25B2' : '\u25BC'}</span>
      </div>
      {open && (
        <div>
          {rolls.map(r => (
            <div key={r.id} className="ct-roll-item">
              <div className="ct-roll-top">
                <span className={`ct-roll-badge ${r.outcome}`}>
                  {OUTCOME_LABELS[r.outcome] || r.outcome.toUpperCase()}
                </span>
                <span className="ct-roll-situation">{r.situation}</span>
                <span className="ct-roll-date">{new Date(r.rolled_at).toLocaleDateString()}</span>
              </div>
              <div className="ct-roll-breakdown">
                {r.skill_name} ({r.skill_bonus >= 0 ? `+${r.skill_bonus}` : r.skill_bonus}) \u2014
                {' '}Die 1: {r.die1} + Die 2: {r.die2} + Mod: {r.modifier >= 0 ? `+${r.modifier}` : r.modifier} = {r.total} vs DC {r.dc}
                {r.margin != null && r.margin >= 0 && r.damage_tier && (
                  <span style={{ color: '#f0b832', marginLeft: '0.5rem' }}>
                    {r.damage_tier} (margin +{r.margin})
                  </span>
                )}
                {r.rolled_by_name && <> \u2014 {r.rolled_by_name}</>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
