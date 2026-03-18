import { useState, useEffect, useRef } from 'react';
import { getCharacters } from '../../api/sanctum';

export default function CharacterPicker({ value, onChange, label = 'Creator Character', useUserId = false }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [selected, setSelected] = useState(value || null);
  const [open, setOpen]         = useState(false);
  const timer = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const chars = await getCharacters({ search: query });
        setResults(chars);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  function pick(char) {
    setSelected(char);
    setQuery('');
    setResults([]);
    setOpen(false);
    onChange(useUserId ? char.user_id : char.id);
  }

  function clear() {
    setSelected(null);
    setQuery('');
    onChange(null);
  }

  return (
    <div className="cp-wrap">
      <div className="cp-label">{label}</div>

      {selected ? (
        <div className="cp-selected">
          {selected.image_url && (
            <img src={selected.image_url} alt="" className="cp-avatar" />
          )}
          <span className="cp-name">{selected.character_name}</span>
          <span className="cp-codename">({selected.code_name})</span>
          <button className="cp-clear" onClick={clear} title="Remove">✕</button>
        </div>
      ) : (
        <div className="cp-search-wrap" style={{ position: 'relative' }}>
          <input
            className="cp-input"
            placeholder="Search character name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            autoComplete="off"
          />
          {open && results.length > 0 && (
            <ul className="cp-dropdown">
              {results.map(char => (
                <li key={char.id} className="cp-option" onMouseDown={() => pick(char)}>
                  {char.image_url && <img src={char.image_url} alt="" className="cp-avatar-sm" />}
                  <span className="cp-opt-name">{char.character_name}</span>
                  <span className="cp-opt-code">({char.code_name})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
