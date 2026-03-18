import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getActivityFeed, getReports } from '../../api/sanctum';
import { useTitle } from '../../hooks/useTitle';

const FEED_TYPE_LABEL = {
  character: { label: 'New Character', color: 'var(--mono)' },
  trial:     { label: 'Trial',         color: 'var(--dim)' },
  story:     { label: 'Story',         color: 'var(--crimson)' },
};

const STATUS_COLOR = {
  pending:  'var(--dim)',
  active:   'var(--mono)',
  complete: '#4caf8a',
  failed:   '#c55',
};

// ── Report body renderer (matches SpireReportsPage) ───────────────────────────
const INLINE_STAMPS = ['CLASSIFIED', 'RESTRICTED', 'EYES ONLY', 'UNCLASSIFIED', 'REDACTED', 'COMPROMISED', 'PRIORITY', 'URGENT', 'DECEASED', 'ACTIVE', 'TERMINATED'];
const INLINE_STAMP_RE = new RegExp(`\\[(${INLINE_STAMPS.join('|')})\\]`);
const CLF_RE = /^\[CLF:([A-Z ]+)\]\n?/;
const CLASSIFICATIONS = [
  { value: 'UNCLASSIFIED', label: 'Unclassified', color: '#5aaa6e' },
  { value: 'RESTRICTED',   label: 'Restricted',   color: '#c9a227' },
  { value: 'CLASSIFIED',   label: 'Classified',   color: '#cc4444' },
  { value: 'EYES ONLY',    label: 'Eyes Only',    color: '#9955cc' },
];
const CLF_MAP = Object.fromEntries(CLASSIFICATIONS.map(c => [c.value, c]));

function decodeBody(raw) {
  const m = (raw || '').match(CLF_RE);
  if (m) return { classification: m[1], body: raw.slice(m[0].length) };
  return { classification: 'UNCLASSIFIED', body: raw || '' };
}

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
      const color = CLF_MAP[label]?.color || 'var(--dim)';
      parts.push(<span key={k++} className="s-report-stamp" style={{ color, borderColor: color }}>{label}</span>);
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

function ReportBody({ body }) {
  const lines  = body.split('\n');
  const output = [];
  let bullets  = [];
  let k = 0;
  function flushBullets() {
    if (!bullets.length) return;
    output.push(<ul key={k++} className="s-report-list">{bullets.map((b, i) => <li key={i}>{renderInline(b)}</li>)}</ul>);
    bullets = [];
  }
  for (const line of lines) {
    if (line.startsWith('# '))       { flushBullets(); output.push(<div key={k++} className="s-report-h1">{renderInline(line.slice(2))}</div>); }
    else if (line.startsWith('## ')) { flushBullets(); output.push(<div key={k++} className="s-report-h2">{renderInline(line.slice(3))}</div>); }
    else if (line === '---')         { flushBullets(); output.push(<hr key={k++} className="s-report-rule" />); }
    else if (line.startsWith('- '))  { bullets.push(line.slice(2)); }
    else if (line.trim() === '')     { flushBullets(); output.push(<div key={k++} className="s-report-gap" />); }
    else                             { flushBullets(); output.push(<div key={k++} className="s-report-line">{renderInline(line)}</div>); }
  }
  flushBullets();
  return <div className="s-report-formatted">{output}</div>;
}

