import ThemeSwitcher from '../ui/ThemeSwitcher';

export default function Header() {
  return (
    <header>
      <svg className="sigil" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="37" stroke="#8b0000" strokeWidth="0.8" opacity="0.4"/>
        <circle cx="40" cy="40" r="30" stroke="rgba(220,20,60,0.3)" strokeWidth="0.5"/>
        <polygon points="40,6 54,30 78,34 60,50 65,74 40,62 15,74 20,50 2,34 26,30"
                 stroke="#dc143c" strokeWidth="1" fill="rgba(139,0,0,0.18)"/>
        <polygon points="40,18 48,32 64,35 53,46 56,62 40,54 24,62 27,46 16,35 32,32"
                 stroke="rgba(220,20,60,0.5)" strokeWidth="0.6" fill="rgba(100,0,0,0.15)"/>
        <circle cx="40" cy="40" r="5" fill="#dc143c" opacity="0.85"/>
        <circle cx="40" cy="40" r="5" fill="none" stroke="#ff4466" strokeWidth="0.5"/>
        <line x1="40" y1="2" x2="40" y2="78" stroke="#8b0000" strokeWidth="0.4" opacity="0.3"/>
        <line x1="2" y1="40" x2="78" y2="40" stroke="#8b0000" strokeWidth="0.4" opacity="0.3"/>
      </svg>

      <h1 className="title" data-text="THE GARDEN">THE GARDEN</h1>
      <div className="subtitle">// the order — encrypted registry — blades of the solstice //</div>
      <div className="tagline">"The blade does not yield — it shows allegiance, but never bends the knee."</div>
      <ThemeSwitcher />
      <div className="divider"></div>
    </header>
  );
}
