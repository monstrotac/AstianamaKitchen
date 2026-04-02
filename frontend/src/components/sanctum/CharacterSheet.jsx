import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { updateCharacter, getCombatAbilities } from '../../api/sanctum';
import { ATTRS, ATTR_LABELS, ATTRIBUTE_FULL_NAMES, computeHealth, computeXPSpent } from '../../utils/rollUtils';
import AttributeBlock from './AttributeBlock';
import CombatPanel from './CombatPanel';
import ForcePanel from './ForcePanel';
import SkillList from './SkillList';
import ImageUpload from './ImageUpload';
import RankBadge from './RankBadge';
import QuickRoll from './QuickRoll';
import CombatRulesModal from './CombatRulesModal';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace('/api', '');

const SilhouetteSVG = () => (
  <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'currentColor' }}>
    <ellipse cx="50" cy="35" rx="20" ry="22" fill="currentColor" />
    <path d="M20 140 Q20 80 50 75 Q80 80 80 140Z" fill="currentColor" />
  </svg>
);

function getAttrs(char) {
  return {
    str: char.str ?? 0, dex: char.dex ?? 0, sta: char.sta ?? 0,
    cha: char.cha ?? 0, man: char.man ?? 0, app: char.app ?? 0,
    per: char.per ?? 0, int_score: char.int_score ?? 0, wit: char.wit ?? 0,
  };
}

function getForce(char) {
  return {
    force_attunement: char.force_attunement || 0,
    willpower_score: char.willpower_score || 0,
    control: char.control || 0,
    sense: char.sense || 0,
    alter_discipline: char.alter_discipline || 0,
  };
}

export default function CharacterSheet({ char, skills, editing = false, isOwn = false, onSaved, onSkillsChanged, descriptions = [] }) {
  const [draft, setDraft]       = useState({ ...char });
  const [attrs, setAttrs]       = useState(() => getAttrs(char));
  const [force, setForce]       = useState(() => getForce(char));
  const [armor, setArmor]       = useState(char.armor || 'unarmored');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [activeRoll, setActiveRoll]   = useState(null);
  const [hpExpanded, setHpExpanded]   = useState(false);
  const [showRules, setShowRules]     = useState(false);
  const [combatAbilities, setCombatAbilities] = useState([]);
  const imageUrl = draft.image_url ? `${API_BASE}${draft.image_url}` : null;

  useEffect(() => {
    setDraft({ ...char });
    setAttrs(getAttrs(char));
    setForce(getForce(char));
    setArmor(char.armor || 'unarmored');
  }, [char]);

  useEffect(() => { if (editing) setActiveRoll(null); }, [editing]);

  useEffect(() => {
    getCombatAbilities().then(setCombatAbilities).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const xpSpent = computeXPSpent(attrs, skills);
      await updateCharacter(char.id, { spent_xp: xpSpent, ...attrs, ...force, armor });
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function openAttrRoll(attrKey, mod) {
    setActiveRoll({ label: `${ATTR_LABELS[attrKey]} Check`, modifier: mod });
  }

  function openSkillRoll(sk) {
    const attrMod   = attrs[sk.attribute] ?? 0;
    const skillRank = sk.rank ?? 0;
    setActiveRoll({ label: sk.skill_name, modifier: attrMod + skillRank * 2 });
  }

  function openCombatRoll(label, modifier, attributeOptions, isCombatRoll) {
    setActiveRoll({ label, modifier, attributeOptions, isCombatRoll });
  }

  function openForceRoll(label, modifier) {
    setActiveRoll({ label, modifier });
  }

  const canRoll  = isOwn && !editing;
  const health   = computeHealth(attrs, skills);
  const xpSpent  = computeXPSpent(attrs, skills);

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
            imageUrl ? <img src={imageUrl} alt={char.username} /> : <SilhouetteSVG />
          )}
        </div>

        <div className="s-sheet-meta">
          <div className="s-sheet-name">{char.character_name || char.username}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.55, fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            by {char.username}
          </div>

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
              {char.master_character_name && (
                <div className="s-master-line">
                  Master: <Link to={`/characters/${char.master_character_id}`}>{char.master_character_name}</Link>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                <div className="s-derived-stat">
                  <span className="s-derived-label">HP</span>
                  <span className="s-derived-value">{health}</span>
                </div>
                <button className="s-expand-btn" onClick={() => setHpExpanded(p => !p)}>
                  {hpExpanded ? '▴' : '▾'}
                </button>
              </div>
              {hpExpanded && (
                <div className="s-desc-panel" style={{ marginTop: '0.5rem' }}>
                  <span className="s-desc-panel-label">Hit Points</span>
                  2 + STA ({attrs.sta ?? 0}) + Resilience rank = {health}. A guideline for resilience, not a strict counter to track in roleplay.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sheet body */}
      {/* Sheet body — single column stacked layout */}
      <div className="s-sheet-body">
        <div className="s-sheet-card">
          <div className="s-section-title">Attributes</div>
          <AttributeBlock
            attrs={attrs}
            editing={editing}
            onChange={editing ? setAttrs : undefined}
            onRoll={canRoll ? openAttrRoll : undefined}
            descriptions={descriptions}
          />
        </div>

        <div className="s-sheet-card">
          <div className="s-section-title-row">
            <div className="s-section-title">Combat</div>
            <button className="s-rules-help-btn" onClick={() => setShowRules(true)} title="Combat Rules">?</button>
          </div>
          <CombatPanel
            attrs={attrs}
            skills={skills}
            combatAbilities={combatAbilities}
            armor={armor}
            editing={editing}
            onArmorChange={editing ? setArmor : undefined}
            onRoll={canRoll ? openCombatRoll : undefined}
          />
        </div>

        <div className="s-sheet-card">
          <div className="s-section-title">The Force</div>
          <ForcePanel
            force={force}
            editing={editing}
            onChange={editing ? setForce : undefined}
            onRoll={canRoll ? openForceRoll : undefined}
          />
        </div>

        <div className="s-sheet-card">
          <div className="s-section-title">Skills</div>
          <SkillList
            charId={char.id}
            skills={skills}
            editing={editing}
            onChanged={onSkillsChanged}
            onRoll={canRoll ? openSkillRoll : null}
            attrs={attrs}
            descriptions={descriptions}
          />
        </div>

        {editing && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="s-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving\u2026' : 'Save changes'}
            </button>
            {error && <span style={{ color: '#e74c3c', fontSize: '0.75rem' }}>{error}</span>}
          </div>
        )}
      </div>

      {activeRoll && (
        <QuickRoll
          label={activeRoll.label}
          modifier={activeRoll.modifier}
          attributeOptions={activeRoll.attributeOptions}
          isCombatRoll={activeRoll.isCombatRoll}
          onClose={() => setActiveRoll(null)}
        />
      )}

      {showRules && <CombatRulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
