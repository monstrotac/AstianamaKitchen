import { useState, useEffect, useMemo } from 'react';
import { getCharacters } from '../../api/sanctum';
import CharacterCard from '../../components/sanctum/CharacterCard';
import { useTitle } from '../../hooks/useTitle';

const RANKS    = ['', 'acolyte', 'apprentice', 'lord', 'darth'];
const PAGE_SIZE = 12;

function Pagination({ page, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="s-pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)}>← Prev</button>
      <span>{page} / {total}</span>
      <button disabled={page === total} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

export default function SpireCharactersPage() {
  useTitle('Characters');
  const [characters, setCharacters] = useState([]);
  const [search, setSearch]         = useState('');
  const [rankFilter, setRankFilter] = useState('');
  const [page, setPage]             = useState(1);

  useEffect(() => {
    getCharacters().then(setCharacters).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return characters.filter(c => {
      const matchRank   = !rankFilter || c.spire_rank === rankFilter;
      const matchSearch = !search
        || c.character_name?.toLowerCase().includes(search.toLowerCase())
        || c.username?.toLowerCase().includes(search.toLowerCase())
        || c.species?.toLowerCase().includes(search.toLowerCase())
        || c.status_name?.toLowerCase().includes(search.toLowerCase());
      return matchRank && matchSearch;
    });
  }, [characters, search, rankFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilterChange(fn) {
    fn();
    setPage(1);
  }

  return (
    <div>
      <div className="s-section-title">Characters</div>

      <div className="s-search-row">
        <input
          className="s-input"
          placeholder="Search by name, species…"
          value={search}
          onChange={e => handleFilterChange(() => setSearch(e.target.value))}
        />
        <select
          className="s-select"
          value={rankFilter}
          onChange={e => handleFilterChange(() => setRankFilter(e.target.value))}
        >
          <option value="">All ranks</option>
          {RANKS.filter(Boolean).map(r => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>

      {paginated.length === 0
        ? <div className="s-empty">No characters found.</div>
        : (
          <div className="s-char-grid">
            {paginated.map(char => <CharacterCard key={char.id} char={char} />)}
          </div>
        )
      }

      <Pagination page={page} total={totalPages} onChange={setPage} />
    </div>
  );
}
