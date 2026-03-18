import { Link } from 'react-router-dom';

export default function ModeSwitch({ mode }) {
  return (
    <Link
      to={mode === 'sanctum' ? '/garden' : '/'}
      className="mode-switch"
    >
      {mode === 'sanctum' ? '◆ The Garden' : '◆ The Sanctum'}
    </Link>
  );
}
