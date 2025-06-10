// src/components/LinkedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const LinkedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return <div>{t('loading')}</div>; 
  }

  if (!user) {
    // Se não estiver logado (o ProtectedRoute já deve ter pego isso, mas é uma segurança extra),
    // redireciona para login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver logado, mas não vinculado, redireciona para a página de vinculação
  if (!user.linkedPartnerId) {
    return <Navigate to="/link-couple" state={{ from: location }} replace />;
  }

  return <Outlet />; // Renderiza as rotas filhas se estiver logado e vinculado
};

export default LinkedRoute;
