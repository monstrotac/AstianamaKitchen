import { useState } from 'react';
import {
  FORCE_ATTUNEMENT_MIN, FORCE_ATTUNEMENT_MAX,
  WILLPOWER_MIN, WILLPOWER_MAX,
  DISCIPLINE_MIN, DISCIPLINE_MAX,
} from '../../utils/rollUtils';

const DISCIPLINES = [
  {
    key: 'control', label: 'Control', subtitle: 'Self-Control',
    description: 'The first doctrine, focusing on the ability to recognize the Force within oneself and manipulate one\'s own physical and mental state. Turns the Force inward for self-improvement and defense.',
    powers: [
      { name: 'Curato Salva', desc: 'Self-Healing — accelerating natural healing processes.' },
      { name: 'Tutaminis', desc: 'Energy Absorption — absorbing or deflecting energy such as blaster bolts or Force lightning.' },
      { name: 'Altus Sopor', desc: 'Force Invisibility/Focus — centering the mind, increasing focus, or hiding one\'s presence in the Force.' },
    ],
  },
  {
    key: 'sense', label: 'Sense', subtitle: 'Perception',
    description: 'Broadens the scope of Control abilities, allowing the user to feel the Force in their surroundings, lifeforms, and environment. Grants awareness of the surrounding world and the ability to see through the illusion of physical distance.',
    powers: [
      { name: 'Prima Vitae', desc: 'Life Detection — sensing other living things and their emotions.' },
      { name: 'Tactus Otium', desc: 'Force Sense/Battle Precognition — enhancing reflexes to block blaster bolts or sense an opponent\'s next move.' },
      { name: 'Telepathy', desc: 'Projected Telepathy — mentally communicating with others across distance.' },
    ],
  },
  {
    key: 'alter', label: 'Alter', subtitle: 'Environmental Manipulation',
    description: 'The third and most difficult doctrine. Involves manipulating the Force in the outside world, affecting objects, other beings, and the environment through sheer will.',
    powers: [
      { name: 'Telekinesis', desc: 'Force Push/Pull/Grip — moving objects or beings with the mind.' },
      { name: 'Affect Mind', desc: 'Mind Trick — overriding the thoughts and impulses of others.' },
      { name: 'Alter Environment', desc: 'Controlling natural surroundings — generating fog, altering temperatures, or manipulating terrain.' },
    ],
  },
];

const DEFAULT_FORCE = {
  force_attunement: 0, willpower_score: 0,
  control: 0, sense: 0, alter_discipline: 0,
};

