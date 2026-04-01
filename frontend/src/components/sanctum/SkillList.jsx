import { useState } from 'react';
import { upsertSkills } from '../../api/sanctum';
import { SKILL_LIST, ATTR_LABELS, ATTRIBUTE_FULL_NAMES } from '../../utils/rollUtils';

const ATTR_ORDER = ['str', 'dex', 'sta', 'cha', 'man', 'app', 'per', 'int_score', 'wit'];
const ATTR_FULL  = ATTRIBUTE_FULL_NAMES;

const RANK_TIERS = ['—', 'Novice', 'Trained', 'Skilled', 'Expert', 'Master'];

function RankTierBar({ current }) {
  return (
    <div className="s-rank-tier-bar">
      {[1, 2, 3, 4, 5].map(r => (
        <div key={r} className={`s-rank-tier-step${r === current ? ' active' : r < current ? ' filled' : ''}`}>
          <div className="s-rank-tier-dot">{r <= current ? '◆' : '◇'}</div>
          <div className="s-rank-tier-label">{RANK_TIERS[r]}</div>
        </div>
      ))}
    </div>
  );
}

export default function SkillList({ charId, skills, editing = false, onChanged, onRoll, attrs, descriptions = [] }) {
  const [saving, setSaving]       = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [search, setSearch]       = useState('');

  const merged = SKILL_LIST.map(def => {
    const saved = skills.find(s => s.skill_name === def.skill_name);
    return { ...def, rank: saved?.rank ?? 0 };
  });

  async function setRank(sk, newRank) {
    if (newRank < 0 || newRank > 5) return;
    setSaving(sk.skill_name);
    try {
      await upsertSkills(charId, [{ skill_name: sk.skill_name, attribute: sk.attribute, rank: newRank }]);
      onChanged?.();
    } finally {
      setSaving(null);
    }
  }

  function toggleGroup(attr) {
    setCollapsed(p => ({ ...p, [attr]: !p[attr] }));
  }

  function toggleExpand(name) {
    setExpanded(p => p === name ? null : name);
  }

  const query = search.trim().toLowerCase();
  const groups = ATTR_ORDER.map(attr => {
    const all = merged.filter(s => s.attribute === attr);
    const filtered = query
      ? all.filter(s => {
          const desc = descriptions.find(d => d.type === 'skill' && d.key === s.skill_name);
          return s.skill_name.toLowerCase().includes(query) ||
                 (desc?.description ?? '').toLowerCase().includes(query);
        })
      : all;
    return { attr, skills: filtered };
  }).filter(g => g.skills.length > 0);

  return (
    <div>
      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <input
          className="s-input"
          style={{ width: '100%', boxSizing: 'border-box', fontSize: '0.72rem', paddingRight: search ? '2rem' : undefined }}
          placeholder="Filter abilities…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer',
              fontSize: '0.8rem', padding: 0, lineHeight: 1,
            }}
          >✕</button>
        )}
      </div>

      {query && groups.length === 0 && (
        <div className="s-empty" style={{ fontSize: '0.75rem' }}>No abilities match "{search}".</div>
      )}

      {groups.map(({ attr, skills }) => {
        const isCollapsed = !query && collapsed[attr];

        return (
          <div key={attr} className="s-skill-group">
            <button className="s-skill-group-header" onClick={() => !query && toggleGroup(attr)}>
              <span className="s-skill-group-name">{ATTR_FULL[attr]}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`s-skill-attr-tag`} data-attr={attr}>{ATTR_LABELS[attr]}</span>
                {!query && <span style={{ fontSize: '0.6rem', color: 'var(--dim)' }}>{isCollapsed ? '▸' : '▾'}</span>}
              </div>
            </button>

            {!isCollapsed && (
              <div>
                {skills.map((sk) => {
                  const attrMod    = attrs ? (attrs[sk.attribute] ?? 0) : 0;
                  const total      = attrMod + sk.rank;
                  const isSaving   = saving === sk.skill_name;
                  const desc       = descriptions.find(d => d.type === 'skill' && d.key === sk.skill_name);
                  const matchesDesc = query && desc && desc.description.toLowerCase().includes(query)
                                   && !sk.skill_name.toLowerCase().includes(query);
                  const isExpanded = expanded === sk.skill_name || matchesDesc;

                  return (
                    <div key={sk.skill_name}>
                      <div
                        className={`s-skill-row${isExpanded ? ' s-skill-row-open' : ''}${desc ? ' s-skill-row-expandable' : ''}`}
                        onClick={() => desc && toggleExpand(sk.skill_name)}
                        role={desc ? 'button' : undefined}
                        tabIndex={desc ? 0 : undefined}
                        onKeyDown={e => {
                          if (desc && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleExpand(sk.skill_name); }
                        }}
                      >
                        {/* Bonus badge */}
                        <span className="s-skill-bonus">{total >= 0 ? `+${total}` : total}</span>

                        {/* Rank dots (view mode) */}
                        {!editing && (
                          <span className="s-skill-rank" title={`Rank ${sk.rank} — ${RANK_TIERS[sk.rank]}`}>
                            {'◆'.repeat(sk.rank)}{'◇'.repeat(5 - sk.rank)}
                          </span>
                        )}

                        {/* Skill name */}
                        <span className="s-skill-name">
                          {sk.skill_name}
                          {sk.skill_name === 'Resilience' && (
                            <span className="s-health-tag"> (+health)</span>
                          )}
                        </span>

                        {/* Edit mode: clickable dots */}
                        {editing && (
                          <span className="s-skill-edit-dots" onClick={e => e.stopPropagation()}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <button
                                key={i}
                                type="button"
                                className={`s-skill-edit-dot${i < sk.rank ? ' filled' : ' empty'}`}
                                onClick={() => setRank(sk, i + 1 === sk.rank ? 0 : i + 1)}
                                disabled={isSaving}
                                title={`${i + 1 === sk.rank ? 'Reset to 0' : `Set to ${i + 1}`} — ${RANK_TIERS[i + 1]}`}
                              >
                                {i < sk.rank ? '◆' : '◇'}
                              </button>
                            ))}
                          </span>
                        )}

                        {/* Roll button */}
                        {onRoll && !editing && (
                          <button
                            className="s-btn small s-skill-roll-btn"
                            onClick={e => { e.stopPropagation(); onRoll(sk); }}
                          >
                            ◆ Roll
                          </button>
                        )}

                        {/* Expand indicator */}
                        {desc ? (
                          <span className="s-expand-btn">
                            {isExpanded ? '▴' : '▾'}
                          </span>
                        ) : (
                          <span className="s-expand-btn" style={{ visibility: 'hidden', pointerEvents: 'none' }}>▾</span>
                        )}
                      </div>

                      {/* Expanded description + rank tier + rank flavor */}
                      {isExpanded && desc && (
                        <div className="s-skill-detail">
                          <p className="s-skill-detail-desc">{desc.description}</p>
                          {!editing && <RankTierBar current={sk.rank} />}
                          {(() => {
                            const rankDesc = desc.rank_descriptions?.find(rd => rd.rank === sk.rank);
                            return rankDesc ? (
                              <div className="s-rank-flavor">
                                <span className="s-rank-flavor-label">
                                  {sk.rank === 0 ? 'Untrained' : `Rank ${sk.rank} — ${rankDesc.label}`}
                                </span>
                                <span className="s-rank-flavor-desc">{rankDesc.description}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
