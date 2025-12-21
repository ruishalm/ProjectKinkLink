// src/components/LinkedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const LinkedRoute: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>{t('linked_route_loading')}</div>; // Ou um spinner/componente de loading
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
