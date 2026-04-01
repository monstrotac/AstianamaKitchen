function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TrialEntry({ entry }) {
  return (
    <div className={`s-entry ${entry.entry_type}`}>
      <div className="s-entry-author">
        {entry.author_name || 'Unknown'} · {formatDate(entry.created_at)} · {entry.entry_type}
      </div>
      <div className="s-entry-body">{entry.body}</div>
      {entry.roll_data && (
        <div className="s-entry-roll-data">
          <span className="s-entry-roll-label">
            {entry.roll_data.rollType === 'attack' ? 'Attack' : entry.roll_data.rollType === 'saving_throw' ? 'Saving Throw' : entry.roll_data.rollType === 'attribute' ? 'Attribute Check' : 'Skill Check'}
            {entry.roll_data.label ? ` — ${entry.roll_data.label}` : ''}
          </span>
          {' '}
          {entry.roll_data.die1}+{entry.roll_data.die2}
          {entry.roll_data.totalMod != null ? ` +${entry.roll_data.totalMod}` : ''}
          {' '}= {entry.roll_data.total} vs DC {entry.roll_data.dc}
          {entry.roll_data.outcome && (
            <span className={`s-entry-roll-outcome ${entry.roll_data.outcome}`}>
              {' — '}{entry.roll_data.outcome === 'crit_success' ? 'CRITICAL SUCCESS'
                : entry.roll_data.outcome === 'crit_failure' ? 'CRITICAL FAILURE'
                : entry.roll_data.outcome === 'success' ? 'SUCCESS' : 'FAILURE'}
            </span>
          )}
          {entry.roll_data.damageTier && (
            <span className="s-entry-roll-damage">
              {' — '}{entry.roll_data.damageTier.label} ({entry.roll_data.damageTier.damage} dmg)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
