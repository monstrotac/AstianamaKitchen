import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStories, updateStory, deleteStory } from '../../api/sanctum';
import RollPanel from '../../components/sanctum/RollPanel';
import { useTitle } from '../../hooks/useTitle';

// ── Inline format renderer (same as reports) ─────────────────────────────────
const INLINE_STAMPS = ['CLASSIFIED', 'RESTRICTED', 'EYES ONLY', 'UNCLASSIFIED',
  'REDACTED', 'COMPROMISED', 'PRIORITY', 'URGENT', 'DECEASED', 'ACTIVE', 'TERMINATED',
  'EXILED', 'ASCENDED', 'FALLEN'];
const INLINE_STAMP_RE = new RegExp(`\\[(${INLINE_STAMPS.join('|')})\\]`);
const STAMP_COLORS = {
  CLASSIFIED: '#cc4444', RESTRICTED: '#c9a227', 'EYES ONLY': '#9955cc',
  UNCLASSIFIED: '#5aaa6e', REDACTED: '#888', COMPROMISED: '#e06060',
  PRIORITY: '#c9a227', URGENT: '#cc4444', DECEASED: '#888',
  ACTIVE: '#5aaa6e', TERMINATED: '#cc4444', EXILED: '#888',
  ASCENDED: '#9955cc', FALLEN: '#cc4444',
};

function renderInline(text, key = 0) {
  const parts = [];
  let rest = text;
  let k = key;
  while (rest.length > 0) {
    const stampIdx  = rest.search(INLINE_STAMP_RE);
    const boldIdx   = rest.indexOf('**');
    const italicIdx = rest.search(/(?<!\*)\*(?!\*)/);
    const candidates = [
      stampIdx  >= 0 ? { idx: stampIdx,  type: 'stamp'  } : null,
      boldIdx   >= 0 ? { idx: boldIdx,   type: 'bold'   } : null,
      italicIdx >= 0 ? { idx: italicIdx, type: 'italic' } : null,
    ].filter(Boolean).sort((a, b) => a.idx - b.idx);
    if (!candidates.length) { parts.push(<span key={k++}>{rest}</span>); break; }
    const { idx, type } = candidates[0];
    if (idx > 0) parts.push(<span key={k++}>{rest.slice(0, idx)}</span>);
    if (type === 'stamp') {
      const m = rest.slice(idx).match(INLINE_STAMP_RE);
      const label = m[1];
      const color = STAMP_COLORS[label] || 'var(--dim)';
      parts.push(
        <span key={k++} className="s-report-stamp" style={{ color, borderColor: color }}>{label}</span>
      );
      rest = rest.slice(idx + m[0].length);
    } else if (type === 'bold') {
      const end = rest.indexOf('**', idx + 2);
      if (end < 0) { parts.push(<span key={k++}>{rest.slice(idx)}</span>); break; }
      parts.push(<strong key={k++}>{rest.slice(idx + 2, end)}</strong>);
      rest = rest.slice(end + 2);
    } else if (type === 'italic') {
      const end = rest.slice(idx + 1).search(/(?<!\*)\*(?!\*)/);
      if (end < 0) { parts.push(<span key={k++}>{rest.slice(idx)}</span>); break; }
      parts.push(<em key={k++}>{rest.slice(idx + 1, idx + 1 + end)}</em>);
      rest = rest.slice(idx + 1 + end + 1);
    }
  }
  return parts;
}

function StoryBody({ body }) {
  const lines  = body.split('\n');
  const output = [];
  let bullets  = [];
  let k = 0;
  function flushBullets() {
    if (!bullets.length) return;
    output.push(
      <ul key={k++} className="s-report-list">
        {bullets.map((b, i) => <li key={i}>{renderInline(b)}</li>)}
      </ul>
    );
    bullets = [];
  }
  for (const line of lines) {
    if (line.startsWith('# '))       { flushBullets(); output.push(<div key={k++} className="s-report-h1">{renderInline(line.slice(2))}</div>); }
    else if (line.startsWith('## ')) { flushBullets(); output.push(<div key={k++} className="s-report-h2">{renderInline(line.slice(3))}</div>); }
    else if (line === '---')         { flushBullets(); output.push(<hr  key={k++} className="s-report-rule" />); }
    else if (line.startsWith('- '))  { bullets.push(line.slice(2)); }
    else if (line.trim() === '')     { flushBullets(); output.push(<div key={k++} className="s-report-gap" />); }
    else                             { flushBullets(); output.push(<div key={k++} className="s-report-line">{renderInline(line)}</div>); }
  }
  flushBullets();
  return <div className="s-report-formatted">{output}</div>;
}

// ── Format hint tokens ────────────────────────────────────────────────────────
const FORMAT_HINTS = [
  ['# Heading',    '→ chapter / section title'],
  ['## Sub',       '→ sub-section'],
  ['---',          '→ scene divider'],
  ['- Item',       '→ bullet list'],
  ['**bold**',     '→ bold text'],
  ['*italic*',     '→ italic / inner thoughts'],
  ['[REDACTED]',   '→ redacted stamp'],
  ['[ASCENDED]',   '→ custom stamp (FALLEN, EXILED, ACTIVE…)'],
];

const VISIBILITY_OPTIONS = [
  { value: 'public',          label: 'Public'      },
  { value: 'role:apprentice', label: 'Apprentice+' },
  { value: 'role:lord',       label: 'Lord+'       },
];

