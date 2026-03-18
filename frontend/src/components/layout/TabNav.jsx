export default function TabNav({ activeTab, onTabChange, isAdmin, isSolstice, isPatron }) {
  const tabs = [
    { id: 'comms',     label: 'Garden Channel' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'codex',     label: 'Codex of Thorns' },
    ...(!isPatron ? [{ id: 'profile', label: 'My Dossier' }] : []),
  ];
  if (isAdmin) tabs.push({ id: 'admin', label: 'Oversight' });

  return (
    <nav className="tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
