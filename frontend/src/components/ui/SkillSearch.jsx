import { useState, useRef, useEffect } from 'react';

/**
 * Searchable skill picker.
 * Props:
 *   value        – current skill_name string
 *   onChange     – called with the new skill_name
 *   skills       – array of { skill_name, attribute }
 *   inputClass   – CSS class for the text input
 *   dropdownClass – optional extra CSS class for the dropdown container
 */
export default function SkillSearch({ value, onChange, skills = [], inputClass = '', dropdownClass = '' }) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef(null);

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = query.trim()
    ? skills.filter(s => s.skill_name.toLowerCase().includes(query.toLowerCase()))
    : skills;

  function select(skillName) {
    onChange(skillName);
    setOpen(false);
    setQuery('');
  }

  // Group by attribute for display
  const grouped = {};
  for (const s of filtered) {
    if (!grouped[s.attribute]) grouped[s.attribute] = [];
    grouped[s.attribute].push(s);
  }

  const ATTR_LABEL = { str: 'STR', dex: 'DEX', con: 'CON', int_score: 'INT', wis: 'WIS', cha: 'CHA' };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        className={inputClass}
        value={open ? query : value}
        placeholder={open ? 'Search skill…' : value || 'Select skill…'}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(''); setOpen(true); }}
        autoComplete="off"
      />
      {open && (
        <div className={`skill-search-dropdown ${dropdownClass}`}>
          {filtered.length === 0 ? (
            <div className="skill-search-empty">No skills match.</div>
          ) : (
            Object.entries(grouped).map(([attr, list]) => (
              <div key={attr}>
                <div className="skill-search-group-label">{ATTR_LABEL[attr] || attr}</div>
                {list.map(s => (
                  <div
                    key={s.skill_name}
                    className={`skill-search-option${s.skill_name === value ? ' selected' : ''}`}
                    onMouseDown={() => select(s.skill_name)}
                  >
                    {s.skill_name}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
