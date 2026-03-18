import { Link } from 'react-router-dom';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TrialCard({ trial, canEdit }) {
  const isDraft = trial.is_published === false;
  return (
    <div style={{ position: 'relative' }}>
      <Link
        to={isDraft ? `/trials/${trial.id}/edit` : `/trials/${trial.id}`}
        className="s-trial-card"
        data-status={trial.status}
        style={isDraft ? { opacity: 0.7, borderStyle: 'dashed' } : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="s-trial-title">{trial.title || <em style={{ opacity: 0.4 }}>Untitled</em>}</div>
            {isDraft && <span className="draft-badge draft">Draft</span>}
          </div>
          <span className={`s-trial-status ${trial.status}`}>{trial.status}</span>
        </div>
        <div className="s-trial-meta">
          {trial.assigned_to_name && <span>Assigned to: {trial.assigned_to_name}</span>}
          {trial.assigned_by_name && <span>By: {trial.assigned_by_name}</span>}
          <span>{formatDate(trial.created_at)}</span>
          {trial.visibility !== 'public' && (
            <span className="s-visibility-chip">{trial.visibility}</span>
          )}
          {trial.isLocked && <span className="s-visibility-chip">🔒 restricted</span>}
        </div>
        {!trial.isLocked && trial.description && (
          <div style={{ fontSize: '0.75rem', color: 'var(--dim)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            {trial.description.length > 120 ? trial.description.slice(0, 120) + '…' : trial.description}
          </div>
        )}
      </Link>
      {!isDraft && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: '0.4rem' }}>
          {canEdit && (
            <Link
              to={`/trials/${trial.id}/edit`}
              className="s-btn small"
              style={{ fontSize: '0.65rem' }}
              onClick={e => e.stopPropagation()}
            >
              ✎ Edit
            </Link>
          )}
          <Link
            to={`/trials/${trial.id}`}
            className="s-btn small"
            style={{ fontSize: '0.65rem' }}
            onClick={e => e.stopPropagation()}
          >
            View →
          </Link>
        </div>
      )}
    </div>
  );
}
