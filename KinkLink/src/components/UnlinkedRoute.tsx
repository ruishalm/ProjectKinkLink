// src/components/UnlinkedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const UnlinkedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return <div>{t('loading')}</div>; // Ou um spinner/skeleton
  }

  // Se o usuário está autenticado E está vinculado, redireciona para o perfil (ou outra página)
  // pois esta rota é para usuários NÃO vinculados.
  if (user && user.linkedPartnerId) {
    console.log('[UnlinkedRoute] Usuário está vinculado. Redirecionando do UnlinkedRoute.');
    return <Navigate to="/profile" state={{ from: location }} replace />;
  }

  return <Outlet />; // Renderiza o conteúdo da rota se o usuário não estiver vinculado (ou não autenticado, dependendo da sua lógica de ProtectedRoute)
};

export default UnlinkedRoute;