import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getReports, createReport, deleteReport } from '../../api/sanctum';
import { useTitle } from '../../hooks/useTitle';

// ── Classification metadata ───────────────────────────────────────────────────
const CLASSIFICATIONS = [
  { value: 'UNCLASSIFIED', label: 'Unclassified',  color: '#5aaa6e' },
  { value: 'RESTRICTED',   label: 'Restricted',    color: '#c9a227' },
  { value: 'CLASSIFIED',   label: 'Classified',    color: '#cc4444' },
  { value: 'EYES ONLY',    label: 'Eyes Only',     color: '#9955cc' },
];
const CLF_MAP = Object.fromEntries(CLASSIFICATIONS.map(c => [c.value, c]));

// Marker embedded as first line of body: [CLF:CLASSIFIED]
const CLF_RE = /^\[CLF:([A-Z ]+)\]\n?/;

function encodeBody(classification, body) {
  return `[CLF:${classification}]\n${body}`;
}

function decodeBody(raw) {
  const m = raw.match(CLF_RE);
  if (m) return { classification: m[1], body: raw.slice(m[0].length) };
  return { classification: 'UNCLASSIFIED', body: raw };
}

// ── Inline format renderer ────────────────────────────────────────────────────
const INLINE_STAMPS = ['CLASSIFIED', 'RESTRICTED', 'EYES ONLY', 'UNCLASSIFIED', 'REDACTED', 'COMPROMISED', 'PRIORITY', 'URGENT', 'DECEASED', 'ACTIVE', 'TERMINATED'];
const INLINE_STAMP_RE = new RegExp(`\\[(${INLINE_STAMPS.join('|')})\\]`);

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

// ── Block format renderer ─────────────────────────────────────────────────────
function ReportBody({ body }) {
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
    if (line.startsWith('# ')) {
      flushBullets();
      output.push(<div key={k++} className="s-report-h1">{renderInline(line.slice(2))}</div>);
    } else if (line.startsWith('## ')) {
      flushBullets();
      output.push(<div key={k++} className="s-report-h2">{renderInline(line.slice(3))}</div>);
    } else if (line === '---') {
      flushBullets();
      output.push(<hr key={k++} className="s-report-rule" />);
    } else if (line.startsWith('- ')) {
      bullets.push(line.slice(2));
    } else if (line.trim() === '') {
      flushBullets();
      output.push(<div key={k++} className="s-report-gap" />);
    } else {
      flushBullets();
      output.push(<div key={k++} className="s-report-line">{renderInline(line)}</div>);
    }
  }
  flushBullets();
  return <div className="s-report-formatted">{output}</div>;
}

// ── Report card ───────────────────────────────────────────────────────────────
function ReportCard({ report, onDelete, canDelete, canEdit }) {
  const { classification } = decodeBody(report.body || '');
  const clf      = CLF_MAP[classification] || CLF_MAP['UNCLASSIFIED'];
  const reportId = report.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  const date     = new Date(report.created_at);
  const dateStr  = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
  const timeStr  = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const isDraft  = !report.is_published;

  return (
    <div className={`s-holopad${isDraft ? ' s-holopad-draft' : ''}`} style={{ '--clf': clf.color }}>
      {/* Classification banner */}
      <div className="s-holopad-clf">
        <span className="s-holopad-clf-badge" style={{ color: clf.color, borderColor: clf.color }}>
          ◈ {clf.label.toUpperCase()}
        </span>
        {isDraft && <span className="draft-badge draft" style={{ marginLeft: 4 }}>Draft</span>}
        <span className="s-holopad-rpt-id">RPT-{reportId}</span>
        <span className="s-holopad-rpt-date">{dateStr} · {timeStr}</span>
      </div>

      {/* Header */}
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
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {canEdit && (
              <Link className="s-btn small" to={`/reports/${report.id}/edit`} style={{ fontSize: '0.65rem' }}>
                ✎ Edit
              </Link>
            )}
            {canDelete && (
              <button className="s-btn small danger" style={{ fontSize: '0.65rem' }} onClick={() => onDelete(report.id)}>
                Delete
              </button>
            )}
            <Link
              className="s-btn small"
              to={`/reports/${report.id}`}
              style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}
            >
              View →
            </Link>
          </div>
        </div>
      </div>

      {/* Corner accents */}
      <div className="s-holopad-corner s-holopad-corner-tr" style={{ borderColor: clf.color }} />
      <div className="s-holopad-corner s-holopad-corner-bl" style={{ borderColor: clf.color }} />
    </div>
  );
}

