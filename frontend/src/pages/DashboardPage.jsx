import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TabNav from '../components/layout/TabNav';
import { useTitle } from '../hooks/useTitle';
import GardenChannelPage from './GardenChannelPage';
import ContractsPage from './ContractsPage';
import CodexPage from './CodexPage';
import ProfilePage from './ProfilePage';
import AdminPage from './AdminPage';
const TAB_TITLE = { comms: 'Comms', contracts: 'Contracts', codex: 'Codex', profile: 'Profile', admin: 'Admin' };

export default function DashboardPage() {
  const { isAdmin, isSolstice, isPatron, isGuest, user } = useAuth();
  const [activeTab, setActiveTab] = useState('comms');
  useTitle(TAB_TITLE[activeTab] ?? null, 'garden');

  if (isGuest) {
    return (
      <div style={{display:'flex',justifyContent:'center',paddingTop:60}}>
        <div className="panel" style={{maxWidth:480,textAlign:'center'}}>
          <div className="panel-title">Clearance Pending</div>
          <p style={{color:'var(--dim)',fontSize:'0.82rem',lineHeight:1.7,margin:'16px 0'}}>
            Your request has been received, <span style={{color:'var(--crimson)'}}>{user?.codeName}</span>.<br/>
            The Solstice will review your clearance. You will be granted access once your faction is assigned.
          </p>
          <div style={{fontSize:'0.65rem',letterSpacing:'0.15em',color:'var(--dim)',opacity:0.5}}>
            ◆ AWAITING AUTHORISATION ◆
          </div>
        </div>
      </div>
    );
  }

  function renderTab() {
    switch (activeTab) {
      case 'comms':     return <GardenChannelPage />;
      case 'contracts': return <ContractsPage />;
      case 'codex':     return <CodexPage />;
      case 'profile':   return <ProfilePage />;
      case 'admin':     return isAdmin ? <AdminPage /> : null;
      default:          return null;
    }
  }

  return (
    <div>
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} isSolstice={isSolstice} isPatron={isPatron} />
      <div style={{animation:'fadein 0.4s ease'}}>
        {renderTab()}
      </div>
    </div>
  );
}
