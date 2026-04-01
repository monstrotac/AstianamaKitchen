import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCharacter, getSkills, getTrials, createTrial, getReports, createReport, updateReport, getStories, createStory, deleteStory } from '../../api/sanctum';
import CharacterProfile from '../../components/sanctum/CharacterProfile';
import CharacterSheet from '../../components/sanctum/CharacterSheet';
import TrialCard from '../../components/sanctum/TrialCard';
import { useAuth } from '../../contexts/AuthContext';
import { useSanctum } from '../../contexts/SanctumContext';
import { useTitle } from '../../hooks/useTitle';

// ── Story body renderer ───────────────────────────────────────────────────────
const INLINE_STAMPS = ['CLASSIFIED','RESTRICTED','EYES ONLY','UNCLASSIFIED',
  'REDACTED','COMPROMISED','PRIORITY','URGENT','DECEASED','ACTIVE','TERMINATED','EXILED','ASCENDED','FALLEN'];
const INLINE_STAMP_RE = new RegExp(`\\[(${INLINE_STAMPS.join('|')})\\]`);
const STAMP_COLORS = {
  CLASSIFIED:'#cc4444',RESTRICTED:'#c9a227','EYES ONLY':'#9955cc',UNCLASSIFIED:'#5aaa6e',
  REDACTED:'#888',COMPROMISED:'#e06060',PRIORITY:'#c9a227',URGENT:'#cc4444',
  DECEASED:'#888',ACTIVE:'#5aaa6e',TERMINATED:'#cc4444',EXILED:'#888',ASCENDED:'#9955cc',FALLEN:'#cc4444',
};
function renderInline(text, key=0) {
  const parts=[]; let rest=text; let k=key;
  while(rest.length>0){
    const si=rest.search(INLINE_STAMP_RE), bi=rest.indexOf('**'), ii=rest.search(/(?<!\*)\*(?!\*)/);
    const cands=[si>=0?{idx:si,type:'stamp'}:null,bi>=0?{idx:bi,type:'bold'}:null,ii>=0?{idx:ii,type:'italic'}:null].filter(Boolean).sort((a,b)=>a.idx-b.idx);
    if(!cands.length){parts.push(<span key={k++}>{rest}</span>);break;}
    const{idx,type}=cands[0];
    if(idx>0)parts.push(<span key={k++}>{rest.slice(0,idx)}</span>);
    if(type==='stamp'){const m=rest.slice(idx).match(INLINE_STAMP_RE);const label=m[1];const color=STAMP_COLORS[label]||'var(--dim)';parts.push(<span key={k++} className="s-report-stamp" style={{color,borderColor:color}}>{label}</span>);rest=rest.slice(idx+m[0].length);}
    else if(type==='bold'){const end=rest.indexOf('**',idx+2);if(end<0){parts.push(<span key={k++}>{rest.slice(idx)}</span>);break;}parts.push(<strong key={k++}>{rest.slice(idx+2,end)}</strong>);rest=rest.slice(end+2);}
    else if(type==='italic'){const end=rest.slice(idx+1).search(/(?<!\*)\*(?!\*)/);if(end<0){parts.push(<span key={k++}>{rest.slice(idx)}</span>);break;}parts.push(<em key={k++}>{rest.slice(idx+1,idx+1+end)}</em>);rest=rest.slice(idx+1+end+1);}
  }
  return parts;
}
function StoryBodyRenderer({body}){
  const lines=body.split('\n');const output=[];let bullets=[];let k=0;
  function flush(){if(!bullets.length)return;output.push(<ul key={k++} className="s-report-list">{bullets.map((b,i)=><li key={i}>{renderInline(b)}</li>)}</ul>);bullets=[];}
  for(const line of lines){
    if(line.startsWith('# ')){flush();output.push(<div key={k++} className="s-report-h1">{renderInline(line.slice(2))}</div>);}
    else if(line.startsWith('## ')){flush();output.push(<div key={k++} className="s-report-h2">{renderInline(line.slice(3))}</div>);}
    else if(line==='---'){flush();output.push(<hr key={k++} className="s-report-rule"/>);}
    else if(line.startsWith('- ')){bullets.push(line.slice(2));}
    else if(line.trim()===''){flush();output.push(<div key={k++} className="s-report-gap"/>);}
    else{flush();output.push(<div key={k++} className="s-report-line">{renderInline(line)}</div>);}
  }
  flush();
  return <div className="s-report-formatted">{output}</div>;
}
function StoryCard({story, charId, username, isOwn, onDelete}){
  const [expanded,setExpanded]=useState(false);
  const isDraft=!story.is_published;
  const isEmpty=!story.title?.trim()&&!story.body?.trim();
  const isLong=story.body?.length>600;
  return(
    <div className="s-story-card-v2" style={isDraft?{opacity:0.6,borderStyle:'dashed'}:undefined}>
      <div className="s-story-card-header">
        <div className="s-story-card-title-row">
          <span className="s-story-card-title">{story.title||<em style={{opacity:0.35,fontStyle:'italic',fontFamily:'inherit'}}>Untitled</em>}</span>
          {isDraft&&<span className="draft-badge draft">Draft</span>}
        </div>
        <div className="s-story-card-meta">
          <span className="s-story-date">{new Date(story.created_at).toLocaleDateString()}</span>
          {isOwn&&<a className="s-btn small" href={`/characters/${charId}/stories/${story.id}/edit`}>Edit</a>}
          {isOwn&&<button className="s-btn small danger" onClick={()=>onDelete(story.id)}>Delete</button>}
          <a className="s-btn small" href={`/characters/${charId}/stories/${story.id}`}>View →</a>
        </div>
      </div>
      {isEmpty
        ?<div style={{color:'var(--dim)',fontStyle:'italic',fontSize:'0.78rem',opacity:0.5}}>Empty draft — click Edit to begin writing.</div>
        :<div className={`s-story-card-body${!expanded&&isLong?' s-story-card-body-clamped':''}`}>
          <StoryBodyRenderer body={story.body}/>
        </div>
      }
      {!isEmpty&&isLong&&(
        <button type="button" className="s-btn-ghost s-story-expand-btn" onClick={()=>setExpanded(p=>!p)}>
          {expanded?'▲ Show less':'▼ Read more'}
        </button>
      )}
      {!isEmpty&&(
        <div className="s-story-card-byline">◆ {username}</div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'profile',  label: 'Profile' },
  { id: 'sheet',    label: 'Character Sheet' },
  { id: 'trials',   label: 'Trials' },
  { id: 'reports',  label: 'Reports' },
  { id: 'stories',  label: 'Stories' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public',          label: 'Public' },
  { value: 'role:apprentice', label: 'Apprentice+' },
  { value: 'role:lord',       label: 'Lord+' },
];

export default function SpireCharacterPage() {
  const { charId }  = useParams();
  const navigate    = useNavigate();
  const { user, isMember, isSolstice, isAdmin } = useAuth();
  const { descriptions } = useSanctum();

  const [tab, setTab]         = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [char, setChar]       = useState(null);
  useTitle(char?.username);
  const [skills, setSkills]   = useState([]);
  const [trials, setTrials]   = useState([]);
  const [reports, setReports] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwn = isMember && char
    ? (user?.id === char.user_id || isSolstice || isAdmin)
    : false;

  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const loadChar = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([getCharacter(charId), getSkills(charId)]);
      setChar(c);
      setSkills(s);
    } catch (err) {
      if (err.response?.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [charId]);

  const loadTrials = useCallback(() => {
    if (!char?.user_id) return;
    getTrials({ assigned_to: char.user_id }).then(setTrials).catch(() => {});
  }, [char?.user_id]);

  const loadReports = useCallback(() => {
    if (!char?.username) return;
    getReports({ subject: char.username }).then(setReports).catch(() => {});
  }, [char?.username]);

  const loadStories = useCallback(() => {
    getStories(charId).then(setStories).catch(() => {});
  }, [charId]);

  useEffect(() => { loadChar(); }, [loadChar]);
  useEffect(() => { if (tab === 'trials')  loadTrials(); },  [tab, loadTrials]);
  useEffect(() => { if (tab === 'reports') loadReports(); }, [tab, loadReports]);
  useEffect(() => { if (tab === 'stories') loadStories(); }, [tab, loadStories]);

  async function handleCreateTrial() {
    setSaving(true);
    setFormError('');
    try {
      const trial = await createTrial({ assigned_to: char.user_id });
      navigate(`/trials/${trial.id}/edit`);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create trial');
      setSaving(false);
    }
  }

  async function handleCreateReport() {
    setSaving(true);
    setFormError('');
    try {
      const report = await createReport({});
      await updateReport(report.id, { subject: char.username, creator_character_id: char.id });
      navigate(`/reports/${report.id}/edit`);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create report');
      setSaving(false);
    }
  }

  async function handleCreateStory() {
    setSaving(true);
    setFormError('');
    try {
      const story = await createStory(charId, {});
      navigate(`/characters/${charId}/stories/${story.id}/edit`);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create story');
      setSaving(false);
    }
  }

  async function handleDeleteStory(storyId) {
    if (!window.confirm('Delete this story?')) return;
    try {
      await deleteStory(charId, storyId);
      loadStories();
    } catch {}
  }

  if (loading)  return <div className="s-empty">Loading…</div>;
  if (notFound) return <div className="s-empty">Character not found.</div>;
  if (!char)    return null;

  return (
    <div>
      {/* Tab nav */}
      <div className="s-tabs" style={{ marginBottom: '2rem' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`s-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => { setTab(t.id); setEditMode(false); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <CharacterProfile
          char={char}
          isOwn={isOwn}
          canManage={isAdmin || isSolstice}
          onSaved={loadChar}
        />
      )}

      {/* Character Sheet tab */}
      {tab === 'sheet' && (
        <div className="s-sheet-container">
          {isOwn && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="s-btn small" onClick={() => setEditMode(p => !p)}>
                {editMode ? '◆ View' : '✎ Edit Sheet'}
              </button>
            </div>
          )}
          <CharacterSheet
            char={char}
            skills={skills}
            editing={editMode}
            isOwn={isOwn}
            onSaved={() => { loadChar(); setEditMode(false); }}
            onSkillsChanged={loadChar}
            descriptions={descriptions}
          />
        </div>
      )}

      {/* Trials tab */}
      {tab === 'trials' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="s-section-title" style={{ margin: 0 }}>Trials — {char.character_name || char.username}</div>
            {isMember && (
              <button className="s-btn small" onClick={handleCreateTrial} disabled={saving}>
                {saving ? '…' : '+ New Trial'}
              </button>
            )}
          </div>
          {formError && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginBottom: '0.75rem' }}>{formError}</div>}
          {trials.length === 0
            ? <div className="s-empty">No trials assigned to this character.</div>
            : trials.map(t => <TrialCard key={t.id} trial={t} />)
          }
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="s-section-title" style={{ margin: 0 }}>Reports — {char.character_name || char.username}</div>
            {isMember && (
              <button className="s-btn small" onClick={handleCreateReport} disabled={saving}>
                {saving ? '…' : '◆ File Report'}
              </button>
            )}
          </div>
          {reports.length === 0
            ? <div className="s-empty">No field reports on record for this subject.</div>
            : reports.map(r => (
              <div key={r.id} className="s-report-card" style={{ marginBottom: '0.5rem' }}>
                <div className="s-report-header">
                  <div className="s-report-meta">
                    <span className="s-report-subject">◆ {r.subject}</span>
                    <span className="s-report-title">{r.title}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    {r.author_name && (
                      <span style={{ fontSize: '0.6rem', color: 'var(--dim)' }}>Filed by {r.author_name}</span>
                    )}
                    <span style={{ fontSize: '0.6rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                    <Link to={`/reports/${r.id}`} className="s-btn small" style={{ fontSize: '0.6rem' }}>View →</Link>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Stories tab */}
      {tab === 'stories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div className="s-section-title" style={{ margin: 0 }}>
              Stories — {char.character_name || char.username}
            </div>
            {isOwn && (
              <button className="s-btn small" onClick={handleCreateStory} disabled={saving}>
                {saving ? '…' : '+ New Story'}
              </button>
            )}
          </div>

          {formError && <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginBottom: '0.75rem' }}>{formError}</div>}

          {stories.length === 0
            ? <div className="s-empty">No stories written yet.</div>
            : stories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                charId={charId}
                username={char.username}
                isOwn={isOwn}
                onDelete={handleDeleteStory}
              />
            ))
          }
        </div>
      )}
    </div>
  );
}
