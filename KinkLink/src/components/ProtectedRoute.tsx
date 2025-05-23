import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth(); // Usaremos isAuthenticated diretamente
  const location = useLocation();

  if (isLoading) {
    return <div>Carregando...</div>; // Ou um spinner/componente de loading
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" state={{ from: location }} replace />;
}

export default ProtectedRoute;