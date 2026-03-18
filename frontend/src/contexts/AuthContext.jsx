import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('grd_token');
    if (!token) { setReady(true); return; }
    client.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => localStorage.removeItem('grd_token'))
      .finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const res = await client.post('/auth/login', { email, password });
    localStorage.setItem('grd_token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem('grd_token');
    setUser(null);
  }

  // faction comes from the user's active character (returned by /auth/me)
  const role    = user?.role    || null;
  const faction = user?.faction || null;

  return (
    <AuthContext.Provider value={{
      user,
      ready,
      isAuthenticated: !!user,
      // Role-based
      isAdmin:  role === 'admin',
      isGuest:  role === 'guest',
      // Full member = authenticated and not a guest (can create content)
      isMember: !!user && role !== 'guest',
      // Garden access = authenticated non-guest with at least one character
      isGardener: !!user && role !== 'guest' && !!user.hasCharacter,
      // In-universe faction flags (derived from active character)
      isSolstice: faction === 'solstice',
      isPatron:   faction === 'patron',
      isScythes:  faction === 'scythes',
      isVeil:     faction === 'veil',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
