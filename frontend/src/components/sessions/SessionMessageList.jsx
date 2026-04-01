import { forwardRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const OUTCOME_LABELS = {
  success: 'SUCCESS',
  failure: 'FAILURE',
  crit_success: 'CRITICAL SUCCESS',
  crit_failure: 'CRITICAL FAILURE',
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
}

function ChatMessage({ msg }) {
  return (
    <div className="sess-msg">
      {msg.image_url ? (
        <img className="sess-msg-avatar" src={`${API_BASE}${msg.image_url}`} alt="" />
      ) : (
        <div className="sess-msg-avatar-placeholder">
          {(msg.character_name || '?')[0]}
        </div>
      )}
      <div className="sess-msg-body">
        <div className="sess-msg-header">
          <span className="sess-msg-name">{msg.character_name || 'Unknown'}</span>
          <span className="sess-msg-time">{formatTime(msg.created_at)}</span>
        </div>
        <div className="sess-msg-text">{msg.content}</div>
      </div>
    </div>
  );
}

function RollMessage({ msg }) {
  const r = msg.roll_data;
  if (!r) return null;

  return (
    <div className="sess-msg">
      {msg.image_url ? (
        <img className="sess-msg-avatar" src={`${API_BASE}${msg.image_url}`} alt="" />
      ) : (
        <div className="sess-msg-avatar-placeholder">
          {(msg.character_name || '?')[0]}
        </div>
      )}
      <div className="sess-msg-body">
        <div className="sess-msg-header">
          <span className="sess-msg-name">{msg.character_name || 'Unknown'}</span>
          <span className="sess-msg-time">{formatTime(msg.created_at)}</span>
        </div>
        <div className="sess-msg-roll">
          {/* Roll label + target */}
          <div className="sess-roll-label">
            {r.rollType === 'attack' && r.skillLabel ? `Attack — ${r.skillLabel}`
              : r.rollType === 'skill' && r.skillLabel && r.skillLabel !== 'Skill Check' ? `Skill Check — ${r.skillLabel}`
              : r.skillLabel || (r.rollType === 'attack' ? 'Attack' : r.rollType === 'saving_throw' ? 'Saving Throw' : r.rollType === 'attribute' ? 'Attribute Check' : 'Skill Check')}
          </div>

          {/* Targeted attack: show target */}
          {r.targeted && (
            <div className="sess-roll-target-line">
              <span className="sess-roll-target-arrow">{'\u2192'}</span>
              {r.targeted.targetImageUrl ? (
                <img className="sess-roll-target-avatar" src={`${API_BASE}${r.targeted.targetImageUrl}`} alt="" />
              ) : (
                <span className="sess-roll-target-avatar-ph">{(r.targeted.targetCharacterName || '?')[0]}</span>
              )}
              <span className="sess-roll-target-name">{r.targeted.targetCharacterName}</span>
              <span className="sess-roll-target-defense">({r.targeted.defenseType})</span>
            </div>
          )}

          <div className="sess-roll-dice">
            [{r.die1}] + [{r.die2}] + {r.modifier} = {r.total} vs {r.targeted ? `${r.targeted.defenseType} ` : ''}DC {r.dc}
          </div>
          <div className={`sess-roll-outcome ${r.outcome}`}>
            {OUTCOME_LABELS[r.outcome] || r.outcome}
            {r.margin != null && r.outcome !== 'crit_failure' ? ` (margin: ${r.margin})` : ''}
          </div>

          {/* Damage + soak for targeted attacks */}
          {r.targeted && r.damageTier && (r.outcome === 'success' || r.outcome === 'crit_success') && (
            <div className="sess-roll-soak-section">
              <div className="sess-roll-damage">
                {r.damageTier.label} Hit — {r.targeted.rawDamage} raw damage
              </div>
              <div className="sess-roll-soak-line">
                {r.targeted.critBypass
                  ? 'Critical Hit — armor bypassed'
                  : r.targeted.lightsaberBypass
                    ? 'Lightsaber — soak bypassed'
                    : `${r.targeted.armor?.charAt(0).toUpperCase()}${r.targeted.armor?.slice(1)} armor (${r.targeted.soak} soak)`}
                {' \u2192 '}<strong>{r.targeted.finalDamage} damage dealt</strong>
              </div>
            </div>
          )}

          {/* Non-targeted damage */}
          {!r.targeted && r.damageTier && (
            <div className="sess-roll-damage">
              {r.damageTier.label} Hit — {r.damageTier.damage} damage
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SystemMessage({ msg }) {
  return (
    <div className="sess-msg-system">
      {msg.content || 'System event'}
    </div>
  );
}

const SessionMessageList = forwardRef(function SessionMessageList({ messages, onScroll }, ref) {
  return (
    <div className="sess-messages" ref={ref} onScroll={onScroll}>
      {messages.length === 0 && (
        <div className="sess-empty">No messages yet. Say something or roll some dice.</div>
      )}
      {messages.map(msg => {
        if (msg.msg_type === 'system') return <SystemMessage key={msg.id} msg={msg} />;
        if (msg.msg_type === 'roll')   return <RollMessage key={msg.id} msg={msg} />;
        return <ChatMessage key={msg.id} msg={msg} />;
      })}
    </div>
  );
});

export default SessionMessageList;
