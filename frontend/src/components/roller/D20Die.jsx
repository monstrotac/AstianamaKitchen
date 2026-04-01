export default function D20Die({ display1, display2, spinning, onRoll }) {
  return (
    <div className={`d20${spinning ? ' spin' : ''}`} onClick={onRoll} style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
      <div className="d20-die-wrap">
        <svg viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="65,6 120,36 120,94 65,124 10,94 10,36"
                   fill="rgba(8,0,16,0.95)" stroke="#8b0000" strokeWidth="1.6"/>
          <polygon points="65,6 120,36 65,65"
                   fill="rgba(139,0,0,0.14)" stroke="rgba(220,20,60,0.38)" strokeWidth="0.6"/>
          <polygon points="65,6 10,36 65,65"
                   fill="rgba(80,0,0,0.1)" stroke="rgba(220,20,60,0.3)" strokeWidth="0.6"/>
          <polygon points="120,36 120,94 65,65"
                   fill="rgba(100,0,0,0.11)" stroke="rgba(220,20,60,0.3)" strokeWidth="0.6"/>
          <polygon points="10,36 10,94 65,65"
                   fill="rgba(60,0,0,0.09)" stroke="rgba(220,20,60,0.28)" strokeWidth="0.6"/>
          <polygon points="65,124 120,94 65,65"
                   fill="rgba(139,0,0,0.14)" stroke="rgba(220,20,60,0.35)" strokeWidth="0.6"/>
          <polygon points="65,124 10,94 65,65"
                   fill="rgba(80,0,0,0.1)" stroke="rgba(220,20,60,0.3)" strokeWidth="0.6"/>
          <circle cx="65" cy="65" r="22" fill="none" stroke="rgba(220,20,60,0.18)" strokeWidth="0.8"/>
        </svg>
        <div className="die-num">{display1}</div>
      </div>
      <div style={{ fontSize: '1.5rem', color: 'var(--dim)' }}>+</div>
      <div className="d20-die-wrap">
        <svg viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="65,6 120,36 120,94 65,124 10,94 10,36"
                   fill="rgba(8,0,16,0.95)" stroke="#8b0000" strokeWidth="1.6"/>
          <polygon points="65,6 120,36 65,65"
                   fill="rgba(139,0,0,0.14)" stroke="rgba(220,20,60,0.38)" strokeWidth="0.6"/>
          <polygon points="65,6 10,36 65,65"
                   fill="rgba(80,0,0,0.1)" stroke="rgba(220,20,60,0.3)" strokeWidth="0.6"/>
          <polygon points="120,36 120,94 65,65"
                   fill="rgba(100,0,0,0.11)" stroke="rgba(220,20,60,0.3)" strokeWidth="0.6"/>
          <polygon points="10,36 10,94 65,65"
                   fill="rgba(60,0,0,0.09)" stroke="rgba(220,20,60,0.28)" strokeWidth="0.6"/>
          <polygon points="65,124 120,94 65,65"
                   fill="rgba(139,0,0,0.14)" stroke="rgba(220,20,60,0.35)" strokeWidth="0.6"/>
          <polygon points="65,124 10,94 65,65"
                   fill="rgba(80,0,0,0.1)" stroke="rgba(220,20,60,0.3)" strokeWidth="0.6"/>
          <circle cx="65" cy="65" r="22" fill="none" stroke="rgba(220,20,60,0.18)" strokeWidth="0.8"/>
        </svg>
        <div className="die-num">{display2}</div>
      </div>
    </div>
  );
}
