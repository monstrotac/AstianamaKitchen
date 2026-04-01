import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Starfield from './Starfield';
import Header from './Header';
import ModeSwitch from '../ui/ModeSwitch';
import RestrictedPage from '../../pages/RestrictedPage';

export default function GardenLayout() {
  const { isAuthenticated, isGardener } = useAuth();

  useEffect(() => {
    document.title = 'The Garden';
    return () => { document.title = 'House Torkessh Sanctum'; };
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isGardener)      return <RestrictedPage />;

  return (
    <>
      <Starfield />
      <div className="container">
        <div style={{ position: 'relative' }}>
          <Header />
          <div className="garden-mode-switch-wrap">
            <ModeSwitch mode="garden" />
          </div>
        </div>
        <Outlet />
        <footer>◆ THE GARDEN — THE ORDER — CHANNEL ENCRYPTED — ALL TRANSMISSIONS DISTORTED ◆</footer>
      </div>
    </>
  );
}
