import { useState, useMemo } from 'react';
import { useSanctum } from '../../contexts/SanctumContext';
import {
  ATTRS, ATTR_LABELS, ATTRIBUTE_DESCRIPTIONS,
  DC_OPTIONS, ROLL_TYPES, SKILL_LIST, SAVING_THROWS, ATTACK_SKILLS,
  getRollBonus, ARMOR_TYPES,
} from '../../utils/rollUtils';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function RollPanel({ onRoll, onAttackDeclare, onClose, members = [] }) {
  const { activeChar, activeSkills, descriptions } = useSanctum();
  const { user } = useAuth();

  const [rollType, setRollType]   = useState('skill');
  const [attrKey, setAttrKey]     = useState('str');
  const [skillKey, setSkillKey]   = useState('');
  const [saveKey, setSaveKey]     = useState('fortitude');
  const [dcOption, setDcOption]   = useState(12);
  const [customDc, setCustomDc]   = useState(12);
  const [skillSearch, setSkillSearch] = useState('');
  const [expanded, setExpanded]   = useState(null);

  // Targeting state (attack only)
  const [targetUserId, setTargetUserId] = useState(null);

  const attrs = activeChar || {};
  const dc = dcOption === -1 ? customDc : dcOption;
  const skillOptions = rollType === 'attack' ? ATTACK_SKILLS : SKILL_LIST;
  const isTargetedAttack = rollType === 'attack' && targetUserId;

  // Other members (exclude self)
  const otherMembers = members.filter(m => m.user_id !== user?.id);
  const targetMember = otherMembers.find(m => m.user_id === targetUserId);

  // Filter skills by search (name or description)
  const query = skillSearch.trim().toLowerCase();
  const { filteredSkills, descMatchedSet } = useMemo(() => {
    if (!query) return { filteredSkills: skillOptions, descMatchedSet: new Set() };
    const matched = [];
    const descHits = new Set();
    for (const s of skillOptions) {
      const nameHit = s.skill_name.toLowerCase().includes(query);
      const desc = descriptions?.find(d => d.type === 'skill' && d.key === s.skill_name);
      const descHit = (desc?.description ?? '').toLowerCase().includes(query);
      if (nameHit || descHit) {
        matched.push(s);
        if (descHit && !nameHit) descHits.add(s.skill_name);
      }
    }
    return { filteredSkills: matched, descMatchedSet: descHits };
  }, [query, skillOptions, descriptions]);

  function getSkillDesc(name) {
    return descriptions?.find(d => d.type === 'skill' && d.key === name)?.description ?? null;
  }

  function selectSkill(name) {
    setSkillKey(name);
    setSkillSearch('');
  }

  function handleRollTypeChange(val) {
    setRollType(val);
    setSkillKey('');
    setSkillSearch('');
    setTargetUserId(null);
  }

  function handleRoll() {
    const bonus = getRollBonus({
      rollType, attrKey, saveKey, attrs,
      skills: activeSkills, skillKey: skillKey || undefined,
    });

    if (isTargetedAttack) {
      // Targeted attack: declare the attack, defender picks defense
      onAttackDeclare?.({
        modifier: bonus.total,
        skillLabel: bonus.label,
        attackSkill: skillKey,
        targetUserId,
      });
    } else {
      // Non-targeted roll (skill check, attribute, save, or manual DC attack)
      onRoll({
        modifier: bonus.total,
        dc,
        isCombat: rollType === 'attack',
        skillLabel: bonus.label,
        rollType,
      });
    }
  }

  const selectedDesc = skillKey ? getSkillDesc(skillKey) : null;
  const selectedRank = skillKey
    ? (activeSkills.find(x => x.skill_name === skillKey)?.rank ?? 0)
    : null;

  // Target armor info
  const targetArmor = targetMember?.armor || 'unarmored';
  const targetArmorInfo = ARMOR_TYPES.find(a => a.name.toLowerCase() === targetArmor) || ARMOR_TYPES[0];

  return (
    <div className="sess-roll-panel">
      <div className="sess-roll-panel-title">Configure Roll</div>
      <div className="sess-roll-config">
        {/* Roll Type */}
        <div className="field-group">
          <label className="field-label">Roll Type</label>
          <select className="sel" value={rollType} onChange={e => handleRollTypeChange(e.target.value)}>
            {ROLL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Attribute selector */}
        {rollType === 'attribute' && (
          <div className="field-group">
            <label className="field-label">Attribute</label>
            <select className="sel" value={attrKey} onChange={e => setAttrKey(e.target.value)}>
              {ATTRS.map(a => <option key={a} value={a}>{ATTR_LABELS[a]} ({attrs[a] ?? 0})</option>)}
            </select>
            {ATTRIBUTE_DESCRIPTIONS[attrKey] && (
              <div className="sess-skill-desc">{ATTRIBUTE_DESCRIPTIONS[attrKey]}</div>
            )}
          </div>
        )}

        {/* Skill / Weapon searchable picker */}
        {(rollType === 'skill' || rollType === 'attack') && (
          <div className="field-group sess-roll-config-full">
            <label className="field-label">{rollType === 'attack' ? 'Weapon Skill' : 'Skill'}</label>

            {skillKey && (
              <div className="sess-skill-selected">
                <span className="sess-skill-selected-name">{skillKey}</span>
                <span className="sess-skill-selected-rank">Rank {selectedRank}</span>
                <button className="sess-skill-clear" onClick={() => { setSkillKey(''); setTargetUserId(null); }}>Change</button>
              </div>
            )}
            {skillKey && selectedDesc && (
              <div className="sess-skill-desc">{selectedDesc}</div>
            )}

            {!skillKey && (
              <>
                <div className="sess-skill-search-wrap">
                  <input
                    className="ct-input"
                    placeholder="Search skills..."
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                  />
                  {skillSearch && (
                    <button className="sess-skill-search-clear" onClick={() => setSkillSearch('')}>&#x2715;</button>
                  )}
                </div>
                <div className="sess-skill-list">
                  {filteredSkills.length === 0 && (
                    <div className="sess-skill-empty">No skills match &ldquo;{skillSearch}&rdquo;</div>
                  )}
                  {filteredSkills.map(s => {
                    const sk = activeSkills.find(x => x.skill_name === s.skill_name);
                    const rank = sk?.rank ?? 0;
                    const desc = getSkillDesc(s.skill_name);
                    const isExpanded = expanded === s.skill_name;
                    const showDesc = isExpanded || descMatchedSet.has(s.skill_name);
                    return (
                      <div key={s.skill_name} className="sess-skill-item">
                        <div className="sess-skill-row" onClick={() => selectSkill(s.skill_name)}>
                          <span className="sess-skill-name">{s.skill_name}</span>
                          <span className="sess-skill-attr">{ATTR_LABELS[s.attribute]}</span>
                          <span className="sess-skill-rank-pip">{'●'.repeat(rank)}{'○'.repeat(5 - rank)}</span>
                          {desc && (
                            <button
                              className="sess-skill-info"
                              onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : s.skill_name); }}
                            >?</button>
                          )}
                        </div>
                        {showDesc && desc && (
                          <div className="sess-skill-desc">{desc}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TARGET SELECTOR (Attack only, after skill selected) ── */}
        {rollType === 'attack' && skillKey && otherMembers.length > 0 && (
          <div className="field-group sess-roll-config-full">
            <label className="field-label">Target</label>
            <div className="sess-target-list">
              {otherMembers.map(m => (
                <div
                  key={m.user_id}
                  className={`sess-target-option${targetUserId === m.user_id ? ' selected' : ''}`}
                  onClick={() => { setTargetUserId(m.user_id); setDefenseType('Dodge'); }}
                >
                  {m.image_url ? (
                    <img className="sess-target-avatar" src={`${API_BASE}${m.image_url}`} alt="" />
                  ) : (
                    <div className="sess-target-avatar-ph">{(m.character_name || '?')[0]}</div>
                  )}
                  <span className="sess-target-name">{m.character_name || 'Unknown'}</span>
                  <span className="sess-target-hp">
                    {m.current_hp ?? '?'} HP
                  </span>
                </div>
              ))}
            </div>

            {/* Optional: skip targeting for non-targeted attack */}
            {targetUserId && (
              <button
                className="sess-skill-clear"
                style={{ marginTop: 4, fontSize: '0.58rem' }}
                onClick={() => setTargetUserId(null)}
              >
                Use manual DC instead
              </button>
            )}
          </div>
        )}

        {/* ── ATTACK INFO (when target selected) ── */}
        {isTargetedAttack && (
          <div className="field-group sess-roll-config-full">
            <div className="sess-target-info">
              <span className="sess-target-info-line">
                Target: <strong>{targetMember?.character_name}</strong> — {targetMember?.character_name} will choose their defense
              </span>
              {skillKey === 'Lightsabers' && (
                <span className="sess-target-info-line highlight">Lightsabers bypass soak</span>
              )}
              {skillKey === 'Slugthrowers' && (
                <span className="sess-target-info-line highlight">Cannot be deflected by lightsaber parry</span>
              )}
              <span className="sess-target-info-line">
                Armor: {targetArmor.charAt(0).toUpperCase() + targetArmor.slice(1)}
                {targetArmorInfo.soak > 0 ? ` (${targetArmorInfo.soak} soak)` : ' (no soak)'}
              </span>
            </div>
          </div>
        )}

        {/* Saving throw */}
        {rollType === 'saving_throw' && (
          <div className="field-group">
            <label className="field-label">Save</label>
            <select className="sel" value={saveKey} onChange={e => setSaveKey(e.target.value)}>
              {SAVING_THROWS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        )}

        {/* Difficulty (hidden for targeted attacks) */}
        {!isTargetedAttack && (
          <div className="field-group">
            <label className="field-label">Difficulty</label>
            <select className="sel" value={dcOption} onChange={e => setDcOption(Number(e.target.value))}>
              {DC_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        )}

        {!isTargetedAttack && dcOption === -1 && (
          <div className="field-group">
            <label className="field-label">Custom DC</label>
            <input
              className="ct-input" type="number" min={2} max={40}
              value={customDc} onChange={e => setCustomDc(Number(e.target.value))}
            />
          </div>
        )}
      </div>

      {/* Bonus preview */}
      {(skillKey || rollType === 'attribute' || rollType === 'saving_throw') && (
        <div className="sess-roll-preview">
          {(() => {
            const bonus = getRollBonus({ rollType, attrKey, saveKey, attrs, skills: activeSkills, skillKey: skillKey || undefined });
            return (
              <span>
                2d10 + <strong>{bonus.total}</strong>
                <span className="sess-roll-preview-detail">
                  {' '}({bonus.label}{bonus.skillRank ? ` — Attr +${bonus.attrMod}, Rank +${bonus.skillRank}` : ` +${bonus.attrMod}`})
                </span>
                {isTargetedAttack
                  ? <> vs <strong>{targetMember?.character_name}</strong> (defense TBD)</>
                  : <> vs DC {dc}</>
                }
              </span>
            );
          })()}
        </div>
      )}

      <div className="sess-roll-actions">
        <button className="ct-action-btn" onClick={onClose}>Cancel</button>
        <button className="ct-action-btn green" onClick={handleRoll}>
          {isTargetedAttack ? 'Declare Attack' : 'Roll 2d10'}
        </button>
      </div>
    </div>
  );
}
