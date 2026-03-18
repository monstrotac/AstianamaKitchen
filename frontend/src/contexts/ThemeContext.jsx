import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'shadow',  label: 'Shadow',  color: '#dc143c' },
  { id: 'eclipse', label: 'Eclipse', color: '#00c8c8' },
  { id: 'cipher',  label: 'Cipher',  color: '#8b1a1a' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('grd_theme') || 'shadow'
  );

  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') === 'sanctum') return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('grd_theme', theme);
  }, [theme]);

  // Apply on mount — but never override if sanctum layout already owns the theme
  useEffect(() => {
    if (document.documentElement.getAttribute('data-theme') === 'sanctum') return;
    const saved = localStorage.getItem('grd_theme') || 'shadow';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
