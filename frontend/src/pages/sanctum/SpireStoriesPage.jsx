import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRecentStories, createStory } from '../../api/sanctum';
import { useAuth } from '../../contexts/AuthContext';
import { useSanctum } from '../../contexts/SanctumContext';
import { useTitle } from '../../hooks/useTitle';
import GuestBanner from '../../components/ui/GuestBanner';

const PAGE_SIZE = 10;

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="s-pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>← Prev</button>
      <span>{page} / {total}</span>
      <button disabled={page === total} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

function StoryCard({ story, userId }) {
  const preview = story.body?.length > 120 ? story.body.slice(0, 120) + '…' : story.body;
  const isOwn   = userId && story.user_id === userId;
  const isDraft = !story.is_published;
  const editUrl = `/characters/${story.character_id}/stories/${story.id}/edit`;

  return (
    <div className="s-story-card-v2" style={isDraft ? { opacity: 0.7, borderStyle: 'dashed' } : undefined}>
      <div className="s-story-card-header">
        <div className="s-story-card-title-row">
          <span className="s-story-card-title">
            {story.title || <em style={{ opacity: 0.4, fontFamily: 'inherit', fontStyle: 'italic' }}>Untitled</em>}
          </span>
          {isDraft && <span className="draft-badge draft">Draft</span>}
          {isOwn && <Link to={editUrl} className="s-btn small" style={{ flexShrink: 0 }}>Edit</Link>}
        </div>
        <div className="s-story-card-meta">
          <span className="s-story-date">{formatDate(story.created_at)}</span>
        </div>
      </div>
      <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text)', opacity: 0.75 }}>{preview}</div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-sub)',
      }}>
        <Link
          to={`/characters/${story.character_id}`}
          style={{ fontSize: '0.68rem', color: 'var(--dim)', textDecoration: 'none', letterSpacing: '0.05em' }}
        >
          View author →
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>
            {story.author_name || story.character_name || '—'}
          </span>
          <Link
            to={`/characters/${story.character_id}/stories/${story.id}`}
            className="s-btn small"
            style={{ fontSize: '0.6rem' }}
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SpireStoriesPage() {
  useTitle('Chronicles');
  const navigate = useNavigate();
  const { isMember, user } = useAuth();
  const { activeCharId } = useSanctum();

  const [stories, setStories]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    getRecentStories()
      .then(setStories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const myDrafts    = stories.filter(s => !s.is_published && s.user_id === user?.id);
  const published   = stories.filter(s => s.is_published);
  const totalPages  = Math.ceil(published.length / PAGE_SIZE) || 1;
  const paginated   = published.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleNewChronicle() {
    if (!activeCharId) {
      setCreateErr('Set an active character first (Profile → Set Active).');
      return;
    }
    setCreating(true);
    setCreateErr('');
    try {
      const story = await createStory(activeCharId, {});
      navigate(`/characters/${activeCharId}/stories/${story.id}/edit`);
    } catch (err) {
      setCreateErr(err.response?.data?.error || 'Failed to create chronicle.');
      setCreating(false);
    }
  }

  return (
    <div>
      <GuestBanner />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div className="s-section-title" style={{ margin: 0 }}>Chronicles</div>
        {isMember && (
          <button className="s-btn small" onClick={handleNewChronicle} disabled={creating}>
            {creating ? '…' : '+ New Chronicle'}
          </button>
        )}
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--dim)', marginBottom: createErr ? '0.75rem' : '2rem', letterSpacing: '0.06em' }}>
        Accounts from across the Sith Order — tales of power, ambition, and shadow.
      </div>
      {createErr && (
        <div style={{ fontSize: '0.75rem', color: '#e74c3c', marginBottom: '1.5rem' }}>{createErr}</div>
      )}

      {loading ? (
        <div className="s-empty">Loading…</div>
      ) : (
        <>
          {myDrafts.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--dim)', letterSpacing: '0.12em', fontFamily: "'Share Tech Mono',monospace", marginBottom: '0.5rem' }}>
                YOUR DRAFTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myDrafts.map(s => <StoryCard key={s.id} story={s} userId={user?.id} />)}
              </div>
            </div>
          )}
          {published.length === 0 ? (
            <div className="s-empty">No chronicles recorded yet.</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {paginated.map(s => <StoryCard key={s.id} story={s} userId={user?.id} />)}
              </div>
              <Pagination page={page} total={totalPages} onChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}
