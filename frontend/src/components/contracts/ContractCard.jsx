import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';
import RollLog from './RollLog';
import RollForm from './RollForm';
import CloseForm from './CloseForm';

export default function ContractCard({ contract: initial, onUpdate, onDelete, spireChar, spireSkills, gardeners = [] }) {
  const { isSolstice, isAdmin, isPatron, user } = useAuth();
  const isPrivileged = isSolstice || isAdmin;
  const [contract, setContract] = useState(initial);
  const [open, setOpen]         = useState(false);
  const [editing, setEditing]   = useState(false);
  const [showRollForm, setShowRollForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [rolls, setRolls]       = useState([]);
  const [rollsLoaded, setRollsLoaded] = useState(false);
  const [edit, setEdit]         = useState({});
  const [editError, setEditError] = useState('');

  const isAssigned  = contract.assigned_to === user?.id;
  const isCreator   = contract.created_by === user?.id;
  const canEdit     = isPrivileged || isAssigned;
  // Patrons can only edit notes on contracts they created; they cannot close or log rolls
  const canEditNotes = canEdit || (isPatron && isCreator);
  const canOperate   = !isPatron; // Gardeners and Solstice can log rolls and close

  useEffect(() => { setContract(initial); }, [initial]);

  function toggleOpen() {
    setOpen(o => {
      if (!o && !rollsLoaded) loadRolls();
      return !o;
    });
  }

  async function loadRolls() {
    try {
      const res = await client.get(`/contracts/${contract.id}/rolls`);
      setRolls(res.data);
      setRollsLoaded(true);
    } catch(e) {}
  }

  function startEdit() {
    setEdit({
      name:           contract.name           || '',
      classification: contract.classification || '',
      priority:       contract.priority       || 'Standard',
      method:         contract.method         || 'Unspecified',
      weapon:         contract.weapon         || '',
      notes_briefing: contract.notes_briefing || '',
      notes_intel:    contract.notes_intel    || '',
      notes_exec:     contract.notes_exec     || '',
      notes_exfil:    contract.notes_exfil    || '',
      assigned_to:    contract.assigned_to    || '',
    });
    setEditing(true);
  }

  async function saveEdit() {
    setEditError('');
    try {
      const res = await client.patch(`/contracts/${contract.id}`, edit);
      setContract(res.data);
      onUpdate?.(res.data);
      setEditing(false);
    } catch(e) {
      setEditError(e.response?.data?.error || 'Save failed.');
    }
  }

  async function changeStatus(status) {
    try {
      const res = await client.patch(`/contracts/${contract.id}`, { status });
      setContract(res.data);
      onUpdate?.(res.data);
    } catch(e) {}
  }

  async function purge() {
    if (!window.confirm(`Purge contract: ${contract.name}?`)) return;
    try {
      await client.delete(`/contracts/${contract.id}`);
      onDelete?.(contract.id);
    } catch(e) {}
  }

  return (
    <div className={`ct-card status-${contract.status}`}>
      <div className="ct-head" onClick={toggleOpen}>
        <div className={`ct-status-pip ${contract.status}`} />
        <div className="ct-name">{contract.name}</div>
        <div className="ct-badges">
          <span className={`ct-badge ${contract.status}`}>{contract.status}</span>
          <span className="ct-badge">{contract.priority}</span>
          {(contract.assigned_to_gardener_name || contract.assigned_to_name) && (
            <span className="ct-badge">{contract.assigned_to_gardener_name || contract.assigned_to_name}</span>
          )}
        </div>
        <span className={`ct-chevron${open ? ' open' : ''}`}>▶</span>
      </div>

      {open && (
        <div className="ct-body">
          <div className="ct-meta-row">
            <span><b>Classification:</b> {contract.classification}</span>
            <span><b>Method:</b> {contract.method}</span>
            {contract.weapon && <span><b>Weapon:</b> {contract.weapon}</span>}
            <span><b>Opened:</b> {new Date(contract.created_at).toLocaleDateString()}</span>
          </div>

          {editing ? (
            <div>
              <div className="ct-phase">
                <div className="ct-phase-label">Target Name</div>
                <input className="ct-input"
                  value={edit.name}
                  onChange={e => setEdit(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="ct-phase">
                <div className="ct-phase-label">Classification / Role</div>
                <input className="ct-input"
                  value={edit.classification}
                  onChange={e => setEdit(prev => ({ ...prev, classification: e.target.value }))}
                  placeholder="e.g. Velocity Inhibitor…"
                />
              </div>
              <div className="ct-phase">
                <div className="ct-phase-label">Priority</div>
                <select className="sel" value={edit.priority}
                  onChange={e => setEdit(prev => ({ ...prev, priority: e.target.value }))}>
                  <option>Standard</option>
                  <option>Priority</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="ct-phase">
                <div className="ct-phase-label">Requested Method</div>
                <select className="sel" value={edit.method}
                  onChange={e => setEdit(prev => ({ ...prev, method: e.target.value }))}>
                  <option>Unspecified</option>
                  <option value="Silent Kill">Silent Kill</option>
                  <option value="Public Elimination">Public Elimination</option>
                  <option>Blackmail</option>
                </select>
              </div>
              <div className="ct-phase">
                <div className="ct-phase-label">Requested Weapon</div>
                <input className="ct-input"
                  value={edit.weapon}
                  onChange={e => setEdit(prev => ({ ...prev, weapon: e.target.value }))}
                  placeholder="e.g. Vibroblade, Poison, Force…"
                />
              </div>
              {isPrivileged && gardeners.length > 0 && (
                <div className="ct-phase">
                  <div className="ct-phase-label">Assigned To</div>
                  <select
                    className="sel"
                    value={edit.assigned_to}
                    onChange={e => setEdit(prev => ({ ...prev, assigned_to: e.target.value }))}
                  >
                    <option value="">— Unassigned —</option>
                    {gardeners.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.operativeName || g.charName || g.codeName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {[
                { key: 'notes_briefing', label: '◆ Briefing' },
                { key: 'notes_intel',    label: '◆ I — Information Gathering' },
                { key: 'notes_exec',     label: '◆ II — Execution' },
                { key: 'notes_exfil',    label: '◆ III — Exfiltration' },
              ].map(f => (
                <div key={f.key} className="ct-phase">
                  <div className="ct-phase-label">{f.label}</div>
                  <textarea className="ct-edit-area"
                    value={edit[f.key]}
                    onChange={e => setEdit(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={3}
                  />
                </div>
              ))}
              <div className="ct-actions">
                <button className="ct-action-btn green" onClick={saveEdit}>◆ Save Changes</button>
                <button className="ct-action-btn" onClick={() => { setEditing(false); setEditError(''); }}>Cancel</button>
                {editError && <span style={{ fontSize: '0.72rem', color: '#e74c3c' }}>{editError}</span>}
              </div>
            </div>
          ) : (
            <div className="ct-phases">
              {[
                { key: 'notes_briefing', label: '◆ Briefing' },
                { key: 'notes_intel',    label: '◆ I — Information Gathering' },
                { key: 'notes_exec',     label: '◆ II — Execution' },
                { key: 'notes_exfil',    label: '◆ III — Exfiltration' },
              ].map(f => (
                <div key={f.key} className="ct-phase">
                  <div className="ct-phase-label">{f.label}</div>
                  <div className={`ct-notes${!contract[f.key] ? ' ct-notes-empty' : ''}`}>
                    {contract[f.key] || '— No entry —'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Closed record */}
          {contract.status === 'complete' && contract.closed_approach && (
            <div className="ct-closed-record">
              <div className="ct-closed-header">◆ Harvest Report — Contract Closed</div>
              <div className="ct-closed-row"><b>Approach:</b> {contract.closed_approach}</div>
              {contract.closed_method && <div className="ct-closed-row"><b>Method / Tool:</b> {contract.closed_method}</div>}
              {contract.closed_date && <div className="ct-closed-row"><b>Closed:</b> {contract.closed_date}</div>}
              {contract.closed_notes && <div className="ct-closed-notes">{contract.closed_notes}</div>}
            </div>
          )}

          <RollLog rolls={rolls} />

          {showRollForm && (
            <RollForm
              contractId={contract.id}
              spireChar={spireChar}
              spireSkills={spireSkills}
              onRollAdded={r => setRolls(prev => [...prev, r])}
              onClose={() => setShowRollForm(false)}
            />
          )}

          {showCloseForm && contract.status !== 'complete' && (
            <CloseForm
              contract={contract}
              onClosed={c => { setContract(c); onUpdate?.(c); setShowCloseForm(false); }}
              onClose={() => setShowCloseForm(false)}
            />
          )}

          <div className="ct-actions">
            {canEditNotes && !editing && (
              <button className="ct-action-btn" onClick={startEdit}>◆ Edit Notes</button>
            )}
            {canEdit && canOperate && !showRollForm && contract.status !== 'complete' && (
              <button className="ct-action-btn" onClick={() => setShowRollForm(true)}>◆ Log Roll</button>
            )}
            {canEdit && canOperate && contract.status !== 'complete' && !showCloseForm && (
              <button className="ct-action-btn green" onClick={() => setShowCloseForm(true)}>◆ Close Contract</button>
            )}
            {canEdit && contract.status !== 'complete' && (
              <select className="sel" style={{width:'auto',padding:'4px 28px 4px 8px',fontSize:'0.72rem'}}
                value={contract.status}
                onChange={e => changeStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="compromised">Compromised</option>
              </select>
            )}
            {isPrivileged && (
              <button className="ct-action-btn danger" onClick={purge}>◆ Purge</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
