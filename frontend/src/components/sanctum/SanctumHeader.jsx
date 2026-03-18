import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ModeSwitch from '../ui/ModeSwitch';

export default function SanctumHeader() {
  const { user, isAuthenticated, isSolstice, isAdmin, logout } = useAuth();

  return (
    <header className="s-header">
      <div className="s-header-top s-container">
        <div>
          <div className="s-title">THE SANCTUM</div>
          <div className="s-subtitle">Sith Order — Hierarchy &amp; Lineage Registry</div>
        </div>
        <div className="s-header-right">
          <a href="https://www.torkessh.com/" className="s-login-btn" style={{ opacity: 0.6 }}>
            ← Main Site
          </a>
          {isAuthenticated ? (
            <>
              <span className="s-user-display">{user?.codeName || user?.code_name}</span>
              <button className="s-login-btn" onClick={logout}>Disconnect</button>
            </>
          ) : (
            <Link to="/login" className="s-login-btn">Identify</Link>
          )}
          <ModeSwitch mode="sanctum" />
        </div>
      </div>
      <nav className="s-tabs s-container">
        <NavLink to="/"           end className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`}>Home</NavLink>
        <NavLink to="/characters"     className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`}>Characters</NavLink>
        <NavLink to="/trials"         className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`}>Trials</NavLink>
        <NavLink to="/stories"        className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`}>Chronicles</NavLink>
        <NavLink to="/reports"        className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`}>Reports</NavLink>
        {isAuthenticated && (
          <NavLink to="/profile"      className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`}>Profile</NavLink>
        )}
        {(isSolstice || isAdmin) && (
          <NavLink to="/admin" className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`}>Admin</NavLink>
        )}
      </nav>
    </header>
  );
}
