import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SessionMessageList from './SessionMessageList';
import RollPanel from './RollPanel';
import DefensePrompt from './DefensePrompt';
import CombatStatsPanel from './CombatStatsPanel';
import ActionsPanel from './ActionsPanel';
import CombatRulesModal from '../sanctum/CombatRulesModal';
import { getCombatAbilities } from '../../api/sanctum';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function SessionRoom({ socket, sessionName, sessionId, creatorId, onLeave }) {
  const { user } = useAuth();
  const [messages, setMessages]             = useState([]);
  const [members, setMembers]               = useState([]);
  const [chatText, setChatText]             = useState('');
  const [showRollPanel, setShowRollPanel]   = useState(false);
  const [showCombatStats, setShowCombatStats] = useState(false);
  const [showCombatRules, setShowCombatRules] = useState(false);
  const [showActionsPanel, setShowActionsPanel] = useState(false);
  const [combatAbilities, setCombatAbilities] = useState([]);
  const [pendingDefense, setPendingDefense] = useState(null); // attack awaiting my defense choice
  const messagesRef = useRef(null);
  const autoScroll  = useRef(true);

  // Fetch combat ability definitions once
  useEffect(() => {
    getCombatAbilities().then(setCombatAbilities).catch(() => {});
  }, []);

  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    autoScroll.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  function scrollToBottom() {
    if (autoScroll.current && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    if (!socket) return;

    // Join (or re-join after reconnect)
    socket.emit('session:join', { sessionId });

    function onReconnect() {
      console.log('[Session] Reconnected — re-joining room');
      socket.emit('session:join', { sessionId });
    }

    socket.on('connect', onReconnect);

    function onHistory(msgs) {
      setMessages(msgs);
      setTimeout(scrollToBottom, 50);
    }
    function onMembers(m) { setMembers(m); }
    function onMessage(msg) {
      setMessages(prev => [...prev, msg]);
      setTimeout(scrollToBottom, 50);
    }
    function onUserJoined({ character_name }) {
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        msg_type: 'system',
        content: `${character_name} joined the session`,
        created_at: new Date().toISOString(),
      }]);
    }
    function onUserLeft({ username }) {
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        msg_type: 'system',
        content: `${username} left the session`,
        created_at: new Date().toISOString(),
      }]);
    }
    function onHpUpdate({ targetUserId, newHp }) {
      setMembers(prev => prev.map(m =>
        m.user_id === targetUserId ? { ...m, current_hp: newHp } : m
      ));
    }
    function onDefensePrompt(attack) {
      // Only show the prompt if I'm the target
      if (attack.targetUserId === user?.id) {
        setPendingDefense(attack);
      }
    }
    function onDefenseResolved({ attackId }) {
      setPendingDefense(prev => prev?.attackId === attackId ? null : prev);
    }
    function onConditionsUpdate({ targetUserId, conditions }) {
      setMembers(prev => prev.map(m =>
        m.user_id === targetUserId ? { ...m, conditions } : m
      ));
    }

    function onError({ message }) {
      console.error('[Session:error]', message);
    }

    socket.on('session:history', onHistory);
    socket.on('session:members', onMembers);
    socket.on('session:message', onMessage);
    socket.on('session:user-joined', onUserJoined);
    socket.on('session:user-left', onUserLeft);
    socket.on('session:hp-update', onHpUpdate);
    socket.on('session:defense-prompt', onDefensePrompt);
    socket.on('session:defense-resolved', onDefenseResolved);
    socket.on('session:conditions-update', onConditionsUpdate);
    socket.on('session:error', onError);

    return () => {
      socket.emit('session:leave', { sessionId });
      socket.off('connect', onReconnect);
      socket.off('session:history', onHistory);
      socket.off('session:members', onMembers);
      socket.off('session:message', onMessage);
      socket.off('session:user-joined', onUserJoined);
      socket.off('session:user-left', onUserLeft);
      socket.off('session:hp-update', onHpUpdate);
      socket.off('session:defense-prompt', onDefensePrompt);
      socket.off('session:defense-resolved', onDefenseResolved);
      socket.off('session:conditions-update', onConditionsUpdate);
      socket.off('session:error', onError);
    };
  }, [socket, sessionId, user?.id]);

  function sendChat() {
    if (!chatText.trim() || !socket) return;
    socket.emit('session:chat', { sessionId, content: chatText.trim() });
    setChatText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  }

  // Non-targeted roll (skill checks, saves, manual DC attacks)
  function handleRoll({ modifier, dc, isCombat, skillLabel, rollType }) {
    if (!socket) return;
    socket.emit('session:roll', { sessionId, modifier, dc, isCombat, skillLabel, rollType });
    setShowRollPanel(false);
  }

  // Targeted attack declaration — defender will be prompted to pick their defense
  function handleAttackDeclare({ modifier, skillLabel, attackSkill, targetUserId }) {
    if (!socket) return;
    socket.emit('session:attack-declare', {
      sessionId, modifier, skillLabel, attackSkill, targetUserId,
    });
    setShowRollPanel(false);
  }

  return (
    <div className="panel">
      <div className="sess-room">
        {/* Header */}
        <div className="sess-room-header">
          <div className="sess-room-title">{sessionName}</div>
          <div className="sess-room-members">
            {members.slice(0, 5).map(m => (
              m.image_url ? (
                <img key={m.user_id} className="sess-room-member-pip" src={`${API_BASE}${m.image_url}`} alt={m.character_name} title={m.character_name} />
              ) : (
                <div key={m.user_id} className="sess-room-member-pip-placeholder" title={m.character_name}>
                  {(m.character_name || '?')[0]}
                </div>
              )
            ))}
            <span className="sess-room-member-count">{members.length}</span>
          </div>
          <div className="sess-room-toolbar">
            <button
              className={`ct-action-btn${showCombatStats ? ' active' : ''}`}
              onClick={() => setShowCombatStats(!showCombatStats)}
            >
              Stats
            </button>
            <button className="ct-action-btn" onClick={() => setShowCombatRules(true)}>
              Rules
            </button>
            <button className="ct-action-btn danger" onClick={onLeave}>Leave</button>
          </div>
        </div>

        {/* Defense Prompt (shown to the target of an attack) */}
        {pendingDefense && (
          <DefensePrompt
            attack={pendingDefense}
            combatAbilities={combatAbilities}
            socket={socket}
            myConditions={members.find(m => m.user_id === user?.id)?.conditions || []}
            onDefend={() => setPendingDefense(null)}
          />
        )}

        {/* Main body: messages + optional sidebar */}
        <div className="sess-room-body">
          <SessionMessageList
            ref={messagesRef}
            messages={messages}
            onScroll={handleScroll}
          />

          {showCombatStats && (
            <CombatStatsPanel
              members={members}
              combatAbilities={combatAbilities}
              socket={socket}
              sessionId={sessionId}
              currentUserId={user?.id}
              creatorId={creatorId}
            />
          )}
        </div>

        {/* Roll Panel */}
        {showRollPanel && (
          <RollPanel
            onRoll={handleRoll}
            onAttackDeclare={handleAttackDeclare}
            onClose={() => { setShowRollPanel(false); }}
            members={members}
          />
        )}

        {/* Actions Panel */}
        {showActionsPanel && (
          <ActionsPanel
            onClose={() => setShowActionsPanel(false)}
            members={members}
            socket={socket}
            sessionId={sessionId}
          />
        )}

        {/* Input */}
        <div className="sess-input-bar">
          <input
            className="ct-input"
            placeholder="Type a message..."
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="ct-action-btn" onClick={() => { setShowRollPanel(!showRollPanel); setShowActionsPanel(false); }}>
            Roll
          </button>
          <button className="ct-action-btn" onClick={() => { setShowActionsPanel(!showActionsPanel); setShowRollPanel(false); }}>
            Actions
          </button>
          <button className="ct-action-btn green" onClick={sendChat}>
            Send
          </button>
        </div>
      </div>

      {/* Combat Rules Modal */}
      {showCombatRules && <CombatRulesModal onClose={() => setShowCombatRules(false)} />}
    </div>
  );
}
