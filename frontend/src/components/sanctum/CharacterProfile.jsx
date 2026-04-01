import { useState, useRef, useEffect } from 'react';
import RankBadge from './RankBadge';
import { updateCharacter, uploadImage, getCharacters } from '../../api/sanctum';

const RANKS = ['acolyte', 'apprentice', 'lord', 'darth'];

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');

const SilhouetteSVG = () => (
  <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <ellipse cx="50" cy="35" rx="20" ry="22" fill="currentColor" opacity="0.15" />
    <path d="M20 140 Q20 80 50 75 Q80 80 80 140Z" fill="currentColor" opacity="0.15" />
  </svg>
);

const STAT_FIELDS = [
  { key: 'character_name',      label: 'Character Name' },
  { key: 'full_name',           label: 'Full Name' },
  { key: 'species',             label: 'Species' },
  { key: 'age',                 label: 'Age' },
  { key: 'height',              label: 'Height' },
  { key: 'eye_color',           label: 'Eye Color' },
  { key: 'hair_color',          label: 'Hair Color' },
  { key: 'skin_color',          label: 'Skin Color' },
  { key: 'tattoos_distinctions',label: 'Tattoos / Distinctions' },
  { key: 'alignment',           label: 'Alignment' },
  { key: 'homeworld',           label: 'Homeworld' },
  { key: 'occupation',          label: 'Occupation' },
  { key: 'affiliation',         label: 'Affiliation' },
  { key: 'relationship_status', label: 'Relationship Status' },
  { key: 'status_name',         label: 'Spire Status' },
];

const PERSONAL_FIELDS = [
  { key: 'likes',    label: 'Likes' },
  { key: 'dislikes', label: 'Dislikes' },
];

const NARRATIVE_FIELDS = [
  { key: 'biography',        label: 'Biography' },
  { key: 'skills_narrative', label: 'Skills' },
  { key: 'weapons',          label: 'Weapons' },
  { key: 'gear',             label: 'Gear' },
];

const EDITABLE_STAT_KEYS = STAT_FIELDS.map(f => f.key);

function NarrativeSection({ label, value }) {
  if (!value) return null;
  return (
    <div className="s-profile-narrative">
      <div className="s-profile-narrative-title">{label}</div>
      <div className="s-profile-narrative-body">{value}</div>
    </div>
  );
}

