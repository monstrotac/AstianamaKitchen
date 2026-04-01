import { useState, useMemo } from 'react';
import { useSanctum } from '../../contexts/SanctumContext';
import { computeCombatAbility, ARMOR_TYPES } from '../../utils/rollUtils';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function DefensePrompt({ attack, combatAbilities, socket, myConditions = [], onDefend }) {
  const { activeChar, activeSkills } = useSanctum();
  const [defenseType, setDefenseType] = useState('Dodge');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const attrs = activeChar || {};
  const armor = activeChar?.armor || 'unarmored';
  const armorInfo = ARMOR_TYPES.find(a => a.name.toLowerCase() === armor) || ARMOR_TYPES[0];

  const isGrappled = myConditions.includes('grappled');
  const isDisarmed = myConditions.includes('disarmed');

  const defenses = useMemo(() => {
    const defCAs = (combatAbilities || []).filter(ca => ca.type === 'defense');
    return defCAs.map(ca => {
      const formula = {
        attribute_key: ca.attribute_key,
        skill_name: ca.skill_name,
        skill_multiplier: ca.skill_multiplier ?? 2,
        base_value: ca.base_value,
        minimum_value: ca.minimum_value,
      };
      let bonus = computeCombatAbility(formula, attrs, activeSkills || []);
      if (ca.name === 'Dodge') bonus += armorInfo.dodgePenalty || 0;

      // Condition-based disabling
      let disabled = false;
      let disabledReason = '';

      if (ca.name === 'Lightsaber Parry' && attack.attackSkill === 'Slugthrowers') {
        disabled = true;
        disabledReason = 'Cannot deflect slugthrowers';
      }
      if (ca.name === 'Dodge' && isGrappled) {
        disabled = true;
        disabledReason = 'Cannot Dodge while Grappled';
      }
      if (['Lightsaber Parry', 'Melee Parry'].includes(ca.name) && isDisarmed) {
        disabled = true;
        disabledReason = 'Cannot parry while Disarmed';
      }

      return { name: ca.name, dc: 10 + bonus, bonus, disabled, disabledReason };
    });
  }, [combatAbilities, attrs, activeSkills, armorInfo, attack.attackSkill, isGrappled, isDisarmed]);

  // Auto-select first non-disabled defense
  useMemo(() => {
    const current = defenses.find(d => d.name === defenseType);
    if (current?.disabled) {
      const first = defenses.find(d => !d.disabled);
      if (first) setDefenseType(first.name);
    }
  }, [defenses]);

  function handleDefend(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!socket || !socket.connected) {
      setError('Not connected to server — try refreshing the page.');
      console.error('[DefensePrompt] Socket not connected!', { socket: !!socket, connected: socket?.connected });
      return;
    }
    if (sent) return;
    setSent(true);
    setError('');
    console.log('[DefensePrompt] Emitting defense-choose', { attackId: attack.attackId, defenseType, socketId: socket.id });
    socket.emit('session:defense-choose', {
      attackId: attack.attackId,
      defenseType,
    }, (ack) => {
      // If server supports ack, great. If not, this is harmless.
      console.log('[DefensePrompt] Server ack:', ack);
    });
    // Give the server a moment to respond before clearing
    setTimeout(() => onDefend?.(), 500);
  }

  return (
    <div className="sess-defense-prompt">
      <div className="sess-defense-prompt-header">
        <div className="sess-defense-prompt-icon">!</div>
        <div>
          <div className="sess-defense-prompt-title">Incoming Attack</div>
          <div className="sess-defense-prompt-attacker">
            {attack.attackerImage && (
              <img className="sess-target-avatar" src={`${API_BASE}${attack.attackerImage}`} alt="" />
            )}
            <strong>{attack.attackerName}</strong> attacks you with <strong>{attack.attackSkill}</strong>
          </div>
        </div>
      </div>

      {myConditions.length > 0 && (
        <div className="sess-defense-prompt-conditions">
          Active conditions: {myConditions.map(c => c.replace(/_/g, ' ')).join(', ')}
        </div>
      )}

      <div className="sess-defense-prompt-label">Choose your defense:</div>
      <div className="sess-defense-picker">
        {defenses.map(d => (
          <label
            key={d.name}
            className={`sess-defense-option${defenseType === d.name ? ' active' : ''}${d.disabled ? ' disabled' : ''}`}
          >
            <input
              type="radio"
              name="defense-prompt"
              value={d.name}
              checked={defenseType === d.name}
              disabled={d.disabled}
              onChange={() => setDefenseType(d.name)}
            />
            <span className="sess-defense-name">{d.name}</span>
            <span className="sess-defense-dc">DC {d.dc}</span>
            {d.disabled && <span className="sess-defense-note">{d.disabledReason}</span>}
          </label>
        ))}
      </div>

      {error && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</div>}
      <div className="sess-defense-prompt-actions">
        <button type="button" className="ct-action-btn green" onClick={handleDefend} disabled={sent}>
          {sent ? 'Defending…' : 'Defend'}
        </button>
      </div>
    </div>
  );
}
