import { useState } from 'react';
import { computeCombatAbility, computeHealth, ARMOR_TYPES, ATTR_LABELS } from '../../utils/rollUtils';
import { CONDITIONS } from '../../data/conditions';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
const modStr = v => (v >= 0 ? `+${v}` : `${v}`);

function hpColor(current, max) {
  if (max <= 0) return 'high';
  const ratio = current / max;
  if (ratio > 0.5) return 'high';
  if (ratio > 0.25) return 'mid';
  return 'low';
}

function MemberCard({ member, combatAbilities, socket, sessionId, isOwner, isCreator }) {
  // Creator can manage any member's stats; owners can manage their own
  const canManage = isOwner || isCreator;
  const [expanded, setExpanded] = useState(false);
  const [customHp, setCustomHp] = useState('');

  const attrs = {
    str: member.str ?? 0, dex: member.dex ?? 0, sta: member.sta ?? 0,
    cha: member.cha ?? 0, man: member.man ?? 0, app: member.app ?? 0,
    per: member.per ?? 0, int_score: member.int_score ?? 0, wit: member.wit ?? 0,
  };
  const skills = member.skills || [];
  const armor = member.armor || 'unarmored';
  const armorInfo = ARMOR_TYPES.find(a => a.name.toLowerCase() === armor) || ARMOR_TYPES[0];
  const maxHp = computeHealth(attrs, skills);
  const currentHp = member.current_hp ?? maxHp;
  const activeConditions = member.conditions || [];

  const attacks = (combatAbilities || []).filter(ca => ca.type === 'attack');
  const defenses = (combatAbilities || []).filter(ca => ca.type === 'defense');

  function changeHp(delta) {
    if (!socket) return;
    socket.emit('session:update-hp', { sessionId, targetUserId: member.user_id, hpChange: delta });
  }

  function applyCustomHp() {
    const val = parseInt(customHp);
    if (!val || !socket) return;
    socket.emit('session:update-hp', { sessionId, targetUserId: member.user_id, hpChange: val });
    setCustomHp('');
  }

  function addCondition(conditionId) {
    if (!socket) return;
    socket.emit('session:add-condition', { sessionId, conditionId, targetUserId: member.user_id });
  }

  function removeCondition(conditionId) {
    if (!socket) return;
    socket.emit('session:remove-condition', { sessionId, conditionId, targetUserId: member.user_id });
  }

  const availableConditions = CONDITIONS.filter(
    c => !c.autoApply && !activeConditions.includes(c.id)
  );

  return (
    <div className="sess-combat-member">
      <div className="sess-combat-member-header" onClick={() => setExpanded(!expanded)}>
        <div className="sess-combat-member-identity">
          {member.image_url ? (
            <img className="sess-combat-member-avatar" src={`${API_BASE}${member.image_url}`} alt="" />
          ) : (
            <div className="sess-combat-member-avatar-ph">
              {(member.character_name || '?')[0]}
            </div>
          )}
          <div className="sess-combat-member-name">{member.character_name || 'Unknown'}</div>
          <span className="sess-combat-expand">{expanded ? '\u25B4' : '\u25BE'}</span>
        </div>

        <div className="sess-combat-hp-row">
          <div className="sess-combat-hp-bar">
            <div
              className={`sess-combat-hp-fill ${hpColor(currentHp, maxHp)}`}
              style={{ width: `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%` }}
            />
          </div>
          <span className="sess-combat-hp-text">{currentHp}/{maxHp} HP</span>
        </div>

        {activeConditions.length > 0 && (
          <div className="sess-combat-conditions">
            {activeConditions.map(cid => {
              const cond = CONDITIONS.find(c => c.id === cid);
              if (!cond) return null;
              return (
                <span key={cid} className={`sess-condition-badge ${cid}`} title={cond.description}>
                  {cond.name}
                  {canManage && (
                    <button
                      className="sess-condition-remove"
                      onClick={e => { e.stopPropagation(); removeCondition(cid); }}
                    >&times;</button>
                  )}
                </span>
              );
            })}
          </div>
        )}

        <div className="sess-combat-armor-line">
          {armor.charAt(0).toUpperCase() + armor.slice(1)}
          {armorInfo.soak > 0 ? ` (${armorInfo.soak} soak)` : ''}
        </div>
      </div>

      {expanded && (
        <div className="sess-combat-detail">
          <div className="sess-combat-hp-controls">
            <button className="sess-hp-btn danger" onClick={() => changeHp(-1)}>-1</button>
            <button className="sess-hp-btn green" onClick={() => changeHp(1)}>+1</button>
            <input
              className="sess-hp-input"
              type="number"
              placeholder="+/-"
              value={customHp}
              onChange={e => setCustomHp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyCustomHp()}
            />
            <button className="sess-hp-btn" onClick={applyCustomHp}>Apply</button>
          </div>

          {canManage && availableConditions.length > 0 && (
            <div className="sess-combat-stat-section">
              <div className="sess-combat-stat-title">Add Condition</div>
              <div className="sess-condition-picker">
                {availableConditions.map(c => (
                  <button
                    key={c.id}
                    className="sess-condition-add-btn"
                    onClick={() => addCondition(c.id)}
                    title={c.description}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {attacks.length > 0 && (
            <div className="sess-combat-stat-section">
              <div className="sess-combat-stat-title">Attacks</div>
              {attacks.map(ca => {
                const bonus = computeCombatAbility({
                  attribute_key: ca.attribute_key, skill_name: ca.skill_name,
                  skill_multiplier: ca.skill_multiplier ?? 2, base_value: ca.base_value, minimum_value: ca.minimum_value,
                }, attrs, skills);
                return (
                  <div key={ca.id} className="sess-combat-stat-row">
                    <span className="sess-combat-stat-name">{ca.name}</span>
                    <span className="sess-combat-stat-value">{modStr(bonus)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {defenses.length > 0 && (
            <div className="sess-combat-stat-section">
              <div className="sess-combat-stat-title">Defenses</div>
              {defenses.map(ca => {
                let bonus = computeCombatAbility({
                  attribute_key: ca.attribute_key, skill_name: ca.skill_name,
                  skill_multiplier: ca.skill_multiplier ?? 2, base_value: ca.base_value, minimum_value: ca.minimum_value,
                }, attrs, skills);
                if (ca.name === 'Dodge') bonus += armorInfo.dodgePenalty || 0;
                return (
                  <div key={ca.id} className="sess-combat-stat-row">
                    <span className="sess-combat-stat-name">{ca.name}</span>
                    <span className="sess-combat-stat-value">DC {10 + bonus}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="sess-combat-stat-section">
            <div className="sess-combat-stat-title">Attributes</div>
            <div className="sess-combat-attrs-grid">
              {Object.entries(attrs).map(([key, val]) => (
                <span key={key} className="sess-combat-attr-pip">
                  {ATTR_LABELS[key]} {val}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CombatStatsPanel({ members, combatAbilities, socket, sessionId, currentUserId, creatorId }) {
  const isSessionCreator = currentUserId === creatorId;

  return (
    <div className="sess-combat-sidebar">
      <div className="sess-combat-sidebar-title">Combat Stats</div>
      {members.length === 0 && (
        <div className="sess-empty" style={{ padding: '16px 0' }}>No members</div>
      )}
      {members.map(m => (
        <MemberCard
          key={m.user_id}
          member={m}
          combatAbilities={combatAbilities}
          socket={socket}
          sessionId={sessionId}
          isOwner={m.user_id === currentUserId}
          isCreator={isSessionCreator}
        />
      ))}
    </div>
  );
}
