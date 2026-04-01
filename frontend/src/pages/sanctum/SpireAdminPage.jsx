import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useTitle } from '../../hooks/useTitle';
import client from '../../api/client';
import { getCharactersForUser, getSkills } from '../../api/sanctum';
import CharacterSheet from '../../components/sanctum/CharacterSheet';

const FACTION_LABEL = {
  scythes:  'The Scythes',
  veil:     'The Veil',
  solstice: 'The Solstice',
  patron:   'The Patron',
};

const RANK_LABEL = { acolyte: 'Acolyte', apprentice: 'Apprentice', lord: 'Lord', darth: 'Darth' };

// ── Create user form ──────────────────────────────────────────────────────────
function CreateUserForm({ onCreated }) {
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!form.email || !form.password || !form.username) { setError('All fields required'); return; }
    setSaving(true); setError('');
    try {
      const res = await client.post('/users', form);
      onCreated(res.data);
      setForm({ email: '', password: '', username: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  }

  return (
    <div className="s-panel" style={{ marginBottom: '1.5rem' }}>
      <div className="s-section-title" style={{ marginBottom: '1rem' }}>Enlist New Operative</div>
      <form onSubmit={submit}>
        <div className="s-two-col">
          <div className="s-form-row">
            <label className="s-label">Username</label>
            <input className="s-input" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="Login username…" required />
          </div>
          <div className="s-form-row">
            <label className="s-label">Email</label>
            <input className="s-input" type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="operative@order.local" required />
          </div>
          <div className="s-form-row">
            <label className="s-label">Initial Passphrase</label>
            <input className="s-input" type="password" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••••••" required />
          </div>
        </div>
        {error && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</div>}
        <button className="s-btn" type="submit" disabled={saving}>
          {saving ? 'Enlisting…' : '◆ Enlist Operative'}
        </button>
      </form>
    </div>
  );
}

// ── Pending guest row ─────────────────────────────────────────────────────────
function GuestRow({ guest, onPromoted, onDeleted }) {
  const [saving, setSaving] = useState(false);

  async function grantAccess() {
    setSaving(true);
    try {
      const res = await client.patch(`/users/${guest.id}`, { role: 'user' });
      onPromoted(res.data);
    } catch (e) {} finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm(`Permanently delete guest ${guest.username}?`)) return;
    setSaving(true);
    try {
      await client.delete(`/users/${guest.id}`);
      onDeleted(guest.id);
    } catch (e) { alert(e.response?.data?.error || 'Delete failed.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="s-admin-row">
      <div style={{ flex: 1 }}>
        <div className="s-admin-name">{guest.username}</div>
        <div className="s-admin-meta">
          {guest.email} — registered {new Date(guest.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button className="s-btn small" onClick={grantAccess} disabled={saving}>
          {saving ? '…' : '◆ Grant Access'}
        </button>
        <button className="s-btn small danger" onClick={handleDelete} disabled={saving}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Active operative row ──────────────────────────────────────────────────────
function OperativeRow({ operative, onUpdate, onDeleted }) {
  const [expanded, setExpanded] = useState(false);
  const [spireChar, setSpireChar] = useState(null);
  const [spireSkills, setSpireSkills] = useState([]);
  const [editingSheet, setEditingSheet] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadChar = useCallback(async () => {
    try {
      const chars = await getCharactersForUser(operative.id);
      const c = chars[0];
      if (c) {
        const s = await getSkills(c.id);
        setSpireChar(c);
        setSpireSkills(s);
      }
    } catch (e) {}
  }, [operative.id]);

  async function toggleExpand() {
    if (expanded) { setExpanded(false); setEditingSheet(false); return; }
    await loadChar();
    setExpanded(true);
  }

  async function toggleActive() {
    setSaving(true);
    try {
      const res = await client.patch(`/users/${operative.id}`, { isActive: !operative.isActive });
      onUpdate(res.data);
    } catch (e) {} finally { setSaving(false); }
  }

  async function changeRole(role) {
    try {
      const res = await client.patch(`/users/${operative.id}`, { role });
      onUpdate(res.data);
    } catch (e) {}
  }

  async function resetPassword() {
    const pw = prompt(`New passphrase for ${operative.username}:`);
    if (!pw) return;
    try {
      await client.patch(`/users/${operative.id}`, { password: pw });
    } catch (e) { alert('Failed.'); }
  }

  async function handleDelete() {
    if (!window.confirm(`Permanently delete ${operative.username}? This will remove all their characters, stories, trials, and reports. This cannot be undone.`)) return;
    setSaving(true);
    try {
      await client.delete(`/users/${operative.id}`);
      onDeleted(operative.id);
    } catch (e) { alert(e.response?.data?.error || 'Delete failed.'); }
    finally { setSaving(false); }
  }

  // Faction comes from the character (shown once expanded, or from operative.faction via join)
  const factionLabel = operative.faction ? FACTION_LABEL[operative.faction] : '— no faction —';
  const rankLabel    = operative.spireRank ? RANK_LABEL[operative.spireRank] || operative.spireRank : null;

  return (
    <div className="s-admin-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div className="s-admin-name">
            {operative.username}
            {!operative.isActive && (
              <span style={{ color: '#c55', fontSize: '0.62rem', marginLeft: '0.5rem', letterSpacing: '0.1em' }}>
                DEACTIVATED
              </span>
            )}
          </div>
          <div className="s-admin-meta">
            {factionLabel}
            {rankLabel && <span style={{ marginLeft: '0.4rem', opacity: 0.6 }}>· {rankLabel}</span>}
            <span style={{ marginLeft: '0.4rem', opacity: 0.5 }}>· {operative.role} · {operative.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="s-btn small" onClick={toggleExpand}>
            {expanded ? '▲ Collapse' : '▼ Character'}
          </button>
          <button className="s-btn small" onClick={resetPassword}>Reset PW</button>
          <select
            className="s-select"
            style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}
            value={operative.role}
            onChange={e => changeRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest (revoke)</option>
          </select>
          <button
            className={`s-btn small${operative.isActive ? ' danger' : ''}`}
            onClick={toggleActive} disabled={saving}
          >
            {operative.isActive ? 'Deactivate' : 'Reinstate'}
          </button>
          <button className="s-btn small danger" onClick={handleDelete} disabled={saving}>
            Delete
          </button>
        </div>
      </div>

      {expanded && spireChar && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-sub)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--dim)', fontFamily: 'Orbitron, monospace' }}>
              SPIRE CHARACTER
              {spireChar.spire_rank && ` — ${RANK_LABEL[spireChar.spire_rank] || spireChar.spire_rank}`}
              {spireChar.faction && ` · ${FACTION_LABEL[spireChar.faction] || spireChar.faction}`}
            </span>
            <button className="s-btn small" onClick={() => setEditingSheet(p => !p)}>
              {editingSheet ? '◆ View' : '✎ Edit Sheet'}
            </button>
          </div>
          <CharacterSheet
            char={spireChar}
            skills={spireSkills}
            editing={editingSheet}
            isOwn={false}
            onSaved={async () => { await loadChar(); setEditingSheet(false); }}
            onSkillsChanged={loadChar}
          />
        </div>
      )}
      {expanded && !spireChar && (
        <div style={{ marginTop: '1rem', color: 'var(--dim)', fontSize: '0.8rem' }}>
          No Sanctum character created yet.
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SpireAdminPage() {
  useTitle('Admin');
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    client.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  if (!isAdmin) return <Navigate to="/" replace />;

  function handleCreated(u) { setUsers(prev => [...prev, u]); }
  function handleUpdate(updated) {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
  }
  function handleDeleted(id) {
    setUsers(prev => prev.filter(u => u.id !== id));
  }

  const guests     = users.filter(u => u.role === 'guest');
  const operatives = users.filter(u => u.role !== 'guest');

  // Group operatives by faction for a cleaner view
  const factionOrder = ['scythes', 'veil', 'solstice', 'patron', null];
  const grouped = factionOrder.map(f => ({
    faction: f,
    label: f ? FACTION_LABEL[f] : 'No Faction',
    members: operatives.filter(o => (o.faction || null) === f),
  })).filter(g => g.members.length > 0);

  return (
    <div>
      <div className="s-section-title" style={{ marginBottom: '1.5rem' }}>Administration</div>

      <CreateUserForm onCreated={handleCreated} />

      {guests.length > 0 && (
        <div className="s-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="s-section-title" style={{ marginBottom: '1rem' }}>
            Pending Access ({guests.length})
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--dim)', marginBottom: '1rem', fontFamily: 'Share Tech Mono, monospace' }}>
            These accounts have registered but have not been granted access. Grant access, then assign a faction via their character sheet.
          </div>
          {guests.map(g => <GuestRow key={g.id} guest={g} onPromoted={handleUpdate} onDeleted={handleDeleted} />)}
        </div>
      )}

      <div className="s-panel">
        <div className="s-section-title" style={{ marginBottom: '1rem' }}>Operatives</div>
        {operatives.length === 0
          ? <div className="s-empty">No operatives enlisted.</div>
          : grouped.map(g => (
            <div key={g.faction || 'none'} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '0.55rem', fontFamily: 'Orbitron, monospace', letterSpacing: '0.2em',
                color: 'var(--dim)', textTransform: 'uppercase', marginBottom: '0.5rem',
                paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-sub)',
              }}>
                {g.label}
              </div>
              {g.members.map(o => <OperativeRow key={o.id} operative={o} onUpdate={handleUpdate} onDeleted={handleDeleted} />)}
            </div>
          ))
        }
      </div>
    </div>
  );
}
