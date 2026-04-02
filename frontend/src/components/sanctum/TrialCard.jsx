import { Link } from 'react-router-dom';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TrialCard({ trial, canEdit }) {
  const isDraft = trial.is_published === false;
  return (
    <div className="s-trial-card-wrap">
      <Link
        to={isDraft ? `/trials/${trial.id}/edit` : `/trials/${trial.id}`}
        className="s-trial-card"
        data-status={trial.status}
        style={isDraft ? { opacity: 0.7, borderStyle: 'dashed' } : undefined}
      >
        <div className="s-trial-card-top">
          <div className="s-trial-title-row">
            <div className="s-trial-title">{trial.title || <em style={{ opacity: 0.4 }}>Untitled</em>}</div>
            {isDraft && <span className="draft-badge draft">Draft</span>}
          </div>
          <div className="s-trial-card-right">
            <span className={`s-trial-status ${trial.status}`}>{trial.status}</span>
            {!isDraft && (
              <div className="s-trial-card-actions" onClick={e => e.preventDefault()}>
                {canEdit && (
                  <Link to={`/trials/${trial.id}/edit`} className="s-btn small">
                    ✎ Edit
                  </Link>
                )}
                <Link to={`/trials/${trial.id}`} className="s-btn small">
                  View →
                </Link>
              </div>
            )}
          </div>
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
    </div>
  );
}