// ── Format hint ───────────────────────────────────────────────────────────────
function FormatHint() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <button
        type="button"
        className="s-btn small"
        style={{ opacity: 0.6, fontSize: '0.6rem', letterSpacing: '0.1em' }}
        onClick={() => setOpen(p => !p)}
      >
        {open ? '▲ Hide formatting guide' : '▼ Formatting guide'}
      </button>
      {open && (
        <div className="s-report-format-hint">
          <div><code># Heading</code> — section header</div>
          <div><code>## Sub-heading</code> — sub-section</div>
          <div><code>- item</code> — bullet list entry</div>
          <div><code>---</code> — horizontal divider</div>
          <div><code>**bold**</code> — bold text</div>
          <div><code>*italic*</code> — italic text</div>
          <div><code>[REDACTED]</code> <code>[URGENT]</code> <code>[ACTIVE]</code> <code>[TERMINATED]</code> — inline stamps</div>
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 10;

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

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SpireReportsPage() {
  useTitle('Reports');
  const { isMember, isSolstice, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports]       = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [creating, setCreating]     = useState(false);
  const [page, setPage]             = useState(1);

  useEffect(() => { load(); }, []);

  async function load(subject) {
    setLoading(true);
    setPage(1);
    try {
      const data = await getReports(subject ? { subject } : undefined);
      setReports(data);
    } catch (e) {}
    finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    load(search.trim() || undefined);
  }

  async function handleFileReport() {
    setCreating(true);
    try {
      const report = await createReport({});
      navigate(`/reports/${report.id}/edit`);
    } catch {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this report?')) return;
    try {
      await deleteReport(id);
      setReports(p => p.filter(r => r.id !== id));
    } catch (e) {}
  }

  function canDelete(report) {
    return isSolstice || isAdmin || report.author_id === user?.id;
  }

  const published  = reports.filter(r => r.is_published);
  const drafts     = reports.filter(r => !r.is_published);
  const totalPages = Math.ceil(published.length / PAGE_SIZE) || 1;
  const paginated  = published.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="s-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="s-section-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Field Reports</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--dim)', letterSpacing: '0.1em', fontFamily: 'Share Tech Mono, monospace' }}>
            INTELLIGENCE ARCHIVE — AUTHORISED OPERATIVES ONLY
          </div>
        </div>
        {isMember && (
          <button className="s-btn" onClick={handleFileReport} disabled={creating}>
            {creating ? '…' : '◆ File Report'}
          </button>
        )}
      </div>

      {/* Own drafts — only visible to author */}
      {drafts.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--dim)', letterSpacing: '0.12em', fontFamily: "'Share Tech Mono',monospace", marginBottom: '0.5rem' }}>
            YOUR DRAFTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {drafts.map(r => (
              <ReportCard
                key={r.id}
                report={r}
                onDelete={handleDelete}
                canDelete={canDelete(r)}
                canEdit={canDelete(r)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          className="s-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by subject name…"
          style={{ flex: 1 }}
        />
        <button className="s-btn" type="submit">Search</button>
        {search && (
          <button className="s-btn" type="button" onClick={() => { setSearch(''); load(); }}>Clear</button>
        )}
      </form>

      {/* Published report list */}
      {loading ? (
        <div style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>Loading reports…</div>
      ) : published.length === 0 ? (
        <div className="s-empty">No field reports on record.</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {paginated.map(r => (
              <ReportCard
                key={r.id}
                report={r}
                onDelete={handleDelete}
                canDelete={canDelete(r)}
                canEdit={canDelete(r)}
              />
            ))}
          </div>
          <Pagination page={page} total={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
