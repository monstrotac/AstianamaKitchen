import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateCharacter } from '../../api/sanctum';
import { ATTRS, ATTR_LABELS, SAVING_THROWS, computeHealth, computeXPSpent } from '../../utils/rollUtils';

const ATTR_FULL = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int_score: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};
import AttributeBlock from './AttributeBlock';
import SkillList from './SkillList';
import ImageUpload from './ImageUpload';
import RankBadge from './RankBadge';
import QuickRoll from './QuickRoll';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');

const SilhouetteSVG = () => (
  <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'currentColor' }}>
    <ellipse cx="50" cy="35" rx="20" ry="22" fill="currentColor" />
    <path d="M20 140 Q20 80 50 75 Q80 80 80 140Z" fill="currentColor" />
  </svg>
);

function getAttrs(char) {
  return {
    str: char.str || 1, dex: char.dex || 1, con: char.con || 1,
    int_score: char.int_score || 1, wis: char.wis || 1, cha: char.cha || 1,
  };
}

export default function CharacterSheet({ char, skills, editing = false, isOwn = false, onSaved, onSkillsChanged, descriptions = [] }) {
  const [draft, setDraft]       = useState({ ...char });
  const [attrs, setAttrs]       = useState(() => getAttrs(char));
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [activeRoll, setActiveRoll]   = useState(null);
  const [expandedAttr, setExpandedAttr] = useState(null);
  const [hpExpanded, setHpExpanded]   = useState(false);
  const imageUrl = draft.image_url ? `${API_BASE}${draft.image_url}` : null;

  useEffect(() => {
    setDraft({ ...char });
    setAttrs(getAttrs(char));
  }, [char]);

  useEffect(() => { if (editing) setActiveRoll(null); }, [editing]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const xpSpent = computeXPSpent(attrs, skills);
      await updateCharacter(char.id, { spent_xp: xpSpent, ...attrs });
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function openAttrRoll(attrKey) {
    const mod = attrs[attrKey] ?? 1;
    setActiveRoll({ label: `${ATTR_LABELS[attrKey]} Check`, modifier: mod });
  }

  function openSkillRoll(sk) {
    const attrMod   = attrs[sk.attribute] ?? 1;
    const skillRank = sk.rank ?? 0;
    setActiveRoll({ label: sk.skill_name, modifier: attrMod + skillRank });
  }

  function openSaveRoll(save) {
    const mod = attrs[save.attr] ?? 1;
    setActiveRoll({ label: `${save.label} Save`, modifier: mod });
  }

  const canRoll  = isOwn && !editing;
  const health   = computeHealth(attrs, skills);
  const xpSpent  = computeXPSpent(attrs, skills);
  const attrDescToShow = expandedAttr
    ? descriptions.find(d => d.type === 'attribute' && d.key === expandedAttr)
    : null;

  return (
    <div>
      {/* Portrait + meta */}
      <div className="s-sheet-header">
        <div className="s-sheet-portrait">
          {editing ? (
            <ImageUpload
              charId={char.id}
              currentUrl={char.image_url}
              onUploaded={url => setDraft(p => ({ ...p, image_url: url }))}
            />
          ) : (
            imageUrl ? <img src={imageUrl} alt={char.code_name} /> : <SilhouetteSVG />
          )}
        </div>

        <div className="s-sheet-meta">
          <div className="s-sheet-name">{char.code_name}</div>

          {!editing && (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <RankBadge rank={char.spire_rank} />
                {char.faction && (
                  <span className={`s-faction-badge s-faction-${char.faction}`}>
                    {{ scythes: 'The Scythes', veil: 'The Veil', solstice: 'The Solstice', patron: 'The Patron' }[char.faction] || char.faction}
                  </span>
                )}
              </div>
              {char.master_code_name && (
                <div className="s-master-line">
                  Master: <Link to={`/characters/${char.master_user_id}`}>{char.master_code_name}</Link>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                <div className="s-derived-stat">
                  <span className="s-derived-label">HP</span>
                  <span className="s-derived-value">{health}</span>
                </div>
                <button
                  className="s-expand-btn"
                  onClick={() => setHpExpanded(p => !p)}
                >
                  {hpExpanded ? '▴' : '▾'}
                </button>
              </div>
              {hpExpanded && (
                <div className="s-desc-panel" style={{ marginTop: '0.5rem' }}>
                  <span className="s-desc-panel-label">Hit Points</span>
                  2 + CON ({attrs.con ?? -2}) + Resilience rank = {health}. A guideline for resilience, not a strict counter to track in roleplay.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sheet body */}
      {editing ? (
        <div className="s-edit-panel">
          <div className={`s-sheet-body editing`}>
            <div>
              <div className="s-section-title">Attributes</div>
              <AttributeBlock
                attrs={attrs}
                editing={editing}
                onChange={setAttrs}
                descriptions={descriptions}
              />
            </div>

            <div>
              <div className="s-section-title">Skills</div>
              <SkillList
                charId={char.id}
                skills={skills}
                editing={editing}
                onChanged={onSkillsChanged}
                attrs={attrs}
                descriptions={descriptions}
              />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="s-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {error && <span style={{ color: '#e74c3c', fontSize: '0.75rem' }}>{error}</span>}
          </div>
        </div>
      ) : (
        <div className="s-sheet-body">
          {/* Left column */}
          <div className="s-sheet-left">
            <div className="s-section-title">Attributes</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {ATTRS.map(a => {
                const val  = attrs[a] ?? -2;
                const desc = descriptions.find(d => d.type === 'attribute' && d.key === a);
                return (
                  <div
                    key={a}
                    className="s-attr-cell-dnd"
                    onClick={canRoll ? () => openAttrRoll(a) : undefined}
                    title={canRoll ? `Roll ${ATTR_LABELS[a]} check` : undefined}
                    style={!canRoll ? { cursor: desc ? 'pointer' : 'default' } : undefined}
                  >
                    <div className="label">{ATTR_LABELS[a]}</div>
                    <div className="mod">{val >= 0 ? `+${val}` : val}</div>
                    <div className="score">{val}</div>
                    {canRoll && <div className="roll-hint">◆ roll</div>}
                    {desc && (
                      <button
                        className="s-expand-btn"
                        onClick={e => { e.stopPropagation(); setExpandedAttr(expandedAttr === a ? null : a); }}
                      >
                        {expandedAttr === a ? '▴' : '▾'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {attrDescToShow && (
              <div className="s-desc-panel" style={{ marginBottom: '1.25rem' }}>
                <span className="s-desc-panel-label">{ATTR_FULL[expandedAttr]}</span>
                {attrDescToShow.description}
              </div>
            )}

            {/* Saving Throws */}
            <div className="s-saves-block">
              <div className="s-section-title" style={{ fontSize: '0.55rem', marginBottom: '0.5rem' }}>Saving Throws</div>
              {SAVING_THROWS.map(save => {
                const mod  = attrs[save.attr] ?? -2;
                const desc = descriptions.find(d => d.type === 'save' && d.key === save.key);
                return (
                  <div
                    key={save.key}
                    className={`s-save-row${canRoll ? ' clickable' : ''}`}
                    onClick={canRoll ? () => openSaveRoll(save) : undefined}
                    title={desc?.description}
                  >
                    <span className="s-save-mod">{mod >= 0 ? `+${mod}` : mod}</span>
                    <div className="s-save-info">
                      <span className="s-save-label">{save.label}</span>
                      <span className="s-skill-attr-tag" data-attr={save.attr}>
                        {save.attr.replace('_score', '').toUpperCase()}
                      </span>
                    </div>
                    {canRoll && <span className="s-save-hint">◆ save</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column */}
          <div>
            <div className="s-section-title">Skills</div>
            <SkillList
              charId={char.id}
              skills={skills}
              editing={false}
              onChanged={onSkillsChanged}
              onRoll={canRoll ? openSkillRoll : null}
              attrs={attrs}
              descriptions={descriptions}
            />
          </div>
        </div>
      )}

      {activeRoll && (
        <div className="s-quick-roll-bar">
          <QuickRoll
            label={activeRoll.label}
            modifier={activeRoll.modifier}
            onClose={() => setActiveRoll(null)}
          />
        </div>
      )}
    </div>
  );
}
