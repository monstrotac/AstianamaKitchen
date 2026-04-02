import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getTrial, getEntries, addEntry, updateTrial } from '../../api/sanctum';
import TrialEntry from '../../components/sanctum/TrialEntry';
import RankBadge from '../../components/sanctum/RankBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useSanctum } from '../../contexts/SanctumContext';
import { useTitle } from '../../hooks/useTitle';
import RollCalculator from '../../components/sanctum/RollCalculator';

const ENTRY_TYPES = ['narrative', 'roll', 'verdict'];
const STATUSES    = ['pending', 'active', 'complete', 'failed'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SpireTrialPage() {
  const { id }              = useParams();
  const { user, isSolstice, isAdmin, isMember } = useAuth();
  const { spireChar, activeSkills } = useSanctum();
  const [trial, setTrial]   = useState(null);
  useTitle(trial?.title);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]     = useState({ body: '', entry_type: 'narrative' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [rollData, setRollData] = useState(null);

  const load = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([getTrial(id), getEntries(id)]);
      setTrial(t);
      setEntries(e);
    } catch {
      /* handled below */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="s-empty">Loading…</div>;
  if (!trial)  return <div className="s-empty">Trial not found.</div>;

  if (trial.isLocked) {
    return (
      <div>
        <div className="s-section-title">Trial</div>
        <div className="s-panel">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.9rem' }}>{trial.title}</span>
            <span className={`s-trial-status ${trial.status}`}>{trial.status}</span>
          </div>
          <div style={{ color: 'var(--dim)', fontSize: '0.78rem' }}>🔒 Restricted — insufficient clearance to view details.</div>
        </div>
      </div>
    );
  }

  const isAssignedTo = trial.assigned_to === user?.id;
  const isAssignedBy = trial.assigned_by === user?.id;
  const canPost      = isMember && (isAssignedTo || isAssignedBy || isSolstice || isAdmin);
  const canManage    = isAssignedBy || isSolstice || isAdmin;

  async function handleAddEntry(e) {
    e.preventDefault();
    if (!form.body) return;
    setSaving(true);
    setError('');
    try {
      await addEntry(id, form);
      setForm({ body: '', entry_type: 'narrative' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status) {
    await updateTrial(id, { status });
    load();
  }

  return (
    <div>
      <div className="s-section-title">Trial</div>

      {/* Trial header */}
      <div className="s-panel">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '1rem', marginBottom: '0.5rem' }}>{trial.title}</div>
            <div className="s-trial-meta">
              {trial.assigned_to_name && <span>Assigned to: {trial.assigned_to_name}</span>}
              {trial.assigned_by_name && <span>By: {trial.assigned_by_name}</span>}
              <span>{formatDate(trial.created_at)}</span>
            </div>
          </div>
          <span className={`s-trial-status ${trial.status}`}>{trial.status}</span>
        </div>

        {trial.description && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.83rem', lineHeight: 1.65, color: 'var(--dim)', whiteSpace: 'pre-wrap' }}>
            {trial.description}
          </div>
        )}

        {canManage && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button
                key={s}
                className={`s-btn small${trial.status === s ? '' : ''}`}
                style={trial.status === s ? { borderColor: 'var(--bright-red)', color: 'var(--bright-red)' } : {}}
                onClick={() => handleStatusChange(s)}
                disabled={trial.status === s}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="s-section-title">Entries</div>
      {entries.length === 0 && <div className="s-empty" style={{ padding: '1rem 0' }}>No entries yet.</div>}
      {entries.map(entry => (
        <TrialEntry
          key={entry.id}
          entry={entry}
          canManage={canManage || entry.author_id === user?.id}
          onChanged={load}
        />
      ))}

      {/* Add entry form */}
      {canPost && (
        <form onSubmit={handleAddEntry} className="s-panel" style={{ marginTop: '1.5rem' }}>
          <div className="s-form-row">
            <label className="s-label">Entry type</label>
            <select className="s-select" value={form.entry_type} onChange={e => setForm(p => ({ ...p, entry_type: e.target.value }))}>
              {ENTRY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.entry_type === 'roll' && spireChar && (() => {
            const attrs = {
              str: spireChar.str ?? 0, dex: spireChar.dex ?? 0, sta: spireChar.sta ?? 0,
              cha: spireChar.cha ?? 0, man: spireChar.man ?? 0, app: spireChar.app ?? 0,
              per: spireChar.per ?? 0, int_score: spireChar.int_score ?? 0, wit: spireChar.wit ?? 0,
            };
            const canAdd = rollData?.die1 > 0 && rollData?.die2 > 0;
            return (
              <div style={{ marginBottom: '1rem' }}>
                <RollCalculator
                  attrs={attrs}
                  skills={activeSkills}
                  onChange={setRollData}
                />
                <button
                  type="button"
                  className="s-btn small"
                  style={{ marginTop: '0.75rem' }}
                  disabled={!canAdd}
                  onClick={() => {
                    if (!rollData) return;
                    const outcomeText = { crit_success: 'CRITICAL SUCCESS', crit_failure: 'CRITICAL FAILURE', success: 'SUCCESS', failure: 'FAILURE' }[rollData.outcome] || '';
                    const summary = `${rollData.label}: rolled ${rollData.die1}+${rollData.die2} +${rollData.totalMod} = ${rollData.total} vs DC ${rollData.dc} — ${outcomeText}`;
                    setForm(p => ({ ...p, body: p.body ? p.body + '\n' + summary : summary }));
                  }}
                >
                  ◆ Add to Entry
                </button>
              </div>
            );
          })()}

          <div className="s-form-row">
            <label className="s-label">Body</label>
            <textarea
              className="s-textarea"
              rows={5}
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              required
            />
          </div>
          {error && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</div>}
          <button className="s-btn" type="submit" disabled={saving}>{saving ? 'Posting…' : 'Add entry'}</button>
        </form>
      )}
    </div>
  );
}
