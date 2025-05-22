import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LinkedRouteProps {
  children: ReactNode;
}

function LinkedRoute({ children }: LinkedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Carregando...</div>; // Ou um spinner/componente de loading
  }

  if (!user) {
    // Se não estiver logado, redireciona para login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver logado, mas não vinculado, redireciona para a página de vinculação
  return user.linkedPartnerId ? <>{children}</> : <Navigate to="/link-couple" state={{ from: location }} replace />;
}

export default LinkedRoute;
