import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStory } from '../../api/sanctum';
import { useAuth } from '../../contexts/AuthContext';
import { useTitle } from '../../hooks/useTitle';

// ── Inline renderer ───────────────────────────────────────────────────────────
const INLINE_STAMPS = ['CLASSIFIED','RESTRICTED','EYES ONLY','UNCLASSIFIED',
  'REDACTED','COMPROMISED','PRIORITY','URGENT','DECEASED','ACTIVE','TERMINATED','EXILED','ASCENDED','FALLEN'];
const INLINE_STAMP_RE = new RegExp(`\\[(${INLINE_STAMPS.join('|')})\\]`);
const STAMP_COLORS = {
  CLASSIFIED:'#cc4444', RESTRICTED:'#c9a227', 'EYES ONLY':'#9955cc', UNCLASSIFIED:'#5aaa6e',
  REDACTED:'#888', COMPROMISED:'#e06060', PRIORITY:'#c9a227', URGENT:'#cc4444',
  DECEASED:'#888', ACTIVE:'#5aaa6e', TERMINATED:'#cc4444', EXILED:'#888', ASCENDED:'#9955cc', FALLEN:'#cc4444',
};

function renderInline(text, key = 0) {
  const parts = []; let rest = text; let k = key;
  while (rest.length > 0) {
    const si = rest.search(INLINE_STAMP_RE), bi = rest.indexOf('**'), ii = rest.search(/(?<!\*)\*(?!\*)/);
    const cands = [si>=0?{idx:si,type:'stamp'}:null, bi>=0?{idx:bi,type:'bold'}:null, ii>=0?{idx:ii,type:'italic'}:null]
      .filter(Boolean).sort((a,b) => a.idx - b.idx);
    if (!cands.length) { parts.push(<span key={k++}>{rest}</span>); break; }
    const { idx, type } = cands[0];
    if (idx > 0) parts.push(<span key={k++}>{rest.slice(0, idx)}</span>);
    if (type === 'stamp') {
      const m = rest.slice(idx).match(INLINE_STAMP_RE); const label = m[1];
      const color = STAMP_COLORS[label] || 'var(--dim)';
      parts.push(<span key={k++} className="s-report-stamp" style={{ color, borderColor: color }}>{label}</span>);
      rest = rest.slice(idx + m[0].length);
    } else if (type === 'bold') {
      const end = rest.indexOf('**', idx + 2);
      if (end < 0) { parts.push(<span key={k++}>{rest.slice(idx)}</span>); break; }
      parts.push(<strong key={k++}>{rest.slice(idx+2, end)}</strong>); rest = rest.slice(end + 2);
    } else {
      const end = rest.slice(idx+1).search(/(?<!\*)\*(?!\*)/);
      if (end < 0) { parts.push(<span key={k++}>{rest.slice(idx)}</span>); break; }
      parts.push(<em key={k++}>{rest.slice(idx+1, idx+1+end)}</em>); rest = rest.slice(idx+1+end+1);
    }
  }
  return parts;
}

function StoryBody({ body }) {
  const lines = body.split('\n'); const output = []; let bullets = []; let k = 0;
  function flush() {
    if (!bullets.length) return;
    output.push(<ul key={k++} className="s-report-list">{bullets.map((b,i) => <li key={i}>{renderInline(b)}</li>)}</ul>);
    bullets = [];
  }
  for (const line of lines) {
    if (line.startsWith('# '))       { flush(); output.push(<div key={k++} className="s-report-h1">{renderInline(line.slice(2))}</div>); }
    else if (line.startsWith('## ')) { flush(); output.push(<div key={k++} className="s-report-h2">{renderInline(line.slice(3))}</div>); }
    else if (line === '---')          { flush(); output.push(<hr key={k++} className="s-report-rule" />); }
    else if (line.startsWith('- '))  { bullets.push(line.slice(2)); }
    else if (line.trim() === '')     { flush(); output.push(<div key={k++} className="s-report-gap" />); }
    else                              { flush(); output.push(<div key={k++} className="s-report-line">{renderInline(line)}</div>); }
  }
  flush();
  return <div className="s-report-formatted">{output}</div>;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function StoryViewPage() {
  const { charId, storyId } = useParams();
  const navigate = useNavigate();
  const { user, isSolstice, isAdmin } = useAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  useTitle(story?.title || 'Chronicle');

  useEffect(() => {
    getStory(charId, storyId)
      .then(setStory)
      .catch(() => navigate(`/characters/${charId}`, { replace: true }))
      .finally(() => setLoading(false));
  }, [charId, storyId]);

  if (loading) return <div className="s-empty">Loading…</div>;
  if (!story)  return <div className="s-empty">Chronicle not found.</div>;

  const canEdit = isSolstice || isAdmin || story.user_id === user?.id;
  const date    = new Date(story.created_at);
  const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

  return (
    <div className="s-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="s-btn-ghost" onClick={() => navigate(`/characters/${charId}`)}>← Chronicle</button>
        <div style={{ flex: 1 }} />
        {canEdit && (
          <Link className="s-btn small" to={`/characters/${charId}/stories/${storyId}/edit`}>✎ Edit</Link>
        )}
      </div>

      {/* Story card */}
      <div className="s-story-card-v2" style={{ padding: '2rem' }}>
        <div className="s-story-card-header" style={{ marginBottom: '1.5rem' }}>
          <div className="s-story-card-title-row">
            <span className="s-story-card-title" style={{ fontSize: '1.25rem' }}>
              {story.title || <em style={{ opacity: 0.4, fontStyle: 'italic', fontFamily: 'inherit' }}>Untitled</em>}
            </span>
            {!story.is_published && <span className="draft-badge draft">Draft</span>}
          </div>
          <div className="s-story-card-meta" style={{ marginTop: '0.35rem' }}>
            <span className="s-story-date">{dateStr}</span>
            {(story.author_name || story.character_name) && (
              <span style={{ fontSize: '0.68rem', color: 'var(--dim)', marginLeft: '0.75rem' }}>
                ◆ {story.author_name || story.character_name}
              </span>
            )}
          </div>
        </div>

        <div className="s-holopad-body">
          {story.body
            ? <StoryBody body={story.body} />
            : <div style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>No content.</div>
          }
        </div>
      </div>
    </div>
  );
}
