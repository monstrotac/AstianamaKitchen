import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isSolstice, isAdmin, ready } = useAuth();

  if (!ready) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole === 'solstice' && !isSolstice && !isAdmin) return <Navigate to="/" replace />;

  return children;
}
