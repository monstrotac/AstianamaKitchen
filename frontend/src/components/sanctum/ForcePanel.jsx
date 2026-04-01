import {
  FORCE_ATTUNEMENT_MIN, FORCE_ATTUNEMENT_MAX,
  WILLPOWER_MIN, WILLPOWER_MAX,
  DISCIPLINE_MIN, DISCIPLINE_MAX,
} from '../../utils/rollUtils';

const DISCIPLINES = [
  { key: 'control', label: 'Control' },
  { key: 'sense',   label: 'Sense' },
  { key: 'alter',   label: 'Alter' },
];

const DEFAULT_FORCE = {
  force_attunement: 0, willpower_score: 0,
  control: 0, sense: 0, alter_discipline: 0,
};

export default function ForcePanel({ force, editing = false, onChange, onRoll }) {
  const f = { ...DEFAULT_FORCE, ...force };

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
          {DISCIPLINES.map(({ key, label }) => {
            const field = disciplineField(key);
            const rating = f[field];
            const clickable = !editing && !!onRoll;
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
                <div className="s-force-discipline-name">{label}</div>
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
      </div>
    </div>
  );
}
