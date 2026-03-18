import { useState } from 'react';
import client from '../../api/client';

const APPROACHES = [
  'Silent Elimination', 'Blackmail & Leverage', 'Public Execution',
  'Blade — Personal', 'Poison', 'Staged Accident', 'Capture & Extract', 'Other',
];

export default function CloseForm({ contract, onClosed, onClose }) {
  const [approach, setApproach] = useState(APPROACHES[0]);
  const [method, setMethod]     = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  async function seal() {
    setSaving(true);
    try {
      const res = await client.patch(`/contracts/${contract.id}/close`, {
        closed_approach: approach,
        closed_method:   method,
        closed_notes:    notes,
      });
      onClosed(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ct-close-form open">
      <div className="ct-close-title">◆ Seal the Contract — Harvest Report</div>
      <div className="ct-close-grid">
        <div>
          <label className="ct-close-label">Approach</label>
          <select className="ct-close-select" value={approach} onChange={e => setApproach(e.target.value)}>
            {APPROACHES.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="ct-close-label">Specific Method / Tool</label>
          <input className="ct-close-input" value={method} onChange={e => setMethod(e.target.value)}
            placeholder="Specify tool, method, weapon…" />
        </div>
        <div className="full">
          <label className="ct-close-label">Final Report & Outcome</label>
          <textarea className="ct-close-textarea" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Full account of the operation's conclusion…" rows={4} />
        </div>
        <button className="ct-save-close-btn" onClick={seal} disabled={saving}>
          {saving ? '… Sealing …' : '◆ Seal the Contract ◆'}
        </button>
        <button className="ct-action-btn" onClick={onClose} style={{gridColumn:'1/-1'}}>Cancel</button>
      </div>
    </div>
  );
}
