import { useAuth } from '../../contexts/AuthContext';
import { deleteEvent } from '../../api/sanctum';

function LockIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function EventCard({ event, onDeleted }) {
  const { user, isSolstice, isAdmin } = useAuth();
  const canDelete = isSolstice || isAdmin || event.author_id === user?.id;

  async function handleDelete() {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(event.id);
    onDeleted?.();
  }

  if (event.isLocked) {
    return (
      <div className="s-event-card s-event-locked">
        <div className="s-event-title">{event.title}</div>
        <div className="s-lock-overlay">
          <LockIcon />
          <span>Restricted Access</span>
        </div>
      </div>
    );
  }

  return (
    <div className="s-event-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="s-event-title">{event.title}</div>
        {canDelete && (
          <button className="s-btn small danger" onClick={handleDelete} style={{ marginLeft: '1rem' }}>✕</button>
        )}
      </div>
      <div className="s-event-body">{event.body}</div>
      <div className="s-event-meta">
        {event.author_name && <span>{event.author_name}</span>}
        <span>{formatDate(event.created_at)}</span>
        {event.visibility !== 'public' && (
          <span className="s-visibility-chip">{event.visibility}</span>
        )}
      </div>
    </div>
  );
}
