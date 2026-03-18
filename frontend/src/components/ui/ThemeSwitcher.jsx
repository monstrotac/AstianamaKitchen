import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { theme, setTheme, THEMES } = useTheme();

  return (
    <div style={{ display:'flex', gap:10, justifyContent:'center', alignItems:'center', marginTop:14 }}>
      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:'0.6rem', letterSpacing:'0.2em', color:'var(--dim)', textTransform:'uppercase' }}>
        Theme
      </span>
      {THEMES.map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => setTheme(t.id)}
          style={{
            width: 12, height: 12, borderRadius: '50%', padding: 0, cursor: 'pointer',
            border: t.id === theme ? '2px solid var(--text)' : '2px solid transparent',
            background: t.color,
            boxShadow: t.id === theme ? `0 0 7px ${t.color}` : 'none',
            transition: 'all 0.2s',
            outline: 'none',
          }}
        />
      ))}
    </div>
  );
}
