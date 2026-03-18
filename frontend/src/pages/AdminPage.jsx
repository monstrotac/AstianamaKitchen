import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { getCharacters, getCharactersForUser, updateCharacter } from '../api/sanctum';
import Notification from '../components/ui/Notification';

const FACTION_LABEL = {
  veil:     'The Veil',
  scythes:  'The Scythes',
  solstice: 'The Solstice',
  patron:   'The Patron',
};

const FACTION_OPTIONS = [
  { value: '',         label: '— Remove from Garden —' },
  { value: 'scythes',  label: 'The Scythes' },
  { value: 'veil',     label: 'The Veil' },
  { value: 'solstice', label: 'The Solstice' },
  { value: 'patron',   label: 'The Patron' },
];

const FACTION_ORDER = ['solstice', 'scythes', 'veil', 'patron'];

const RANK_BADGE = {
  acolyte:    'ACO',
  apprentice: 'APP',
  lord:       'LRD',
  darth:      'RTH',
};

function CharacterRow({ char, onChange }) {
  const [opName, setOpName]       = useState(char.operative_name || '');
  const [faction, setFaction]     = useState(char.faction || '');
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [allChars, setAllChars]   = useState(null);
  const [loadingChars, setLoadingChars] = useState(false);

  async function toggleExpand() {
    if (!expanded && allChars === null) {
      setLoadingChars(true);
      try {
        const data = await getCharactersForUser(char.user_id);
        setAllChars(data);
      } catch(e) {} finally { setLoadingChars(false); }
    }
    setExpanded(p => !p);
  }

  async function saveOpName() {
    const trimmed = opName.trim();
    if (trimmed === (char.operative_name || '')) return;
    setSaving(true);
    try {
      await updateCharacter(char.id, { operative_name: trimmed || null });
      onChange(char.id, { operative_name: trimmed || null });
    } catch(e) {} finally { setSaving(false); }
  }

  async function saveFaction(val) {
    setFaction(val);
    try {
      await updateCharacter(char.id, { faction: val || null });
      onChange(char.id, { faction: val || null });
    } catch(e) { setFaction(char.faction || ''); }
  }

  return (
    <div>
    <div className="oversight-row">
      <div className="oversight-char-cell">
        <Link to={`/characters/${char.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          <span className="oversight-charname">{char.character_name || '—'}</span>
        </Link>
        {char.spire_rank && (
          <span className="oversight-rank-badge">{RANK_BADGE[char.spire_rank] || char.spire_rank}</span>
        )}
      </div>
      <div className="oversight-code-cell">
        <button
          onClick={toggleExpand}
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          {char.code_name}
          <span style={{ fontSize: '0.6rem', color: 'var(--dim)', opacity: 0.7 }}>{expanded ? '▴' : '▾'}</span>
        </button>
      </div>
      <div className="oversight-opname-cell">
        <input
          className="oversight-opname-input"
          value={opName}
          onChange={e => setOpName(e.target.value)}
          onBlur={saveOpName}
          onKeyDown={e => e.key === 'Enter' && e.target.blur()}
          placeholder="—"
        />
        {saving && <span className="oversight-saving">saving…</span>}
      </div>
      <div className="oversight-faction-cell">
        <select
          value={faction}
          onChange={e => saveFaction(e.target.value)}
          className="oversight-faction-select"
        >
          {FACTION_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
    {expanded && (
      <div style={{ background: 'rgba(0,0,0,0.2)', borderLeft: '2px solid var(--border)', margin: '0 0 0 1rem', padding: '0.5rem 0.75rem' }}>
        {loadingChars && <div style={{ fontSize: '0.72rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>Loading…</div>}
        {allChars && allChars.length === 0 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>No characters.</div>
        )}
        {allChars && allChars.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border-sub)', fontSize: '0.78rem' }}>
            <Link to={`/characters/${c.id}`} style={{ color: 'var(--text)', textDecoration: 'none', fontFamily: "'Cinzel',serif", flex: 1 }}>
              {c.character_name || '—'}
            </Link>
            {c.spire_rank && <span className="oversight-rank-badge">{RANK_BADGE[c.spire_rank] || c.spire_rank}</span>}
            {c.faction && <span style={{ fontSize: '0.65rem', color: 'var(--dim)', fontFamily: "'Share Tech Mono',monospace" }}>{FACTION_LABEL[c.faction] || c.faction}</span>}
          </div>
        ))}
      </div>
    )}
    </div>
  );
}

function GuestRow({ guest, onPromoted }) {
  const [saving, setSaving] = useState(false);

  async function promote() {
    setSaving(true);
    try {
      const res = await client.patch(`/users/${guest.id}`, { role: 'user' });
      onPromoted({ ...guest, ...res.data });
    } catch(e) {} finally { setSaving(false); }
  }

  return (
    <div className="oversight-guest-row">
      <div style={{ flex: 1 }}>
        <div className="oversight-codename-guest">{guest.codeName}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--dim)', opacity: 0.6, fontFamily: "'Share Tech Mono',monospace" }}>
          {guest.email} · registered {new Date(guest.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button
        className="ct-add-btn"
        style={{ margin: 0, padding: '5px 14px', fontSize: '0.72rem' }}
        onClick={promote}
        disabled={saving}
      >
        {saving ? '…' : '◆ Grant Clearance'}
      </button>
    </div>
  );
}

export default function AdminPage() {
  const [chars, setChars]   = useState([]);
  const [guests, setGuests] = useState([]);
  const notifRef = useRef();

  useEffect(() => {
    getCharacters().then(setChars).catch(() => {});
    client.get('/users').then(r => setGuests(r.data.filter(u => u.role === 'guest'))).catch(() => {});
  }, []);

  function handleCharChange(charId, patch) {
    setChars(prev => prev.map(c => c.id === charId ? { ...c, ...patch } : c));
  }

  function handlePromoted(updated) {
    setGuests(prev => prev.filter(g => g.id !== updated.id));
    notifRef.current?.show('Clearance granted.');
  }

  const grouped   = FACTION_ORDER
    .map(f => ({ faction: f, label: FACTION_LABEL[f], rows: chars.filter(c => c.faction === f) }))
    .filter(g => g.rows.length > 0);
  const unassigned = chars.filter(c => !c.faction);

  const headerRow = (
    <div className="oversight-header">
      <div className="oversight-char-cell">Character</div>
      <div className="oversight-code-cell">Username</div>
      <div className="oversight-opname-cell">Operative Name</div>
      <div className="oversight-faction-cell">Faction</div>
    </div>
  );

  return (
    <div>
      <Notification ref={notifRef} />

      {guests.length > 0 && (
        <div className="panel">
          <div className="panel-title">Pending Clearance</div>
          {guests.map(g => (
            <GuestRow key={g.id} guest={g} onPromoted={handlePromoted} />
          ))}
        </div>
      )}

      {grouped.map(({ faction, label, rows }) => (
        <div className="panel" key={faction}>
          <div className="panel-title">{label}</div>
          {headerRow}
          {rows.map(c => (
            <CharacterRow key={c.id} char={c} onChange={handleCharChange} />
          ))}
        </div>
      ))}

      {unassigned.length > 0 && (
        <div className="panel">
          <div className="panel-title" style={{ color: 'var(--dim)' }}>Unassigned</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--dim)', opacity: 0.65, fontFamily: "'Share Tech Mono',monospace", marginBottom: '0.75rem' }}>
            Characters without a faction — assign one to include them in the Order.
          </div>
          {headerRow}
          {unassigned.map(c => (
            <CharacterRow key={c.id} char={c} onChange={handleCharChange} />
          ))}
        </div>
      )}

      {chars.length === 0 && guests.length === 0 && (
        <div className="panel">
          <div className="ct-empty">NO CHARACTERS REGISTERED</div>
        </div>
      )}
    </div>
  );
}
