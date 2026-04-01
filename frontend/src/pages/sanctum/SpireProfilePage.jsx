import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSanctum } from '../../contexts/SanctumContext';
import { createCharacter } from '../../api/sanctum';
import { useTitle } from '../../hooks/useTitle';
import RankBadge from '../../components/sanctum/RankBadge';
import GuestBanner from '../../components/ui/GuestBanner';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');

const SilhouetteSVG = () => (
  <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <ellipse cx="50" cy="35" rx="20" ry="22" fill="currentColor" opacity="0.15" />
    <path d="M20 140 Q20 80 50 75 Q80 80 80 140Z" fill="currentColor" opacity="0.15" />
  </svg>
);

export default function SpireProfilePage() {
  useTitle('Profile');
  const { user, isMember } = useAuth();
  const { myChars, activeCharId, loadMyChars, switchActiveChar } = useSanctum();

  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');

  async function handleCreate() {
    setCreating(true);
    setCreateError('');
    try {
      await createCharacter({});
      await loadMyChars();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create character');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <GuestBanner />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="s-section-title" style={{ margin: 0 }}>My Characters</div>
        {isMember && (
          <button className="s-btn small" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating\u2026' : '+ New Character'}
          </button>
        )}
      </div>

      {createError && <div className="s-error" style={{ marginBottom: '1rem' }}>{createError}</div>}

      {myChars.length === 0 ? (
        <div className="s-panel" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {isMember
              ? 'You do not yet have a Sanctum character. Create one to join the Order.'
              : 'Your account is pending approval. Once approved, you can create a character.'}
          </p>
          {isMember && (
            <button className="s-btn" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating\u2026' : 'Create Character'}
            </button>
          )}
        </div>
      ) : (
        <div className="s-char-roster">
          {myChars.map(char => {
            const imageUrl = char.image_url ? `${API_BASE}${char.image_url}` : null;
            const isActive = char.id === activeCharId;
            return (
              <div key={char.id} className={`s-roster-card${isActive ? ' active' : ''}`}>
                <div className="s-roster-portrait">
                  {imageUrl
                    ? <img src={imageUrl} alt={char.username} />
                    : <SilhouetteSVG />
                  }
                </div>
                <div className="s-roster-info">
                  <div className="s-roster-name">{char.character_name || char.username}</div>
                  <div className="s-roster-charname" style={{ fontSize: '0.65rem', opacity: 0.5, fontFamily: "'Share Tech Mono',monospace" }}>
                    by {char.username}
                  </div>
                  <div className="s-roster-rank">
                    <RankBadge rank={char.spire_rank} />
                  </div>
                  {char.status_name && (
                    <div className="s-roster-status">{char.status_name}</div>
                  )}
                </div>
                <div className="s-roster-actions">
                  <Link to={`/characters/${char.id}`} className="s-btn small">
                    View Profile
                  </Link>
                  {!isActive && (
                    <button
                      className="s-btn small"
                      onClick={() => switchActiveChar(char.id)}
                    >
                      Set Active
                    </button>
                  )}
                  {isActive && (
                    <span className="s-roster-active-badge">◆ Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {myChars.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--dim)', textAlign: 'center' }}>
          Your active character is used when you post stories and appear in the activity feed.
        </div>
      )}
    </div>
  );
}
