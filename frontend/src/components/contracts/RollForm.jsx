import { useState } from 'react';
import client from '../../api/client';
import RollCalculator from '../sanctum/RollCalculator';

export default function RollForm({ contractId, spireChar, spireSkills = [], onRollAdded, onClose }) {
  const [situation, setSituation] = useState('');
  const [rollData,  setRollData]  = useState(null);
  const [saving,    setSaving]    = useState(false);

  if (!spireChar) {
    return (
      <div className="ct-close-form open">
        <div className="ct-close-title">◆ Log Mission Roll</div>
        <div style={{ color: 'var(--dim)', fontSize: '0.78rem', padding: '1rem 0' }}>
          Create your Sanctum character to unlock roll logging.
        </div>
        <button className="ct-action-btn" onClick={onClose}>Cancel</button>
      </div>
    );
  }

  const attrs = {
    str: spireChar.str || 1, dex: spireChar.dex || 1, con: spireChar.con || 1,
    int_score: spireChar.int_score || 1, wis: spireChar.wis || 1, cha: spireChar.cha || 1,
  };

  async function save() {
    if (!situation.trim() || !rollData?.nat) return;
    setSaving(true);
    try {
      const res = await client.post(`/contracts/${contractId}/rolls`, {
        situation:   situation.trim(),
        skill_name:  rollData.label,
        skill_bonus: rollData.totalMod,
        dc:          rollData.dc,
        natural:     rollData.nat,
        modifier:    rollData.totalMod,
        total:       rollData.total,
        outcome:     rollData.outcome,
      });
      onRollAdded(res.data);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ct-close-form open">
      <div className="ct-close-title">◆ Log Mission Roll</div>
      <div className="ct-close-grid">

        <div className="full">
          <label className="ct-close-label">Situation</label>
          <input
            className="ct-close-input"
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder="Describe the situation…"
          />
        </div>

        <div style={{ gridColumn: '1/-1' }}>
          <RollCalculator
            attrs={attrs}
            skills={spireSkills}
            onChange={setRollData}
          />
        </div>

        <button
          className="ct-save-close-btn"
          onClick={save}
          disabled={saving || !rollData?.nat || !situation.trim()}
        >
          {saving ? '… Logging …' : '◆ Log Roll ◆'}
        </button>
        <button className="ct-action-btn full" onClick={onClose} style={{ gridColumn: '1/-1' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
