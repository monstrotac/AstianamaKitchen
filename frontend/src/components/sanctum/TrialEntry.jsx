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
          {JSON.stringify(entry.roll_data)}
        </div>
      )}
    </div>
  );
}
