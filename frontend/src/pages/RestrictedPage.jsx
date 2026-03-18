import { Link } from 'react-router-dom';

export default function RestrictedPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '2rem', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.35em',
          color: 'var(--crimson)',
          opacity: 0.7,
          marginBottom: '1.5rem',
          textTransform: 'uppercase',
        }}>
          ◆ — Protocol Enforced — ◆
        </div>

        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
          letterSpacing: '0.2em',
          color: 'var(--crimson)',
          textShadow: '0 0 20px rgba(220,20,60,0.4)',
          marginBottom: '0.5rem',
          lineHeight: 1.3,
        }}>
          PERMISSION DENIED<br/>IDENTITY REFUSED
        </div>

        <div style={{
          width: 60,
          height: 1,
          background: 'var(--crimson)',
          opacity: 0.4,
          margin: '1.5rem auto',
        }} />

        <p style={{
          fontSize: '0.82rem',
          lineHeight: 1.8,
          color: 'var(--dim)',
          letterSpacing: '0.06em',
          marginBottom: '0.75rem',
        }}>
          NO RECOGNISED OPERATIVE ON FILE.
        </p>
        <p style={{
          fontSize: '0.78rem',
          lineHeight: 1.8,
          color: 'var(--dim)',
          letterSpacing: '0.06em',
          marginBottom: '0.75rem',
        }}>
          The Garden does not acknowledge unregistered identities.<br/>
          Establish your presence in the Sanctum before requesting entry.
        </p>
        <p style={{
          fontSize: '0.72rem',
          lineHeight: 1.8,
          color: 'var(--dim)',
          opacity: 0.6,
          letterSpacing: '0.06em',
        }}>
          This intrusion has been logged.
        </p>

        <div style={{
          width: 60,
          height: 1,
          background: 'var(--crimson)',
          opacity: 0.4,
          margin: '1.5rem auto',
        }} />

        <Link to="/" style={{
          display: 'inline-block',
          border: '1px solid rgba(220,20,60,0.3)',
          color: 'var(--dim)',
          padding: '0.5rem 1.2rem',
          fontFamily: 'Orbitron, monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.15em',
          textDecoration: 'none',
          transition: 'border-color 0.2s, color 0.2s',
        }}
          onMouseEnter={e => { e.target.style.borderColor = 'var(--crimson)'; e.target.style.color = 'var(--crimson)'; }}
          onMouseLeave={e => { e.target.style.borderColor = 'rgba(220,20,60,0.3)'; e.target.style.color = 'var(--dim)'; }}
        >
          ← Return to The Sanctum
        </Link>
      </div>
    </div>
  );
}
