import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrial, updateTrial, deleteTrial, getCharacters } from '../../api/sanctum';
import { useTitle } from '../../hooks/useTitle';
import CharacterPicker from '../../components/sanctum/CharacterPicker';
import RollPanel from '../../components/sanctum/RollPanel';

const FORMAT_HINTS = [
  ['# Heading',   '→ large section header'],
  ['## Sub',      '→ small section header'],
  ['---',         '→ horizontal divider'],
  ['- Item',      '→ bullet list item'],
  ['**bold**',    '→ bold text'],
  ['*italic*',    '→ italic text'],
  ['[REDACTED]',  '→ inline stamp (also CLASSIFIED, PRIORITY, etc.)'],
];

const VISIBILITY_OPTIONS = [
  { value: 'public',          label: 'Public'        },
  { value: 'role:apprentice', label: 'Apprentice+'   },
  { value: 'role:lord',       label: 'Lord+'         },
  { value: 'role:darth',      label: 'Darth only'    },
];

const STATUS_OPTIONS = ['pending', 'active', 'complete', 'failed'];

export default function TrialEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useTitle('Edit Trial', 'sanctum');

  const [trial, setTrial]           = useState(null);
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [status, setStatus]         = useState('pending');
  const [assignedTo, setAssignedTo]         = useState('');
  const [creatorId, setCreatorId]           = useState(null);
  const [creatorChar, setCreatorChar]       = useState(null);
  const [assignedToChar, setAssignedToChar] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');
  const [deleting, setDeleting]     = useState(false);
  const [hintOpen, setHintOpen]     = useState(false);

  useEffect(() => {
    Promise.all([getTrial(id), getCharacters()])
      .then(([t, chars]) => {
        setTrial(t);
        setTitle(t.title || '');
        setDescription(t.description || '');
        setVisibility(t.visibility || 'public');
        setStatus(t.status || 'pending');
        setAssignedTo(t.assigned_to || '');
        setCreatorId(t.creator_character_id || null);
        if (t.creator_character_id && t.creator_name) {
          setCreatorChar({ id: t.creator_character_id, character_name: t.creator_name, image_url: t.creator_image_url, username: '' });
        }
        if (t.assigned_to) {
          const c = chars.find(ch => ch.user_id === t.assigned_to);
          if (c) setAssignedToChar(c);
        }
      })
      .catch(() => navigate('/trials'));
  }, [id]);

  const save = useCallback(async (publishFlag) => {
    setSaving(true);
    setMsg('');
    try {
      const patch = { title, description, visibility, status, creator_character_id: creatorId };
      if (assignedTo) patch.assigned_to = assignedTo;
      if (publishFlag !== undefined) patch.is_published = publishFlag;
      const updated = await updateTrial(id, patch);
      setTrial(updated);
      setMsg(publishFlag ? 'Published.' : 'Saved.');
      if (publishFlag) setTimeout(() => navigate('/trials'), 800);
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }, [id, title, description, visibility, status, assignedTo, creatorId]);

  async function handleDelete() {
    if (!confirm('Delete this trial? This cannot be undone.')) return;
    try {
      await deleteTrial(id);
      navigate('/trials');
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Delete failed.');
    }
  }

  if (!trial) return <div className="s-container s-main" style={{ color: 'var(--dim)', fontSize: '0.8rem' }}>Loading…</div>;

  const canPublish = !!creatorId;
  const isPublished = trial.is_published;

  return (
    <div className="s-container">
      <div className="draft-page">
        {/* Toolbar */}
        <div className="draft-toolbar">
          <button className="s-btn-ghost" onClick={() => navigate('/trials')}>← Trials</button>
          <span className={`draft-badge ${isPublished ? 'published' : 'draft'}`}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
          <div style={{ flex: 1 }} />
          {msg && <span className="draft-status">{msg}</span>}
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
          <button className="s-btn-ghost" style={{ color: 'var(--dim)' }} onClick={handleDelete}>
            Discard
          </button>
        </div>

        {/* Title */}
        <input
          className="draft-title-input"
          placeholder="Trial title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

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

        {/* Status + Visibility */}
        <div className="draft-2col">
          <div className="draft-field">
            <div className="draft-field-label">Status</div>
            <select className="draft-select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="draft-field">
            <div className="draft-field-label">Visibility</div>
            <select className="draft-select" value={visibility} onChange={e => setVisibility(e.target.value)}>
              {VISIBILITY_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Assigned To */}
        <div style={{ marginBottom: '1rem' }}>
          <CharacterPicker
            value={assignedToChar}
            onChange={uid => setAssignedTo(uid || '')}
            useUserId
            label="Assigned To"
          />
        </div>

        {/* Roll panel */}
        <RollPanel
          charId={creatorId}
          onInsert={text => setDescription(d => d ? d + '\n' + text : text)}
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

        {/* Description */}
        <div className="draft-field">
          <div className="draft-field-label">Description</div>
          <textarea
            className="s-textarea-report"
            style={{ minHeight: 'clamp(180px, 35vh, 280px)', width: '100%', boxSizing: 'border-box' }}
            placeholder="Describe the trial objectives, conditions, and lore…"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
