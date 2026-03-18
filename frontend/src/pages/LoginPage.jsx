import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [codeName, setCode]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !pass) return;
    setLoading(true); setError('');
    try {
      await login(email, pass);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.response?.data?.error || 'ACCESS DENIED');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!email || !pass || !codeName) { setError('All fields required'); return; }
    setLoading(true); setError('');
    try {
      const res = await client.post('/auth/register', { email, password: pass, codeName });
      localStorage.setItem('grd_token', res.data.token);
      await login(email, pass);
      navigate('/', { replace: true });
    } catch (e) {
      setError(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  }

  const isRegister = mode === 'register';

  return (
    <div className="s-login-wrap">
      <div className="s-login-bg" aria-hidden="true" />

      <div className="s-login-panel">
        {/* Header */}
        <div className="s-login-header">
          <div className="s-login-sigil">◈</div>
          <div className="s-login-title">The Sanctum</div>
          <div className="s-login-subtitle">
            {isRegister ? 'Request Clearance' : 'Identify Yourself'}
          </div>
        </div>

        {/* Form */}
        <div className="s-login-form">
          {isRegister && (
            <div className="s-form-row">
              <label className="s-label">Code Name</label>
              <input
                className="s-input"
                value={codeName}
                onChange={e => setCode(e.target.value)}
                placeholder="Choose an operative name…"
                autoComplete="off"
              />
            </div>
          )}

          <div className="s-form-row">
            <label className="s-label">Email</label>
            <input
              className="s-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operative@order.local"
              autoComplete="email"
            />
          </div>

          <div className="s-form-row">
            <label className="s-label">Passphrase</label>
            <input
              className="s-input"
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••••••"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              onKeyDown={e => e.key === 'Enter' && (isRegister ? handleRegister() : handleLogin())}
            />
          </div>

          {error && (
            <div className="s-login-error">{error}</div>
          )}

          <button
            className="s-btn s-login-submit"
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            {loading
              ? (isRegister ? '… Processing …' : '… Authenticating …')
              : (isRegister ? '◆ Request Entry ◆' : '◆ Access the Sanctum ◆')}
          </button>
        </div>

        {/* Footer links */}
        <div className="s-login-footer">
          <button className="s-login-toggle" onClick={toggle}>
            {isRegister
              ? 'Already enlisted? Sign in.'
              : 'No clearance yet? Request access.'}
          </button>
          <Link to="/" className="s-login-toggle">← Return to the Sanctum</Link>
        </div>
      </div>
    </div>
  );
}
