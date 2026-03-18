import { useState } from 'react';
import client from '../../api/client';

export default function SkillTable({ userId, skills, baseModifier, editable, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState(false);

  function startEdit() {
    const init = {};
    skills.forEach(s => { init[s.skill_name] = s.bonus; });
    setOverrides(init);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      await client.patch(`/users/${userId}/skills`, {
        overrides: Object.entries(overrides).map(([skill_name, bonus]) => ({ skill_name, bonus: parseInt(bonus) }))
      });
      onSaved?.();
      setEditing(false);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <table className="skill-table">
        <thead>
          <tr>
            <th>Skill</th>
            <th>Bonus</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {skills.map(s => (
            <tr key={s.skill_name}>
              <td>{s.skill_name}</td>
              <td>
                {editing
                  ? <input type="number" style={{width:50,background:'rgba(0,0,0,0.5)',border:'1px solid var(--border)',color:'var(--text)',padding:'2px 4px',fontFamily:"'Share Tech Mono',monospace"}}
                      value={overrides[s.skill_name] ?? s.bonus}
                      onChange={e => setOverrides(prev => ({ ...prev, [s.skill_name]: e.target.value }))}
                    />
                  : <span className="skill-bonus">{s.bonus >= 0 ? `+${s.bonus}` : s.bonus}</span>
                }
              </td>
              <td style={{color:'var(--dim)'}}>{(() => { const t = parseInt(editing ? overrides[s.skill_name] ?? s.bonus : s.bonus) + baseModifier; return t >= 0 ? `+${t}` : t; })()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {editable && (
        <div style={{marginTop:10,display:'flex',gap:8}}>
          {editing
            ? <>
                <button className="ct-action-btn green" onClick={save} disabled={saving}>
                  {saving ? '… Saving …' : '◆ Save Skills'}
                </button>
                <button className="ct-action-btn" onClick={() => setEditing(false)}>Cancel</button>
              </>
            : <button className="ct-action-btn" onClick={startEdit}>◆ Edit Skills</button>
          }
        </div>
      )}
    </div>
  );
}
