import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

const FACTION_LABEL = {
  veil:     'The Veil',
  scythes:  'The Scythes',
  solstice: 'The Solstice',
  patron:   'The Patron',
};

const FIELD = ({ label, value }) => (
  <div>
    <div className="field-label">{label}</div>
    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>
      {value || <span style={{ color: 'var(--dim)', fontStyle: 'italic' }}>—</span>}
    </div>
  </div>
);

export default function ProfilePage() {
  const { user } = useAuth();
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() {
    if (!user) return;
    client.get(`/users/${user.id}/sheet`).then(r => {
      setSheet(r.data);
      if (!r.data.gardener_name) setEditing(true); // no character yet — open form
    }).catch(() => {});
  }

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (sheet && editing) {
      setForm({
        gardener_name: sheet.gardener_name || '',
        name_origin:   sheet.name_origin   || '',
        species:       sheet.species        || '',
        specialties:   (sheet.specialties || []).join(', '),
        bio:           sheet.bio            || '',
      });
    }
  }, [sheet, editing]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      await client.patch(`/users/${user.id}/sheet`, {
        ...form,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
      });
      setEditing(false);
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const noCharacter = sheet && !sheet.gardener_name;

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Operative Dossier</div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <span className="ct-badge active" style={{ fontSize: '0.65rem' }}>
            {FACTION_LABEL[user.faction] || user.faction}
          </span>
          {user.faction === 'solstice' && (
            <span className="ct-badge" style={{ borderColor: 'rgba(180,100,220,0.5)', color: '#cc88ff' }}>The Solstice</span>
          )}
        </div>

        {/* No character yet */}
        {noCharacter && !editing && (
          <div style={{ color: 'var(--dim)', fontSize: '0.82rem', marginBottom: '1rem' }}>
            You haven't created your Gardener character yet.
          </div>
        )}

        {/* View mode */}
        {!editing && sheet?.gardener_name && (
          <div>
            <div className="sheet-grid">
              <FIELD label="Gardener Name"   value={sheet.gardener_name} />
              <FIELD label="Origin of Name"  value={sheet.name_origin} />
              <FIELD label="Species"         value={sheet.species} />
              <FIELD label="Specialties"     value={sheet.specialties?.join(', ')} />
            </div>
            {sheet.bio && (
              <div style={{ marginTop: '1.25rem' }}>
                <div className="field-label">Background</div>
                <div style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: '0.82rem',
                  color: 'var(--dim)',
                  lineHeight: 1.75,
                  whiteSpace: 'pre-wrap',
                  marginTop: '0.35rem',
                }}>
                  {sheet.bio}
                </div>
              </div>
            )}
            <div style={{ marginTop: '1.25rem' }}>
              <button className="ct-action-btn" onClick={() => setEditing(true)}>◆ Edit Dossier</button>
            </div>
          </div>
        )}

        {/* Edit / create form */}
        {editing && form && (
          <div>
            <div className="sheet-grid">
              <div>
                <label className="field-label">Gardener Name</label>
                <input className="ct-input" value={form.gardener_name}
                  onChange={e => setForm(p => ({ ...p, gardener_name: e.target.value }))}
                  placeholder="Your assassin codename…" />
              </div>
              <div>
                <label className="field-label">Origin of Name</label>
                <input className="ct-input" value={form.name_origin}
                  onChange={e => setForm(p => ({ ...p, name_origin: e.target.value }))}
                  placeholder="Where does the name come from?" />
              </div>
              <div>
                <label className="field-label">Species</label>
                <input className="ct-input" value={form.species}
                  onChange={e => setForm(p => ({ ...p, species: e.target.value }))}
                  placeholder="e.g. Twi'lek, Human, Zabrak…" />
              </div>
              <div>
                <label className="field-label">Specialties</label>
                <input className="ct-input" value={form.specialties}
                  onChange={e => setForm(p => ({ ...p, specialties: e.target.value }))}
                  placeholder="e.g. Infiltration, Deception, Sith Sorcery" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Background</label>
                <textarea className="ct-textarea" rows={5} value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="History, background, motivations…" />
              </div>
            </div>
            {error && <div style={{ color: '#e74c3c', fontSize: '0.75rem', margin: '0.5rem 0' }}>{error}</div>}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="ct-action-btn green" onClick={save} disabled={saving}>
                {saving ? '… Saving …' : '◆ Save Dossier'}
              </button>
              {sheet?.gardener_name && (
                <button className="ct-action-btn" onClick={() => setEditing(false)}>Cancel</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
