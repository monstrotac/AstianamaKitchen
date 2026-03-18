import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import SanctumHeader from './SanctumHeader';

export default function SanctumLayout() {
  const { theme } = useTheme();

  // Apply sanctum theme on mount, restore garden theme on unmount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'sanctum');
    document.title = 'House Torkessh Sanctum';
    return () => {
      const saved = localStorage.getItem('grd_theme') || 'shadow';
      document.documentElement.setAttribute('data-theme', saved);
    };
  }, []);

  // Re-apply sanctum whenever ThemeContext tries to overwrite it
  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') !== 'sanctum') {
      document.documentElement.setAttribute('data-theme', 'sanctum');
    }
  }, [theme]);

  return (
    <div className="s-layout">
      <SanctumHeader />
      <main className="s-main">
        <div className="s-container">
          <Outlet />
        </div>
      </main>
      <footer className="s-footer">
        ◆ THE SANCTUM — SITH ORDER — ALL KNOWLEDGE RESTRICTED — ACCESS EARNED ◆
      </footer>
    </div>
  );
}
