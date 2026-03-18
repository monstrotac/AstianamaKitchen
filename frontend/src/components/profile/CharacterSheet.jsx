import { useState } from 'react';
import client from '../../api/client';

export default function CharacterSheet({ userId, sheet, editable, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    species:       sheet?.species || '',
    alignment:     sheet?.alignment || 'The Order',
    specialties:   (sheet?.specialties || []).join(', '),
    bio:           sheet?.bio || '',
    base_modifier: sheet?.base_modifier ?? 3,
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await client.patch(`/users/${userId}/sheet`, {
        ...form,
        specialties:   form.specialties.split(',').map(s => s.trim()).filter(Boolean),
        base_modifier: parseInt(form.base_modifier) || 3,
      });
      onSaved?.();
      setEditing(false);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  if (editing) {
    return (
      <div>
        <div className="sheet-grid">
          <div>
            <label className="field-label">Species</label>
            <input className="ct-input" value={form.species} onChange={e => set('species', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Alignment</label>
            <input className="ct-input" value={form.alignment} onChange={e => set('alignment', e.target.value)} />
          </div>
          <div>
            <label className="field-label">Base Modifier</label>
            <input type="number" className="ct-input" value={form.base_modifier}
              onChange={e => set('base_modifier', e.target.value)} min="0" max="10" />
          </div>
          <div>
            <label className="field-label">Specialties (comma-separated)</label>
            <input className="ct-input" value={form.specialties}
              onChange={e => set('specialties', e.target.value)}
              placeholder="e.g. Infiltration, Explosives, Sith Sorcery" />
          </div>
          <div className="full" style={{gridColumn:'1/-1'}}>
            <label className="field-label">Bio / Background</label>
            <textarea className="ct-textarea" value={form.bio}
              onChange={e => set('bio', e.target.value)} rows={4}
              placeholder="Background, history, notes…" />
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:10}}>
          <button className="ct-action-btn green" onClick={save} disabled={saving}>
            {saving ? '… Saving …' : '◆ Save Sheet'}
          </button>
          <button className="ct-action-btn" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sheet-grid">
        {[
          ['Species', sheet?.species || '—'],
          ['Alignment', sheet?.alignment || '—'],
          ['Base Modifier', `+${sheet?.base_modifier ?? 3}`],
          ['Specialties', sheet?.specialties?.join(', ') || '—'],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'0.6rem',letterSpacing:'0.2em',color:'rgba(220,20,60,0.7)',textTransform:'uppercase',marginBottom:4}}>
              {label}
            </div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'0.82rem',color:'var(--text)'}}>
              {val}
            </div>
          </div>
        ))}
        {sheet?.bio && (
          <div style={{gridColumn:'1/-1'}}>
            <div style={{fontFamily:"'Orbitron',sans-serif",fontSize:'0.6rem',letterSpacing:'0.2em',color:'rgba(220,20,60,0.7)',textTransform:'uppercase',marginBottom:4}}>Background</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'0.78rem',color:'var(--dim)',lineHeight:1.7,whiteSpace:'pre-wrap'}}>
              {sheet.bio}
            </div>
          </div>
        )}
      </div>
      {editable && (
        <div style={{marginTop:10}}>
          <button className="ct-action-btn" onClick={() => setEditing(true)}>◆ Edit Sheet</button>
        </div>
      )}
    </div>
  );
}
