import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSanctum } from '../contexts/SanctumContext';
import client from '../api/client';
import { getSkills, getCharacters } from '../api/sanctum';
import ContractForm from '../components/contracts/ContractForm';
import ContractCard from '../components/contracts/ContractCard';
import Notification from '../components/ui/Notification';

export default function ContractsPage() {
  const { user, isSolstice, isAdmin, isPatron } = useAuth();
  const isPrivileged = isSolstice || isAdmin;
  const { activeChar } = useSanctum();
  const canCreate = isPrivileged || isPatron;
  const [contracts, setContracts]     = useState([]);
  const [gardeners, setGardeners]     = useState([]);
  const [spireChar, setSpireChar]     = useState(null);
  const [spireSkills, setSpireSkills] = useState([]);
  const notifRef = useRef();

  useEffect(() => {
    if (!user) return;
    loadContracts();
    if (isPrivileged) loadGardeners();
  }, [isPrivileged, user?.id]);

  useEffect(() => { loadSpireData(); }, [activeChar?.id]);

  async function loadContracts() {
    try {
      const res = await client.get('/contracts');
      setContracts(res.data);
    } catch(e) { console.error(e); }
  }

  async function loadSpireData() {
    if (!activeChar?.id) return;
    try {
      const skills = await getSkills(activeChar.id);
      setSpireChar(activeChar);
      setSpireSkills(skills);
    } catch(e) {}
  }

  async function loadGardeners() {
    try {
      const chars = await getCharacters();
      // Only characters with a faction assignment; value = user_id for assigned_to
      setGardeners(chars.filter(c => c.faction).map(c => ({
        id:            c.user_id,
        operativeName: c.operative_name || null,
        charName:      c.character_name || null,
        username:      c.username,
      })));
    } catch(e) {}
  }

  function handleCreated(c) {
    setContracts(prev => [c, ...prev]);
    notifRef.current?.show('Contract opened — the season has turned.');
  }

  function handleUpdate(updated) {
    setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  function handleDelete(id) {
    setContracts(prev => prev.filter(c => c.id !== id));
    notifRef.current?.show('Contract purged from the registry.');
  }

  const cardProps = { onUpdate: handleUpdate, onDelete: handleDelete, spireChar, spireSkills, gardeners };

  // Split: mine (assigned to me) vs full registry (for solstice/patron)
  const myContracts  = contracts.filter(c => c.assigned_to === user?.id);
  const allContracts = contracts; // solstice/patron see everything

  return (
    <div>
      <Notification ref={notifRef} />

      {canCreate && (
        <ContractForm onCreated={handleCreated} gardeners={isPrivileged ? gardeners : []} isPatron={isPatron} />
      )}

      {/* My Contracts — shown to regular operatives */}
      {!isPrivileged && !isPatron && (
        <div className="panel">
          <div className="panel-title">
            My Contracts
            {spireChar && (
              <span style={{ fontSize: '0.65rem', fontFamily: "'Share Tech Mono',monospace", color: 'var(--dim)', marginLeft: '1rem', letterSpacing: '0.05em' }}>
                Operative: {spireChar.username} · Prof +{({ acolyte:0, apprentice:2, lord:5, darth:7 }[spireChar.spire_rank] || 0)}
              </span>
            )}
          </div>
          <div className="ct-list">
            {myContracts.length === 0
              ? <div className="ct-empty">NO CONTRACTS ASSIGNED TO YOU</div>
              : myContracts.map(c => (
                <ContractCard key={c.id} contract={c} {...cardProps} />
              ))
            }
          </div>
        </div>
      )}

      {/* Full registry — solstice and patron see all */}
      {(isPrivileged || isPatron) && (
        <div className="panel">
          <div className="panel-title">Contract Registry</div>
          <div className="ct-list">
            {allContracts.length === 0
              ? <div className="ct-empty">NO CONTRACTS IN THE REGISTRY</div>
              : allContracts.map(c => (
                <ContractCard key={c.id} contract={c} {...cardProps} />
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
