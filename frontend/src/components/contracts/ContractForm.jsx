import { useState, useEffect } from 'react';
import client from '../../api/client';

export default function ContractForm({ onCreated, gardeners, isPatron }) {
  const [form, setForm] = useState({
    name: '', classification: '', priority: 'Standard', method: 'Unspecified',
    weapon: '', status: 'active', assigned_to: '',
    notes_briefing: '', notes_intel: '', notes_exec: '', notes_exfil: '',
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function submit() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.assigned_to) delete payload.assigned_to;
      const res = await client.post('/contracts', payload);
      onCreated?.(res.data);
      setForm({ name: '', classification: '', priority: 'Standard', method: 'Unspecified',
        weapon: '', status: 'active', assigned_to: '',
        notes_briefing: '', notes_intel: '', notes_exec: '', notes_exfil: '' });
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-title">Log New Contract</div>
      <div className="ct-form">
        <div>
          <label className="field-label">Target Name</label>
          <input className="ct-input" value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Full name or designation…" />
        </div>
        <div>
          <label className="field-label">Classification / Role</label>
          <input className="ct-input" value={form.classification} onChange={e => set('classification', e.target.value)}
            placeholder="e.g. Velocity Inhibitor…" />
        </div>
        <div>
          <label className="field-label">Priority</label>
          <select className="sel" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option>Standard</option>
            <option>Priority</option>
            <option>Critical</option>
          </select>
        </div>
        <div>
          <label className="field-label">Requested Method</label>
          <select className="sel" value={form.method} onChange={e => set('method', e.target.value)}>
            <option>Unspecified</option>
            <option value="Silent Kill">Silent Kill</option>
            <option value="Public Elimination">Public Elimination</option>
            <option>Blackmail</option>
          </select>
        </div>
        <div>
          <label className="field-label">Requested Weapon</label>
          <input className="ct-input" value={form.weapon} onChange={e => set('weapon', e.target.value)}
            placeholder="e.g. Vibroblade, Poison, Force…" />
        </div>
        {!isPatron && (
          <div>
            <label className="field-label">Assign To</label>
            <select className="sel" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
              <option value="">— Unassigned —</option>
              {gardeners.map(g => (
                <option key={g.id} value={g.id}>
                  {g.operativeName || g.charName || g.codeName}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="full">
          <label className="field-label">◆ Briefing</label>
          <textarea className="ct-textarea" value={form.notes_briefing} onChange={e => set('notes_briefing', e.target.value)}
            placeholder="Client identity, stated objective, terms, context…" />
        </div>
        <div className="full">
          <label className="field-label">◆ I — Information Gathering</label>
          <textarea className="ct-textarea" value={form.notes_intel} onChange={e => set('notes_intel', e.target.value)}
            placeholder="Known location, habits, guard detail, intel…" />
        </div>
        <div className="full">
          <label className="field-label">◆ II — Execution</label>
          <textarea className="ct-textarea" value={form.notes_exec} onChange={e => set('notes_exec', e.target.value)}
            placeholder="Method, approach, timing, tools…" />
        </div>
        <div className="full">
          <label className="field-label">◆ III — Exfiltration</label>
          <textarea className="ct-textarea" value={form.notes_exfil} onChange={e => set('notes_exfil', e.target.value)}
            placeholder="Escape route, cover identity, contingencies…" />
        </div>
        <button className="ct-add-btn full" onClick={submit} disabled={saving}>
          {saving ? '… Opening …' : '◆ Open Contract ◆'}
        </button>
      </div>
    </div>
  );
}
