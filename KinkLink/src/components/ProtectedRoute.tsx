// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth(); // Usaremos isAuthenticated diretamente
  const location = useLocation();

  console.log('[ProtectedRoute] Avaliando rota:', location.pathname, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    console.log('[ProtectedRoute] Ainda carregando autenticação para', location.pathname);
    return <div>{t('protected_route_loading')}</div>; // Ou um spinner/componente de loading
  }

  if (!isAuthenticated) {
    // Usuário não autenticado, redireciona para login
    // Mantém o estado 'from' para redirecionar de volta após o login
    console.warn('[ProtectedRoute] Usuário NÃO AUTENTICADO. Redirecionando para /login. Tentativa de acesso a:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Renderiza as rotas filhas aninhadas
};

export default ProtectedRoute;
