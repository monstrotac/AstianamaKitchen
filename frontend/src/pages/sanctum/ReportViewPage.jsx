import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReport } from '../../api/sanctum';
import { useAuth } from '../../contexts/AuthContext';
import { useTitle } from '../../hooks/useTitle';

// ── Classification ────────────────────────────────────────────────────────────
const CLASSIFICATIONS = [
  { value: 'UNCLASSIFIED', label: 'Unclassified', color: '#5aaa6e' },
  { value: 'RESTRICTED',   label: 'Restricted',   color: '#c9a227' },
  { value: 'CLASSIFIED',   label: 'Classified',   color: '#cc4444' },
  { value: 'EYES ONLY',    label: 'Eyes Only',    color: '#9955cc' },
];
const CLF_MAP = Object.fromEntries(CLASSIFICATIONS.map(c => [c.value, c]));
const CLF_RE  = /^\[CLF:([A-Z ]+)\]\n?/;

function decodeBody(raw) {
  const m = (raw || '').match(CLF_RE);
  if (m) return { classification: m[1], body: raw.slice(m[0].length) };
  return { classification: 'UNCLASSIFIED', body: raw || '' };
}

// ── Inline renderer ───────────────────────────────────────────────────────────
const INLINE_STAMPS = ['CLASSIFIED','RESTRICTED','EYES ONLY','UNCLASSIFIED','REDACTED',
  'COMPROMISED','PRIORITY','URGENT','DECEASED','ACTIVE','TERMINATED'];
const INLINE_STAMP_RE = new RegExp(`\\[(${INLINE_STAMPS.join('|')})\\]`);

function renderInline(text, key = 0) {
  const parts = []; let rest = text; let k = key;
  while (rest.length > 0) {
    const si = rest.search(INLINE_STAMP_RE), bi = rest.indexOf('**'), ii = rest.search(/(?<!\*)\*(?!\*)/);
    const cands = [si>=0?{idx:si,type:'stamp'}:null, bi>=0?{idx:bi,type:'bold'}:null, ii>=0?{idx:ii,type:'italic'}:null]
      .filter(Boolean).sort((a,b)=>a.idx-b.idx);
    if (!cands.length) { parts.push(<span key={k++}>{rest}</span>); break; }
    const { idx, type } = cands[0];
    if (idx > 0) parts.push(<span key={k++}>{rest.slice(0,idx)}</span>);
    if (type === 'stamp') {
      const m = rest.slice(idx).match(INLINE_STAMP_RE); const label = m[1];
      const color = CLF_MAP[label]?.color || 'var(--dim)';
      parts.push(<span key={k++} className="s-report-stamp" style={{color,borderColor:color}}>{label}</span>);
      rest = rest.slice(idx + m[0].length);
    } else if (type === 'bold') {
      const end = rest.indexOf('**', idx+2);
      if (end<0){parts.push(<span key={k++}>{rest.slice(idx)}</span>);break;}
      parts.push(<strong key={k++}>{rest.slice(idx+2,end)}</strong>); rest=rest.slice(end+2);
    } else {
      const end = rest.slice(idx+1).search(/(?<!\*)\*(?!\*)/);
      if (end<0){parts.push(<span key={k++}>{rest.slice(idx)}</span>);break;}
      parts.push(<em key={k++}>{rest.slice(idx+1,idx+1+end)}</em>); rest=rest.slice(idx+1+end+1);
    }
  }
  return parts;
}

function ReportBody({ body }) {
  const lines = body.split('\n'); const output = []; let bullets = []; let k = 0;
  function flush() {
    if (!bullets.length) return;
    output.push(<ul key={k++} className="s-report-list">{bullets.map((b,i)=><li key={i}>{renderInline(b)}</li>)}</ul>);
    bullets = [];
  }
  for (const line of lines) {
    if (line.startsWith('# '))      { flush(); output.push(<div key={k++} className="s-report-h1">{renderInline(line.slice(2))}</div>); }
    else if (line.startsWith('## ')){ flush(); output.push(<div key={k++} className="s-report-h2">{renderInline(line.slice(3))}</div>); }
    else if (line === '---')         { flush(); output.push(<hr key={k++} className="s-report-rule"/>); }
    else if (line.startsWith('- ')) { bullets.push(line.slice(2)); }
    else if (line.trim() === '')    { flush(); output.push(<div key={k++} className="s-report-gap"/>); }
    else                             { flush(); output.push(<div key={k++} className="s-report-line">{renderInline(line)}</div>); }
  }
  flush();
  return <div className="s-report-formatted">{output}</div>;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ReportViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSolstice, isAdmin } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  useTitle(report?.title || 'Report');

  useEffect(() => {
    getReport(id)
      .then(setReport)
      .catch(() => navigate('/reports', { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="s-empty">Loading…</div>;
  if (!report)  return <div className="s-empty">Report not found.</div>;

  const { classification, body } = decodeBody(report.body);
  const clf      = CLF_MAP[classification] || CLF_MAP['UNCLASSIFIED'];
  const reportId = report.id.replace(/-/g,'').slice(0,8).toUpperCase();
  const date     = new Date(report.created_at);
  const dateStr  = date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'2-digit' });
  const timeStr  = date.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
  const canEdit  = isSolstice || isAdmin || report.author_id === user?.id;

  return (
    <div className="s-container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <button className="s-btn-ghost" onClick={() => navigate('/reports')}>← Reports</button>
        <div style={{ flex: 1 }} />
        {canEdit && (
          <Link className="s-btn small" to={`/reports/${id}/edit`}>✎ Edit</Link>
        )}
      </div>

      {/* Holopad */}
      <div className="s-holopad s-holopad-open" style={{ '--clf': clf.color }}>
        {/* Classification banner */}
        <div className="s-holopad-clf">
          <span className="s-holopad-clf-badge" style={{ color: clf.color, borderColor: clf.color }}>
            ◈ {clf.label.toUpperCase()}
          </span>
          {!report.is_published && <span className="draft-badge draft" style={{ marginLeft: 4 }}>Draft</span>}
          <span className="s-holopad-rpt-id">RPT-{reportId}</span>
          <span className="s-holopad-rpt-date">{dateStr} · {timeStr}</span>
        </div>

        {/* Header */}
        <div className="s-holopad-header">
          <div className="s-holopad-subject-block">
            <div className="s-holopad-subject-eyebrow">SUBJECT</div>
            <div className="s-holopad-subject">{report.subject || '—'}</div>
            <div className="s-holopad-title">{report.title || <em style={{ opacity:0.4 }}>Untitled</em>}</div>
          </div>
          <div className="s-holopad-header-right">
            {report.author_name && <div className="s-holopad-author">Filed by {report.author_name}</div>}
          </div>
        </div>

        {/* Body */}
        <div className="s-holopad-body">
          {body
            ? <ReportBody body={body} />
            : <div style={{ color:'var(--dim)', fontSize:'0.8rem' }}>No content.</div>
          }
        </div>

        <div className="s-holopad-corner s-holopad-corner-tr" style={{ borderColor: clf.color }} />
        <div className="s-holopad-corner s-holopad-corner-bl" style={{ borderColor: clf.color }} />
      </div>
    </div>
  );
}
