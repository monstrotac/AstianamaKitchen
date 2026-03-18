import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getMyCharacters, getSkills, getDescriptions, setActiveCharacter } from '../api/sanctum';

const SanctumContext = createContext(null);

const RANK_ORDER = ['acolyte', 'apprentice', 'lord', 'darth'];

export function SanctumProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [myChars, setMyChars]               = useState([]);
  const [activeCharId, setActiveCharId]     = useState(null);
  const [activeSkills, setActiveSkills]     = useState([]);
  const [descriptions, setDescriptions]     = useState([]);

  const loadMyChars = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setMyChars([]);
      setActiveCharId(null);
      return;
    }
    try {
      const { characters, active_character_id } = await getMyCharacters();
      setMyChars(characters);
      setActiveCharId(active_character_id);
    } catch {
      setMyChars([]);
      setActiveCharId(null);
    }
  }, [isAuthenticated, user?.id]);

  // Load descriptions once on mount — they're static/global
  useEffect(() => {
    getDescriptions().then(setDescriptions).catch(() => {});
  }, []);

  useEffect(() => { loadMyChars(); }, [loadMyChars]);

  const activeChar = myChars.find(c => c.id === activeCharId) || myChars[0] || null;

  // Keep activeSkills in sync with the active character
  useEffect(() => {
    if (!activeChar?.id) { setActiveSkills([]); return; }
    getSkills(activeChar.id).then(setActiveSkills).catch(() => setActiveSkills([]));
  }, [activeChar?.id]);
  const spireRank  = activeChar?.spire_rank || null;
  const rankIdx    = RANK_ORDER.indexOf(spireRank);
  const isLord     = rankIdx >= RANK_ORDER.indexOf('lord');
  const isDarth    = rankIdx >= RANK_ORDER.indexOf('darth');

  async function switchActiveChar(charId) {
    await setActiveCharacter(charId);
    setActiveCharId(charId);
  }

  // Legacy alias used in some pages
  const spireChar  = activeChar;
  const loadSpireChar = loadMyChars;

  return (
    <SanctumContext.Provider value={{
      myChars, activeChar, activeCharId, activeSkills, spireChar,
      spireRank, isLord, isDarth,
      loadMyChars, loadSpireChar, switchActiveChar,
      descriptions,
    }}>
      {children}
    </SanctumContext.Provider>
  );
}

export function useSanctum() {
  return useContext(SanctumContext);
}
