import { useState } from 'react';

export default function RollLog({ rolls }) {
  const [open, setOpen] = useState(false);
  if (!rolls || rolls.length === 0) return null;

  return (
    <div className="ct-rolls-section">
      <div className="ct-rolls-header" onClick={() => setOpen(o => !o)}>
        <span>Mission Rolls — {rolls.length} Logged</span>
        <span className="ct-rolls-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div>
          {rolls.map(r => (
            <div key={r.id} className="ct-roll-item">
              <div className="ct-roll-top">
                <span className={`ct-roll-badge ${r.outcome}`}>{r.outcome.toUpperCase()}</span>
                <span className="ct-roll-situation">{r.situation}</span>
                <span className="ct-roll-date">{new Date(r.rolled_at).toLocaleDateString()}</span>
              </div>
              <div className="ct-roll-breakdown">
                {r.skill_name} ({r.skill_bonus >= 0 ? `+${r.skill_bonus}` : r.skill_bonus}) — Natural: {r.natural_roll} + Mod: {r.modifier >= 0 ? `+${r.modifier}` : r.modifier} = {r.total} vs DC {r.dc}
                {r.rolled_by_name && <> — {r.rolled_by_name}</>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
