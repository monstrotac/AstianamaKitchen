import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import D20Die from '../components/roller/D20Die';
import BonusBox from '../components/roller/BonusBox';
import RollResult from '../components/roller/RollResult';
import { useRoller } from '../hooks/useRoller';

import { DC_OPTIONS as GAME_DC_OPTIONS } from '../utils/rollUtils';

// Map the game DC options for this page (filter out Custom for the select)
const DC_OPTIONS = GAME_DC_OPTIONS;

export default function HarvestPage() {
  const { user } = useAuth();
  const [skills, setSkills]         = useState([]);
  const [baseModifier, setBase]     = useState(3);
  const [selectedSkill, setSkill]   = useState(null);
  const [dcSel, setDcSel]           = useState(12);
  const [customDC, setCustomDC]     = useState(12);
  const { rolling, die1Display, die2Display, spinning, result, roll } = useRoller();

  useEffect(() => {
    if (!user) return;
    client.get(`/users/${user.id}/skills`).then(res => {
      setSkills(res.data.skills);
      setBase(res.data.base_modifier);
      if (res.data.skills.length) setSkill(res.data.skills[0]);
    }).catch(() => {});
  }, [user]);

  const activeDC   = dcSel === -1 ? (parseInt(customDC) || 12) : dcSel;
  const skillBonus = selectedSkill?.bonus ?? 0;
  const totalModifier = skillBonus + baseModifier;

  function handleRoll() {
    roll(totalModifier, activeDC);
  }

  return (
    <div className="panel">
      <div className="panel-title">Mission Assessment — 2d10 System</div>
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
            <select className="sel" value={dcSel} onChange={e => setDcSel(Number(e.target.value))}>
              {DC_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div className="dc-row">
              <span className="dc-lbl">Target DC:</span>
              {dcSel === -1
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
          <D20Die display1={die1Display} display2={die2Display} spinning={spinning} onRoll={handleRoll} />
          <button className="roll-btn" onClick={handleRoll} disabled={rolling}>
            {'\u25C6'} Cast the Dice {'\u25C6'}
          </button>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'0.68rem',color:'var(--dim)',textAlign:'center',lineHeight:1.8}}>
            Click dice or button to roll 2d10<br/>
            <span style={{color:'rgba(220,20,60,0.45)'}}>The blade decides all things</span>
          </div>
        </div>
      </div>

      <RollResult result={result} />
    </div>
  );
}