export default function ForcePanel({ force, editing = false, onChange, onRoll }) {
  const f = { ...DEFAULT_FORCE, ...force };
  const [expandedDisc, setExpandedDisc] = useState(null);

  function change(field, delta, min, max) {
    const cur = f[field];
    const next = cur + delta;
    if (next < min || next > max) return;
    onChange?.({ ...f, [field]: next });
  }

  function handleDisciplineRoll(label, rating) {
    if (editing || !onRoll) return;
    const modifier = f.force_attunement + rating;
    onRoll(`Force: ${label}`, modifier);
  }

  // Map DB field names for disciplines
  const disciplineField = key => key === 'alter' ? 'alter_discipline' : key;

  return (
    <div className="s-force-panel">
      {/* Top row: Force Attunement + Willpower + Force Points */}
      <div className="s-force-top-row">
        {/* Force Attunement */}
        <div className="s-force-stat-cell">
          <div className="s-force-stat-label">Force Attunement</div>
          {editing ? (
            <div className="s-force-stepper">
              <button
                type="button" className="s-btn small"
                onClick={() => change('force_attunement', -1, FORCE_ATTUNEMENT_MIN, FORCE_ATTUNEMENT_MAX)}
                disabled={f.force_attunement <= FORCE_ATTUNEMENT_MIN}
              >&minus;</button>
              <span className="s-force-stat-score">{f.force_attunement}</span>
              <button
                type="button" className="s-btn small"
                onClick={() => change('force_attunement', 1, FORCE_ATTUNEMENT_MIN, FORCE_ATTUNEMENT_MAX)}
                disabled={f.force_attunement >= FORCE_ATTUNEMENT_MAX}
              >+</button>
            </div>
          ) : (
            <div className="s-force-stat-score">{f.force_attunement}</div>
          )}
          <div className="s-force-stat-sub">0&ndash;{FORCE_ATTUNEMENT_MAX}</div>
        </div>

        {/* Willpower */}
        <div className="s-force-stat-cell">
          <div className="s-force-stat-label">Willpower</div>
          {editing ? (
            <div className="s-force-stepper">
              <button
                type="button" className="s-btn small"
                onClick={() => change('willpower_score', -1, WILLPOWER_MIN, WILLPOWER_MAX)}
                disabled={f.willpower_score <= WILLPOWER_MIN}
              >&minus;</button>
              <span className="s-force-stat-score">{f.willpower_score}</span>
              <button
                type="button" className="s-btn small"
                onClick={() => change('willpower_score', 1, WILLPOWER_MIN, WILLPOWER_MAX)}
                disabled={f.willpower_score >= WILLPOWER_MAX}
              >+</button>
            </div>
          ) : (
            <div className="s-force-stat-score">{f.willpower_score}</div>
          )}
          <div className="s-force-stat-sub">0&ndash;{WILLPOWER_MAX}</div>
        </div>

        {/* Force Points (derived, read-only) */}
        <div className="s-force-stat-cell">
          <div className="s-force-stat-label">Force Points</div>
          <div className="s-force-stat-score">{f.force_attunement}</div>
          <div className="s-force-stat-sub">FP = FA</div>
        </div>
      </div>

      {/* Disciplines */}
      <div>
        <div className="s-force-section-title">Force Disciplines</div>
        <div className="s-force-discipline-row">
          {DISCIPLINES.map(({ key, label, subtitle, description, powers }) => {
            const field = disciplineField(key);
            const rating = f[field];
            const clickable = !editing && !!onRoll;
            const isExpanded = expandedDisc === key;
            return (
              <div
                key={key}
                className={`s-force-discipline-cell${clickable ? ' s-force-discipline-clickable' : ''}`}
                onClick={() => handleDisciplineRoll(label, rating)}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={e => {
                  if (clickable && (e.key === 'Enter' || e.key === ' ')) handleDisciplineRoll(label, rating);
                }}
              >
                <div className="s-force-discipline-name">
                  {label}
                  <button
                    className="s-force-info-btn"
                    onClick={e => { e.stopPropagation(); setExpandedDisc(isExpanded ? null : key); }}
                    title={`About ${label}`}
                  >?</button>
                </div>
                {editing ? (
                  <div className="s-force-stepper">
                    <button
                      type="button" className="s-btn small"
                      onClick={e => { e.stopPropagation(); change(field, -1, DISCIPLINE_MIN, DISCIPLINE_MAX); }}
                      disabled={rating <= DISCIPLINE_MIN}
                    >&minus;</button>
                    <span className="s-force-discipline-score">{rating}</span>
                    <button
                      type="button" className="s-btn small"
                      onClick={e => { e.stopPropagation(); change(field, 1, DISCIPLINE_MIN, DISCIPLINE_MAX); }}
                      disabled={rating >= DISCIPLINE_MAX}
                    >+</button>
                  </div>
                ) : (
                  <div className="s-force-discipline-score">{rating}</div>
                )}
                {/* Dot indicators */}
                <div className="s-force-dots">
                  {Array.from({ length: DISCIPLINE_MAX }, (_, i) => (
                    <span key={i} className={`s-force-dot${i < rating ? ' s-force-dot-filled' : ''}`} />
                  ))}
                </div>
                {clickable && (
                  <div className="s-force-roll-hint">2d10 + {f.force_attunement + rating}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Expanded discipline description */}
        {expandedDisc && (() => {
          const disc = DISCIPLINES.find(d => d.key === expandedDisc);
          if (!disc) return null;
          return (
            <div className="s-force-desc-panel">
              <div className="s-force-desc-header">
                <span className="s-force-desc-title">{disc.label}</span>
                <span className="s-force-desc-subtitle">{disc.subtitle}</span>
              </div>
              <p className="s-force-desc-text">{disc.description}</p>
              <div className="s-force-desc-powers-title">Key Powers</div>
              <ul className="s-force-desc-powers">
                {disc.powers.map(p => (
                  <li key={p.name}>
                    <strong>{p.name}</strong>: {p.desc}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
