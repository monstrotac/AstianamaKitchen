import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCharacters, updateCharacter } from '../api/sanctum';

const FACTION_OPTIONS = [
  { value: '',         label: '— No faction —' },
  { value: 'scythes',  label: 'The Scythes' },
  { value: 'veil',     label: 'The Veil' },
  { value: 'solstice', label: 'The Solstice' },
  { value: 'patron',   label: 'The Patron' },
];

const RANK_LABEL = { acolyte: 'Acolyte', apprentice: 'Apprentice', lord: 'Lord', darth: 'Darth' };

function CharacterFactionRow({ char, onUpdated }) {
  const [faction, setFaction] = useState(char.faction || '');
  const [saving, setSaving]   = useState(false);
  const dirty = faction !== (char.faction || '');

  async function save() {
    setSaving(true);
    try {
      await updateCharacter(char.id, { faction: faction || null });
      onUpdated(char.id, faction || null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="s-admin-row" style={{ alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div className="s-admin-name">
          <Link to={`/characters/${char.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {char.username}
          </Link>
        </div>
        <div className="s-admin-meta">
          {RANK_LABEL[char.spire_rank] || char.spire_rank || 'Acolyte'}
          {char.species ? ` · ${char.species}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          className="s-select"
          style={{ fontSize: '0.68rem', padding: '0.28rem 0.5rem' }}
          value={faction}
          onChange={e => setFaction(e.target.value)}
        >
          {FACTION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {dirty && (
          <button className="s-btn small" onClick={save} disabled={saving}>
            {saving ? '…' : '◆ Assign'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SolsticeRosterPage() {
  const [chars, setChars]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCharacters()
      .then(setChars)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleUpdated(charId, newFaction) {
    setChars(prev => prev.map(c => c.id === charId ? { ...c, faction: newFaction } : c));
  }

  const FACTION_ORDER = ['scythes', 'veil', 'solstice', 'patron', null];
  const grouped = FACTION_ORDER.map(f => ({
    faction: f,
    label: FACTION_OPTIONS.find(o => (o.value || null) === f)?.label || '— No faction —',
    members: chars.filter(c => (c.faction || null) === f),
  })).filter(g => g.members.length > 0);

  if (loading) return <div className="s-empty">Loading roster…</div>;

  return (
    <div>
      <div className="s-section-title" style={{ marginBottom: '0.5rem' }}>Operative Roster</div>
      <div style={{ fontSize: '0.68rem', color: 'var(--dim)', fontFamily: 'Share Tech Mono, monospace', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Assign a faction to each operative to grant them their role within the Order.
        Operatives without a faction have access to the Garden but no designated unit.
      </div>

      <div className="s-panel">
        {chars.length === 0
          ? <div className="s-empty">No characters found.</div>
          : grouped.map(g => (
            <div key={g.faction || 'none'} style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '0.55rem', fontFamily: 'Orbitron, monospace', letterSpacing: '0.2em',
                color: 'var(--dim)', textTransform: 'uppercase', marginBottom: '0.5rem',
                paddingBottom: '0.35rem', borderBottom: '1px solid var(--border-sub)',
              }}>
                {g.label}
              </div>
              {g.members.map(c => (
                <CharacterFactionRow key={c.id} char={c} onUpdated={handleUpdated} />
              ))}
            </div>
          ))
        }
      </div>
    </div>
  );
}
