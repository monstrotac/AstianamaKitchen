import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, updateReport, deleteReport } from '../../api/sanctum';
import { useTitle } from '../../hooks/useTitle';
import CharacterPicker from '../../components/sanctum/CharacterPicker';
import RollPanel from '../../components/sanctum/RollPanel';

const CLASSIFICATIONS = [
  { value: 'UNCLASSIFIED', label: 'Unclassified' },
  { value: 'RESTRICTED',   label: 'Restricted'   },
  { value: 'CLASSIFIED',   label: 'Classified'   },
  { value: 'EYES ONLY',    label: 'Eyes Only'     },
];

const CLF_RE = /^\[CLF:([A-Z ]+)\]\n?/;
function encodeBody(clf, body) { return `[CLF:${clf}]\n${body}`; }
function decodeBody(raw) {
  if (!raw) return { classification: 'UNCLASSIFIED', body: '' };
  const m = raw.match(CLF_RE);
  if (m) return { classification: m[1], body: raw.slice(m[0].length) };
  return { classification: 'UNCLASSIFIED', body: raw };
}

const FORMAT_HINTS = [
  ['# Heading',   '→ large section header'],
  ['## Sub',      '→ small section header'],
  ['---',         '→ horizontal divider'],
  ['- Item',      '→ bullet list item'],
  ['**bold**',    '→ bold text'],
  ['*italic*',    '→ italic text'],
  ['[REDACTED]',  '→ inline stamp (also CLASSIFIED, PRIORITY, etc.)'],
];

export default function ReportEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useTitle('Edit Report', 'sanctum');

  const [report, setReport]     = useState(null);
  const [subject, setSubject]   = useState('');
  const [title, setTitle]       = useState('');
  const [clf, setClf]           = useState('UNCLASSIFIED');
  const [body, setBody]         = useState('');
  const [creatorId, setCreatorId] = useState(null);
  const [creatorChar, setCreatorChar] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [status, setStatus]     = useState('');
  const [deleting, setDeleting] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    getReport(id).then(r => {
      setReport(r);
      setSubject(r.subject || '');
      setTitle(r.title || '');
      setCreatorId(r.creator_character_id || null);
      if (r.creator_character_id && r.creator_name) {
        setCreatorChar({ id: r.creator_character_id, character_name: r.creator_name, image_url: r.creator_image_url, code_name: '' });
      }
      const decoded = decodeBody(r.body);
      setClf(decoded.classification);
      setBody(decoded.body);
    }).catch(() => navigate('/reports'));
  }, [id]);

  const save = useCallback(async (publishFlag) => {
    setSaving(true);
    setStatus('');
    try {
      const patch = {
        subject,
        title,
        body: encodeBody(clf, body),
        creator_character_id: creatorId,
      };
      if (publishFlag !== undefined) patch.is_published = publishFlag;
      const updated = await updateReport(id, patch);
      setReport(updated);
      setStatus(publishFlag ? 'Published.' : 'Saved.');
      if (publishFlag) setTimeout(() => navigate('/reports'), 800);
    } catch (e) {
      setStatus(e?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [id, subject, title, clf, body, creatorId]);

  async function handleDelete() {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await deleteReport(id);
      navigate('/reports');
    } catch {
      setDeleting(false);
    }
  }

  if (!report) return <div className="s-container s-main" style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>Loading…</div>;

  const canPublish = !!creatorId;
  const isPublished = report.is_published;

  return (
    <div className="s-container">
      <div className="draft-page">
        {/* Toolbar */}
        <div className="draft-toolbar">
          <button className="s-btn-ghost" onClick={() => navigate('/reports')}>← Reports</button>
          <span className={`draft-badge ${isPublished ? 'published' : 'draft'}`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
          <div style={{ flex: 1 }} />
          {status && <span className="draft-status">{status}</span>}
          <button className="s-btn-ghost" onClick={() => save()} disabled={saving}>Save</button>
          {!isPublished && (
            <button
              className="s-btn"
              onClick={() => save(true)}
              disabled={saving || !canPublish}
              title={!canPublish ? 'Assign a creator character to publish' : ''}
            >
              Publish
            </button>
          )}
          <button className="s-btn-ghost" style={{ color: 'var(--crimson)' }} onClick={handleDelete} disabled={deleting}>
            Delete
          </button>
        </div>

        {/* Title */}
        <input
          className="draft-title-input"
          placeholder="Report title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Subject + Classification */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="draft-field">
            <div className="draft-field-label">Subject</div>
            <input className="draft-input" placeholder="Target, operation, faction…" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div className="draft-field">
            <div className="draft-field-label">Classification</div>
            <select className="draft-select" value={clf} onChange={e => setClf(e.target.value)}>
              {CLASSIFICATIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Creator */}
        <div style={{ marginBottom: '1rem' }}>
          <CharacterPicker
            value={creatorChar}
            onChange={cid => setCreatorId(cid)}
            label="Creator Character (required to publish)"
          />
          {!creatorId && (
            <div style={{ fontSize: '0.71rem', color: 'var(--dim)', marginTop: 4, opacity: 0.7 }}>
              You must assign a creator character before publishing.
            </div>
          )}
        </div>

        {/* Roll panel */}
        <RollPanel
          charId={creatorId}
          onInsert={text => setBody(b => b ? b + '\n' + text : text)}
        />

        {/* Format hint */}
        <div style={{ marginBottom: '0.5rem' }}>
          <button className="s-btn-ghost" style={{ fontSize: '0.72rem', padding: '3px 8px' }} onClick={() => setHintOpen(p => !p)}>
            {hintOpen ? '▲ Hide formatting' : '▼ Formatting guide'}
          </button>
          {hintOpen && (
            <div className="s-report-format-hint" style={{ marginTop: 6 }}>
              {FORMAT_HINTS.map(([tok, desc]) => (
                <div key={tok}><code>{tok}</code> <span>{desc}</span></div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <textarea
          className="s-textarea-report"
          style={{ minHeight: 340, width: '100%', boxSizing: 'border-box' }}
          placeholder="Begin report transmission…"
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      </div>
    </div>
  );
}