// ── Feed item ─────────────────────────────────────────────────────────────────
function FeedItem({ item }) {
  const [expanded, setExpanded] = useState(false);
  const meta    = FEED_TYPE_LABEL[item.feed_type] || { label: item.feed_type, color: 'var(--dim)' };
  const hasBody = !!item.body;

  function href() {
    if (item.feed_type === 'character') return `/characters/${item.id}`;
    if (item.feed_type === 'trial')     return `/trials/${item.id}`;
    if (item.feed_type === 'story' && item.character_id) return `/characters/${item.character_id}`;
    return null;
  }

  const link = href();

  return (
    <div
      className="s-feed-item"
      onClick={() => hasBody && setExpanded(p => !p)}
      style={{ cursor: hasBody ? 'pointer' : 'default' }}
    >
      <div className="s-feed-item-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <span className="s-feed-type-badge" style={{ background: meta.color }}>{meta.label}</span>
          {item.feed_type === 'trial' && item.status && (
            <span style={{ fontSize: '0.6rem', color: STATUS_COLOR[item.status], fontFamily: "'Share Tech Mono',monospace" }}>
              [{item.status}]
            </span>
          )}
          {item.feed_type !== 'character' && (
            <span className="s-feed-title">{item.title}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          {item.feed_type === 'character' ? (
            <span style={{ fontSize: '0.6rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>
              {[item.username, item.title, item.full_name].filter(Boolean).join(' · ')}
            </span>
          ) : item.author_name && (
            <span style={{ fontSize: '0.6rem', color: 'var(--dim)' }}>{item.author_name}</span>
          )}
          <span style={{ fontSize: '0.6rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>
            {new Date(item.created_at).toLocaleDateString()}
          </span>
          {link && !hasBody && (
            <Link
              to={link}
              className="s-hero-link"
              style={{ fontSize: '0.6rem' }}
              onClick={e => e.stopPropagation()}
            >
              View →
            </Link>
          )}
          {hasBody && <span style={{ fontSize: '0.6rem', color: 'var(--mono)' }}>{expanded ? '▲' : '▼'}</span>}
        </div>
      </div>

      {expanded && hasBody && (
        <div className="s-feed-item-body">
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
            {item.body.length > 400 ? item.body.slice(0, 400) + '…' : item.body}
          </div>
          {link && (
            <Link
              to={link}
              className="s-hero-link"
              style={{ fontSize: '0.7rem', marginTop: '0.75rem', display: 'inline-block' }}
              onClick={e => e.stopPropagation()}
            >
              Read more →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Report preview (expandable) ───────────────────────────────────────────────
function ReportPreview({ report }) {
  const [expanded, setExpanded] = useState(false);
  const { classification, body } = decodeBody(report.body);
  const clf = CLF_MAP[classification] || CLF_MAP['UNCLASSIFIED'];

  return (
    <div
      className={`s-holopad${expanded ? ' s-holopad-open' : ''}`}
      style={{ '--clf': clf.color, marginBottom: '0.4rem', cursor: 'pointer' }}
      onClick={() => setExpanded(p => !p)}
    >
      <div className="s-holopad-clf">
        <span className="s-holopad-clf-badge" style={{ color: clf.color, borderColor: clf.color }}>
          ◈ {clf.label.toUpperCase()}
        </span>
      </div>
      <div className="s-holopad-header">
        <div className="s-holopad-subject-block">
          <div className="s-holopad-subject-eyebrow">SUBJECT</div>
          <div className="s-holopad-subject">{report.subject || '—'}</div>
          <div className="s-holopad-title">{report.title || <em style={{ opacity: 0.4 }}>Untitled</em>}</div>
        </div>
        <div className="s-holopad-header-right">
          {report.author_name && (
            <div className="s-holopad-author">Filed by {report.author_name}</div>
          )}
          <div style={{ fontSize: '0.58rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>
            {new Date(report.created_at).toLocaleDateString()}
          </div>
          <div className="s-holopad-toggle">{expanded ? '▲ COLLAPSE' : '▼ EXPAND'}</div>
        </div>
      </div>
      {expanded && (
        <div className="s-holopad-body" onClick={e => e.stopPropagation()}>
          {body ? <ReportBody body={body} /> : <div style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>No content yet.</div>}
        </div>
      )}
      <div className="s-holopad-corner s-holopad-corner-tr" style={{ borderColor: clf.color }} />
      <div className="s-holopad-corner s-holopad-corner-bl" style={{ borderColor: clf.color }} />
    </div>
  );
}

export default function SpireHomePage() {
  useTitle(null); // base title: "House Torkessh Sanctum"
  const [feed, setFeed]       = useState([]);
  const [reports, setReports] = useState([]);

  const loadFeed    = useCallback(() => getActivityFeed().then(setFeed).catch(() => {}), []);
  const loadReports = useCallback(() =>
    getReports({ published_only: true }).then(data => setReports(data.slice(0, 5))).catch(() => {}),
  []);

  useEffect(() => { loadFeed(); loadReports(); }, [loadFeed, loadReports]);

  return (
    <div>
      {/* Hero */}
      <div className="s-hero">
        <div className="s-hero-title">THE SANCTUM</div>
        <div className="s-hero-sub">Sith Order — Hierarchy &amp; Lineage Registry</div>
        <div className="s-hero-links">
          <Link to="/characters" className="s-hero-link">Browse Characters</Link>
          <Link to="/trials" className="s-hero-link">View Trials</Link>
          <Link to="/reports" className="s-hero-link">Field Reports</Link>
        </div>
      </div>

      <div className="s-two-col">
        {/* Activity Feed */}
        <div>
          <div className="s-section-title" style={{ margin: '0 0 1rem' }}>Activity Feed</div>

          {feed.length === 0
            ? <div className="s-empty">No recent activity.</div>
            : feed.map((item, i) => <FeedItem key={`${item.feed_type}-${item.id}-${i}`} item={item} />)
          }
        </div>

        {/* Recent Reports */}
        <div>
          <div className="s-section-title" style={{ margin: '0 0 1rem' }}>Recent Reports</div>
          {reports.length === 0
            ? <div className="s-empty">No field reports on record.</div>
            : reports.map(r => <ReportPreview key={r.id} report={r} />)
          }
        </div>
      </div>
    </div>
  );
}
