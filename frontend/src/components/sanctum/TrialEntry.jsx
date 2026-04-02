import { useState } from 'react';
import { updateEntry, deleteEntry } from '../../api/sanctum';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ENTRY_TYPES = ['narrative', 'roll', 'verdict'];

export default function TrialEntry({ entry, canManage = false, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(entry.body);
  const [entryType, setEntryType] = useState(entry.entry_type);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateEntry(entry.id, { body, entry_type: entryType });
      setEditing(false);
      onChanged?.();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
    setSaving(true);
    try {
      await deleteEntry(entry.id);
      onChanged?.();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  return (
    <div className={`s-entry ${entry.entry_type}`}>
      <div className="s-entry-header">
        <div className="s-entry-author">
          {entry.author_name || 'Unknown'} · {formatDate(entry.created_at)} · {entry.entry_type}
        </div>
        {canManage && !editing && (
          <div className="s-entry-actions">
            <button className="s-btn small" onClick={() => setEditing(true)}>✎</button>
            <button className="s-btn small danger" onClick={handleDelete} disabled={saving}>✕</button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="s-entry-edit">
          <div className="s-form-row" style={{ marginBottom: '0.5rem' }}>
            <select className="s-select" value={entryType} onChange={e => setEntryType(e.target.value)} style={{ fontSize: '0.72rem' }}>
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <textarea
            className="s-textarea"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.8rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="s-btn small" onClick={handleSave} disabled={saving || !body.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="s-btn small" onClick={() => { setEditing(false); setBody(entry.body); setEntryType(entry.entry_type); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
