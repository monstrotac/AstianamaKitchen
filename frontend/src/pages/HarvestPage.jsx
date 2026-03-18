import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import D20Die from '../components/roller/D20Die';
import BonusBox from '../components/roller/BonusBox';
import RollResult from '../components/roller/RollResult';
import { useRoller } from '../hooks/useRoller';

const DC_OPTIONS = [
  { value: 8,  label: 'Routine — DC 8' },
  { value: 12, label: 'Somewhat Difficult — DC 12' },
  { value: 15, label: 'Difficult — DC 15' },
  { value: 18, label: 'Very Difficult — DC 18' },
  { value: 22, label: 'Extremely Difficult — DC 22' },
  { value: 25, label: 'Near Impossible — DC 25' },
  { value: 'custom', label: 'Custom DC' },
];

export default function HarvestPage() {
  const { user } = useAuth();
  const [skills, setSkills]         = useState([]);
  const [baseModifier, setBase]     = useState(3);
  const [selectedSkill, setSkill]   = useState(null);
  const [dcSel, setDcSel]           = useState(12);
  const [customDC, setCustomDC]     = useState(12);
  const { rolling, dieDisplay, spinning, result, roll } = useRoller();

  useEffect(() => {
    if (!user) return;
    client.get(`/users/${user.id}/skills`).then(res => {
      setSkills(res.data.skills);
      setBase(res.data.base_modifier);
      if (res.data.skills.length) setSkill(res.data.skills[0]);
    }).catch(() => {});
  }, [user]);

  const activeDC   = dcSel === 'custom' ? (parseInt(customDC) || 12) : dcSel;
  const skillBonus = selectedSkill?.bonus ?? 0;

  function handleRoll() {
    roll(skillBonus, baseModifier, activeDC);
  }

  return (
    <div className="panel">
      <div className="panel-title">Mission Assessment — D20 System</div>
      <div className="roller-grid">
        {/* Controls */}
        <div>
          <div className="field-group">
            <label className="field-label">Operative Skill</label>
            <select className="sel" value={selectedSkill?.skill_name || ''} onChange={e => {
              const s = skills.find(sk => sk.skill_name === e.target.value);
              setSkill(s);
            }}>
              {skills.map(s => (
                <option key={s.skill_name} value={s.skill_name}>
                  {s.skill_name} ({s.bonus >= 0 ? `+${s.bonus}` : s.bonus})
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Mission Difficulty</label>
            <select className="sel" value={dcSel} onChange={e => {
              const v = e.target.value === 'custom' ? 'custom' : parseInt(e.target.value);
              setDcSel(v);
            }}>
              {DC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="dc-row">
              <span className="dc-lbl">Target DC:</span>
              {dcSel === 'custom'
                ? <input type="number" className="dc-input" min="1" max="40" value={customDC}
                    onChange={e => setCustomDC(e.target.value)} style={{display:'inline-block'}} />
                : <span className="dc-num">{dcSel}</span>
              }
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Operative Dossier</label>
            <BonusBox skillBonus={skillBonus} baseModifier={baseModifier} />
          </div>
        </div>

        {/* Die */}
        <div className="die-col">
          <D20Die display={dieDisplay} spinning={spinning} onRoll={handleRoll} />
          <button className="roll-btn" onClick={handleRoll} disabled={rolling}>
            ◆ Cast the Die ◆
          </button>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'0.68rem',color:'var(--dim)',textAlign:'center',lineHeight:1.8}}>
            Click die or button to roll<br/>
            <span style={{color:'rgba(220,20,60,0.45)'}}>The blade decides all things</span>
          </div>
        </div>
      </div>

      <RollResult result={result} />
    </div>
  );
}