export default function CharacterProfile({ char, isOwn, canManage = false, onSaved }) {
  const [editing, setEditing]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState('');
  const [form,    setForm]      = useState({});
  const [masters, setMasters]   = useState([]);
  const fileRef = useRef();

  useEffect(() => {
    if (editing && canManage) getCharacters().then(setMasters).catch(() => {});
  }, [editing, canManage]);

  const imageUrl = char.image_url ? `${API_BASE}${char.image_url}` : null;

  function startEdit() {
    const initial = {};
    for (const key of [...EDITABLE_STAT_KEYS, ...PERSONAL_FIELDS.map(f => f.key), ...NARRATIVE_FIELDS.map(f => f.key)]) {
      initial[key] = char[key] || '';
    }
    initial.spire_rank = char.spire_rank || 'acolyte';
    initial.master_id  = char.master_id  || '';
    setForm(initial);
    setError('');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Remove empty strings → null
      const payload = {};
      for (const [k, v] of Object.entries(form)) {
        payload[k] = typeof v === 'string' ? (v.trim() || null) : v;
      }
      await updateCharacter(char.id, payload);
      await onSaved?.();
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadImage(char.id, file);
      await onSaved?.();
    } catch {
      // silently ignore for now
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="s-profile-edit-form">
        <div className="s-profile-edit-header">
          <div className="s-section-title" style={{ margin: 0 }}>Edit Profile</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="s-btn small" onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className="s-btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>

        {error && <div className="s-error">{error}</div>}

        {canManage && <div className="s-sanctum-only-section">
          <div className="s-section-title" style={{ margin: '0 0 1rem', fontSize: '0.65rem', color: 'var(--crimson)' }}>◆ Sanctum Only</div>
          <div className="s-profile-edit-grid">
            <div className="s-form-row">
              <label className="s-label">Rank</label>
              <select
                className="s-select"
                value={form.spire_rank || 'acolyte'}
                onChange={e => setForm(p => ({ ...p, spire_rank: e.target.value }))}
              >
                {RANKS.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="s-form-row">
              <label className="s-label">Master</label>
              <select
                className="s-select"
                value={form.master_id || ''}
                onChange={e => setForm(p => ({ ...p, master_id: e.target.value }))}
              >
                <option value="">— none —</option>
                {masters
                  .filter(m => m.user_id !== char.user_id)
                  .map(m => (
                    <option key={m.user_id} value={m.user_id}>{m.username} ({m.spire_rank})</option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>}

        <div className="s-profile-edit-section-title">Stats</div>
        <div className="s-profile-edit-grid">
          {EDITABLE_STAT_KEYS.map(key => {
            const label = STAT_FIELDS.find(f => f.key === key)?.label || key;
            return (
              <div key={key} className="s-form-row">
                <label className="s-label">{label}</label>
                <input
                  className="s-input"
                  value={form[key] || ''}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={label}
                />
              </div>
            );
          })}
        </div>

        <div className="s-profile-edit-section-title">Personal</div>
        {PERSONAL_FIELDS.map(({ key, label }) => (
          <div key={key} className="s-form-row">
            <label className="s-label">{label}</label>
            <textarea
              className="s-textarea"
              rows={3}
              value={form[key] || ''}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={label}
            />
          </div>
        ))}

        <div className="s-profile-edit-section-title">Narrative Sections</div>
        {NARRATIVE_FIELDS.map(({ key, label }) => (
          <div key={key} className="s-form-row">
            <label className="s-label">{label}</label>
            <textarea
              className="s-textarea"
              rows={6}
              value={form[key] || ''}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={`Write ${label.toLowerCase()}…`}
            />
          </div>
        ))}
      </form>
    );
  }

  return (
    <div className="s-profile">
      {/* ── Portrait Header ─────────────────────────────────────────────── */}
      <div className="s-profile-header">
        <div className="s-profile-portrait-wrap">
          <div className="s-profile-portrait">
            {imageUrl
              ? <img src={imageUrl} alt={char.username} />
              : <SilhouetteSVG />
            }
          </div>
          {isOwn && (
            <>
              <button
                className="s-btn small s-portrait-upload-btn"
                type="button"
                onClick={() => fileRef.current?.click()}
              >
                Change Portrait
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
            </>
          )}
        </div>

        <div className="s-profile-header-info">
          <div className="s-profile-codename">{char.character_name || char.username}</div>
          <div className="s-profile-charname" style={{ fontSize: '0.7rem', opacity: 0.55, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.08em' }}>
            by {char.username}
          </div>
          {char.full_name && (
            <div className="s-profile-fullname">{char.full_name}</div>
          )}
          <div className="s-profile-rank" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <RankBadge rank={char.spire_rank} />
            {char.faction && (
              <span className={`s-faction-badge s-faction-${char.faction}`}>
                {{ scythes: 'The Scythes', veil: 'The Veil', solstice: 'The Solstice', patron: 'The Patron' }[char.faction] || char.faction}
              </span>
            )}
          </div>
          {char.quote && (
            <blockquote className="s-profile-quote">"{char.quote}"</blockquote>
          )}
          {char.master_username && (
            <div className="s-profile-master">Master: {char.master_username}</div>
          )}
          {isOwn && (
            <button className="s-btn small" style={{ marginTop: '1rem' }} onClick={startEdit}>
              ✎ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="s-panel s-profile-stats-panel">
        <div className="s-profile-section-title">Character Info</div>
        <div className="s-profile-stats-grid">
          {STAT_FIELDS.map(({ key, label }) => {
            const value = char[key];
            if (!value) return null;
            return (
              <div key={key} className="s-profile-stat-row">
                <span className="s-profile-stat-label">{label}</span>
                <span className="s-profile-stat-value">{value || '—'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Personal ─────────────────────────────────────────────────────── */}
      {(char.likes || char.dislikes) && (
        <div className="s-panel s-profile-personal-panel">
          <div className="s-profile-section-title">Personal</div>
          <div className="s-profile-personal-grid">
            {char.likes && (
              <div>
                <div className="s-profile-personal-label">Likes</div>
                <div className="s-profile-personal-value">{char.likes}</div>
              </div>
            )}
            {char.dislikes && (
              <div>
                <div className="s-profile-personal-label">Dislikes</div>
                <div className="s-profile-personal-value">{char.dislikes}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Narrative Sections ───────────────────────────────────────────── */}
      {NARRATIVE_FIELDS.map(({ key, label }) => (
        <NarrativeSection key={key} label={label} value={char[key]} />
      ))}

      {/* Empty state for own profile */}
      {isOwn && !char.biography && !char.character_name && (
        <div className="s-panel" style={{ textAlign: 'center', color: 'var(--dim)', fontSize: '0.85rem' }}>
          Your profile is empty. Click <strong>Edit Profile</strong> to fill in your character's details.
        </div>
      )}
    </div>
  );
}