export default function StoryEditPage() {
  const { charId, storyId } = useParams();
  const navigate = useNavigate();
  useTitle('Edit Chronicle', 'sanctum');

  const [story, setStory]         = useState(null);
  const [title, setTitle]         = useState('');
  const [body, setBody]           = useState('');
  const [visibility, setVisibility] = useState('public');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState('');
  const [deleting, setDeleting]   = useState(false);
  const [preview, setPreview]     = useState(false);
  const [hintOpen, setHintOpen]   = useState(false);

  useEffect(() => {
    getStories(charId).then(stories => {
      const s = stories.find(st => st.id === storyId);
      if (!s) { navigate(`/characters/${charId}`); return; }
      setStory(s);
      setTitle(s.title || '');
      setBody(s.body || '');
      setVisibility(s.visibility || 'public');
    }).catch(() => navigate(`/characters/${charId}`));
  }, [charId, storyId]);

  const save = useCallback(async (publishFlag) => {
    setSaving(true);
    setMsg('');
    try {
      const patch = { title, body, visibility };
      if (publishFlag !== undefined) patch.is_published = publishFlag;
      const updated = await updateStory(charId, storyId, patch);
      setStory(updated);
      setMsg(publishFlag ? 'Transmitted.' : 'Saved.');
      if (publishFlag) setTimeout(() => navigate(`/characters/${charId}`), 900);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [charId, storyId, title, body, visibility]);

  async function handleDelete() {
    if (!confirm('Delete this chronicle? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteStory(charId, storyId);
      navigate(`/characters/${charId}`);
    } catch {
      setDeleting(false);
    }
  }

  if (!story) {
    return (
      <div className="s-container s-main" style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>
        Accessing chronicle archive…
      </div>
    );
  }

  const isPublished  = story.is_published;
  const canPublish   = title.trim().length > 0 && body.trim().length > 0;
  const storyCode    = storyId.replace(/-/g, '').slice(0, 8).toUpperCase();
  const date        = new Date(story.created_at);
  const dateStr     = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  const wordCount   = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="s-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

      {/* Top nav bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="s-btn-ghost" onClick={() => navigate(`/characters/${charId}`)}>
          ← Character
        </button>
        <span className={`draft-badge ${isPublished ? 'published' : 'draft'}`}>
          {isPublished ? 'Published' : 'Draft'}
        </span>
        <div style={{ flex: 1 }} />
        {msg && (
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--dim)', fontFamily: 'Share Tech Mono, monospace' }}>
            {msg}
          </span>
        )}
        <button className="s-btn-ghost" onClick={() => save()} disabled={saving}>Save</button>
        {!isPublished && (
          <button
            className="s-btn"
            onClick={() => save(true)}
            disabled={saving || !canPublish}
            title={!canPublish ? 'Add a title and body before transmitting' : ''}
          >
            Transmit
          </button>
        )}
        <button
          className="s-btn-ghost"
          style={{ color: 'var(--crimson)' }}
          onClick={handleDelete}
          disabled={deleting}
        >
          Delete
        </button>
      </div>

      {/* Holopad frame */}
      <div className="s-chronicle-pad">

        {/* Top banner */}
        <div className="s-chronicle-banner">
          <span className="s-chronicle-type">◈ CHRONICLE</span>
          <span className="s-chronicle-id">CHR-{storyCode}</span>
          <div style={{ flex: 1 }} />
          <span className="s-chronicle-date">{dateStr}</span>
          <select
            className="s-chronicle-vis-select"
            value={visibility}
            onChange={e => setVisibility(e.target.value)}
            title="Visibility"
          >
            {VISIBILITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Title input */}
        <div className="s-chronicle-title-wrap">
          <div className="s-chronicle-title-eyebrow">TITLE</div>
          <input
            className="s-chronicle-title-input"
            placeholder="Chronicle title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Body area */}
        <div className="s-chronicle-body">

          {/* Mini toolbar */}
          <div className="s-chronicle-body-toolbar">
            <button
              type="button"
              className="s-btn-ghost"
              style={{ fontSize: '0.62rem', padding: '2px 8px' }}
              onClick={() => setPreview(p => !p)}
            >
              {preview ? '✎ Edit' : '◉ Preview'}
            </button>
            <button
              type="button"
              className="s-btn-ghost"
              style={{ fontSize: '0.62rem', padding: '2px 8px' }}
              onClick={() => setHintOpen(p => !p)}
            >
              {hintOpen ? '▲ Formatting' : '▼ Formatting'}
            </button>
            <span className="s-chronicle-wordcount">{wordCount} words</span>
          </div>

          {/* Roll panel */}
          <RollPanel
            charId={charId}
            onInsert={text => setBody(b => b ? b + '\n' + text : text)}
          />

          {/* Format hints */}
          {hintOpen && (
            <div className="s-report-format-hint" style={{ margin: '0 0 0.75rem' }}>
              {FORMAT_HINTS.map(([tok, desc]) => (
                <div key={tok}><code>{tok}</code> <span>{desc}</span></div>
              ))}
            </div>
          )}

          {/* Edit / Preview */}
          {preview ? (
            <div className="s-chronicle-preview">
              {body.trim()
                ? <StoryBody body={body} />
                : <div style={{ color: 'var(--dim)', fontStyle: 'italic', fontSize: '0.8rem' }}>Nothing written yet…</div>
              }
            </div>
          ) : (
            <textarea
              className="s-chronicle-textarea"
              placeholder={`# Prologue\n\nThe darkness between stars holds no fear for those who have embraced it…\n\n---\n\n## Part I — The Hunt\n\n*She moved through the shadows like smoke*, unseen by those who sought her…`}
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          )}
        </div>

      </div>
    </div>
  );
}
