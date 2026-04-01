import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSanctum } from '../../contexts/SanctumContext';
import { FORCE_POWERS } from '../../data/conditions';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function ActionsPanel({ onClose, members, socket, sessionId }) {
  const { user } = useAuth();
  const { activeChar } = useSanctum();
  const [selectedId, setSelectedId] = useState(null);
  const [targetUserId, setTargetUserId] = useState(null);

  const otherMembers = members.filter(m => m.user_id !== user?.id);
  const selected = FORCE_POWERS.find(p => p.id === selectedId);
  const needsTarget = selected?.targetType === 'other';

  function handleUse() {
    if (!socket || !selected) return;

    const payload = { sessionId, actionId: selected.id };

    if (needsTarget) {
      if (!targetUserId) return;
      payload.targetUserId = targetUserId;
    }

    // For Force Push and Force Healing, send wit as modifier
    if (selected.id === 'force_push' || selected.id === 'force_healing') {
      payload.modifier = activeChar?.wit ?? 1;
    }

    socket.emit('session:use-action', payload);
    onClose();
  }

  function selectPower(id) {
    setSelectedId(selectedId === id ? null : id);
    setTargetUserId(null);
  }

  return (
    <div className="sess-roll-panel">
      <div className="sess-roll-panel-title">Force Powers</div>

      <div className="sess-actions-grid">
        {FORCE_POWERS.map(p => {
          const isSelected = selectedId === p.id;
          return (
            <div key={p.id}>
              <div
                className={`sess-action-card${isSelected ? ' selected' : ''}`}
                onClick={() => selectPower(p.id)}
              >
                <div className="sess-action-card-top">
                  <span className="sess-action-name">{p.name}</span>
                  <div className="sess-action-badges">
                    <span className={`sess-action-type ${p.actionType.toLowerCase()}`}>
                      {p.actionType}
                    </span>
                    <span className="sess-action-cost">{p.fpCost} FP</span>
                  </div>
                </div>
                <div className="sess-action-desc">{p.description}</div>
              </div>

              {/* Target picker (inline below selected card) */}
              {isSelected && needsTarget && (
                <div className="sess-action-target">
                  <div className="field-label" style={{ margin: '8px 0 4px' }}>Target</div>
                  <div className="sess-target-list">
                    {otherMembers.length === 0 && (
                      <div className="sess-skill-empty">No other members to target</div>
                    )}
                    {otherMembers.map(m => (
                      <div
                        key={m.user_id}
                        className={`sess-target-option${targetUserId === m.user_id ? ' selected' : ''}`}
                        onClick={() => setTargetUserId(m.user_id)}
                      >
                        {m.image_url ? (
                          <img className="sess-target-avatar" src={`${API_BASE}${m.image_url}`} alt="" />
                        ) : (
                          <div className="sess-target-avatar-ph">{(m.character_name || '?')[0]}</div>
                        )}
                        <span className="sess-target-name">{m.character_name || 'Unknown'}</span>
                        <span className="sess-target-hp">{m.current_hp ?? '?'} HP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sess-roll-actions">
        <button className="ct-action-btn" onClick={onClose}>Cancel</button>
        <button
          className="ct-action-btn green"
          disabled={!selected || (needsTarget && !targetUserId)}
          onClick={handleUse}
          style={(!selected || (needsTarget && !targetUserId)) ? { opacity: 0.4, cursor: 'default' } : {}}
        >
          Use Power
        </button>
      </div>
    </div>
  );
}
