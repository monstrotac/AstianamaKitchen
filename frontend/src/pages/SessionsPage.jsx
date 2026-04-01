import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listSessions, createSession, joinSession, leaveSession, deleteSession, getSession } from '../api/sessions';
import { useSocket } from '../hooks/useSocket';
import CharacterSelectModal from '../components/sessions/CharacterSelectModal';
import SessionRoom from '../components/sessions/SessionRoom';
import '../styles/sessions.css';

export default function SessionsPage() {
  const { user, isAdmin } = useAuth();
  const { socket, isConnected, connect, disconnect } = useSocket();

  const [sessions, setSessions]       = useState([]);
  const [newName, setNewName]         = useState('');
  const [creating, setCreating]       = useState(false);
  const [loading, setLoading]         = useState(true);

  // Joining flow
  const [pickingFor, setPickingFor]   = useState(null);   // session id being joined
  // Active room
  const [activeSession, setActiveSession] = useState(null); // { id, name }

  const load = useCallback(async () => {
    try {
      const data = await listSessions();
      setSessions(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Connect socket when entering a room, disconnect when leaving
  useEffect(() => {
    if (activeSession && !isConnected) connect();
    if (!activeSession && isConnected) disconnect();
  }, [activeSession, isConnected, connect, disconnect]);

  async function handleCreate() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      await createSession(newName.trim());
      setNewName('');
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  }

  function handleCreateKeyDown(e) {
    if (e.key === 'Enter') handleCreate();
  }

  function startJoin(sessionId) {
    setPickingFor(sessionId);
  }

  async function confirmJoin(characterId) {
    if (!pickingFor) return;
    try {
      await joinSession(pickingFor, characterId);
      // Fetch session details for the room name
      const sess = sessions.find(s => s.id === pickingFor);
      setActiveSession({ id: pickingFor, name: sess?.name || 'Session', createdBy: sess?.created_by });
    } catch (err) {
      if (err.response?.status === 409) {
        // Already a member — just enter
        const sess = sessions.find(s => s.id === pickingFor);
        setActiveSession({ id: pickingFor, name: sess?.name || 'Session', createdBy: sess?.created_by });
      }
    }
    setPickingFor(null);
  }

  async function handleEnter(session) {
    setActiveSession({ id: session.id, name: session.name, createdBy: session.created_by });
  }

  async function handleLeave() {
    if (activeSession) {
      try { await leaveSession(activeSession.id); } catch { /* ignore */ }
      setActiveSession(null);
      load();
    }
  }

  async function handleDelete(id) {
    try {
      await deleteSession(id);
      load();
    } catch { /* ignore */ }
  }

  // Check if user is a member of a session (we'll do a simple membership check via the API)
  const [myMemberships, setMyMemberships] = useState(new Set());
  useEffect(() => {
    async function checkMemberships() {
      const membered = new Set();
      for (const s of sessions) {
        try {
          const detail = await getSession(s.id);
          if (detail.members?.some(m => m.user_id === user?.id)) {
            membered.add(s.id);
          }
        } catch { /* ignore */ }
      }
      setMyMemberships(membered);
    }
    if (sessions.length > 0 && user?.id) checkMemberships();
  }, [sessions, user?.id]);

  // If in a room, show the room
  if (activeSession) {
    return (
      <SessionRoom
        socket={socket}
        sessionId={activeSession.id}
        sessionName={activeSession.name}
        creatorId={activeSession.createdBy}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-title">Rolling Sessions</div>
        <div className="comm-status">
          <div className="dot" />
          <span>REAL-TIME ROLEPLAY ROOMS — SELECT A CHARACTER, CHAT AND ROLL TOGETHER</span>
        </div>
        <div className="energy-line" />

        {/* Create */}
        <div className="sess-create">
          <input
            className="ct-input"
            placeholder="New session name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            maxLength={80}
          />
          <button className="ct-add-btn" onClick={handleCreate} disabled={creating || !newName.trim()}>
            Create
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="sess-empty">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="sess-empty">NO ACTIVE SESSIONS — CREATE ONE TO BEGIN</div>
        ) : (
          <div className="sess-list">
            {sessions.map(s => {
              const isMember = myMemberships.has(s.id);
              const isCreator = s.created_by === user?.id;
              return (
                <div key={s.id} className="sess-card">
                  <div className="sess-card-info">
                    <div className="sess-card-name">{s.name}</div>
                    <div className="sess-card-meta">
                      Created by {s.creator_name} — {s.member_count} member{s.member_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="sess-card-actions">
                    {isMember ? (
                      <button className="ct-action-btn green" onClick={() => handleEnter(s)}>
                        Enter
                      </button>
                    ) : (
                      <button className="ct-action-btn green" onClick={() => startJoin(s.id)}>
                        Join
                      </button>
                    )}
                    {(isCreator || isAdmin) && (
                      <button className="ct-action-btn danger" onClick={() => handleDelete(s.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Character picker modal */}
      {pickingFor && (
        <CharacterSelectModal
          onSelect={confirmJoin}
          onClose={() => setPickingFor(null)}
        />
      )}
    </div>
  );
}
