import { Link } from 'react-router-dom';
import RankBadge from './RankBadge';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');

const SilhouetteSVG = () => (
  <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="50" cy="35" rx="20" ry="22" fill="currentColor" />
    <path d="M20 140 Q20 80 50 75 Q80 80 80 140Z" fill="currentColor" />
  </svg>
);

export default function CharacterCard({ char }) {
  const imageUrl = char.image_url ? `${API_BASE}${char.image_url}` : null;

  return (
    <Link to={`/characters/${char.id}`} className="s-card">
      <div className="s-card-portrait">
        {imageUrl
          ? <img src={imageUrl} alt={char.username} />
          : <SilhouetteSVG />
        }
      </div>
      <div className="s-card-info">
        <div className="s-card-name">{char.character_name || char.username}</div>
        <div className="s-card-status">
          <RankBadge rank={char.spire_rank} />
          {char.status_name && <span style={{ marginLeft: '0.5rem', fontSize: '0.68rem', opacity: 0.7 }}>{char.status_name}</span>}
        </div>
        <div style={{ fontSize: '0.65rem', marginTop: '0.3rem', opacity: 0.5, fontFamily: "'Share Tech Mono',monospace" }}>
          by {char.username}
        </div>
        {char.master_character_name && (
          <div style={{ fontSize: '0.65rem', marginTop: '0.15rem', opacity: 0.5 }}>
            Master: {char.master_character_name}
          </div>
        )}
      </div>
    </Link>
  );
}
