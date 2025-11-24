// src/components/LinkedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LinkedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Carregando...</div>; // Ou um spinner/componente de loading
  }

  if (!user) {
    // Se não estiver logado (o ProtectedRoute já deve ter pego isso, mas é uma segurança extra),
    // redireciona para login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver logado, mas não vinculado, redireciona para a página de vinculação
  if (!user.coupleId) {
    return <Navigate to="/link-couple" state={{ from: location }} replace />;
  }

  return <Outlet />; // Renderiza as rotas filhas se estiver logado e vinculado
};

export default LinkedRoute;
