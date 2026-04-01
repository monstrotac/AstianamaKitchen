import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ModeSwitch from '../ui/ModeSwitch';

export default function SanctumHeader() {
  const { user, isAuthenticated, isSolstice, isAdmin, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

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
              <span className="s-user-display">{user?.username}</span>
              <button className="s-login-btn" onClick={logout}>Disconnect</button>
            </>
          ) : (
            <Link to="/login" className="s-login-btn">Identify</Link>
          )}
          <ModeSwitch mode="sanctum" />
        </div>
      </div>
      <div className="s-nav-bar s-container">
        <button className="s-hamburger" onClick={() => setNavOpen(o => !o)}>
          {navOpen ? '✕' : '☰'}
        </button>
        <nav className={`s-tabs${navOpen ? ' open' : ''}`}>
          <NavLink to="/"           end className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Home</NavLink>
          <NavLink to="/characters"     className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Characters</NavLink>
          <NavLink to="/trials"         className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Trials</NavLink>
          <NavLink to="/stories"        className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Chronicles</NavLink>
          <NavLink to="/reports"        className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Reports</NavLink>
          {isAuthenticated && (
            <NavLink to="/sessions"     className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Sessions</NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/profile"      className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Profile</NavLink>
          )}
          {(isSolstice || isAdmin) && (
            <NavLink to="/admin" className={({ isActive }) => `s-tab${isActive ? ' active' : ''}`} onClick={() => setNavOpen(false)}>Admin</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
