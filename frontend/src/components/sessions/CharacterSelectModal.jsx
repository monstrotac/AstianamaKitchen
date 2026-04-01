import { useState } from 'react';
import { useSanctum } from '../../contexts/SanctumContext';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function CharacterSelectModal({ onSelect, onClose }) {
  const { myChars } = useSanctum();
  const [selected, setSelected] = useState(null);

  function confirm() {
    if (selected) onSelect(selected);
  }

  return (
    <div className="sess-overlay" onClick={onClose}>
      <div className="sess-char-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-title">Select Character</div>

        {myChars.length === 0 ? (
          <div className="sess-empty">You have no characters. Create one in the Sanctum first.</div>
        ) : (
          <div className="sess-char-list">
            {myChars.map(c => (
              <div
                key={c.id}
                className={`sess-char-option${selected === c.id ? ' selected' : ''}`}
                onClick={() => setSelected(c.id)}
              >
                {c.image_url ? (
                  <img className="sess-char-avatar" src={`${API_BASE}${c.image_url}`} alt="" />
                ) : (
                  <div className="sess-char-avatar-placeholder">
                    {(c.character_name || '?')[0]}
                  </div>
                )}
                <div className="sess-char-detail">
                  <div className="sess-char-detail-name">{c.character_name || 'Unnamed'}</div>
                  <div className="sess-char-detail-sub">
                    {c.spire_rank?.toUpperCase()} {c.species ? `// ${c.species}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:8, marginTop:16, justifyContent:'flex-end' }}>
          <button className="ct-action-btn" onClick={onClose}>Cancel</button>
          <button
            className="ct-action-btn green"
            disabled={!selected}
            onClick={confirm}
            style={!selected ? { opacity:0.4, cursor:'default' } : {}}
          >
            Join Session
          </button>
        </div>
      </div>
    </div>
  );
}
