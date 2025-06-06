// src/components/AdminRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Carregando autenticação...</div>; // Ou um spinner/skeleton
  }

  if (!user || !user.isAdmin) {
    // Se não for admin, redireciona para a página inicial ou de "não autorizado"
    console.warn('[AdminRoute] Acesso negado. Usuário não é admin ou não está logado.');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <Outlet />; // Renderiza o conteúdo da rota se for admin
};

export default AdminRoute;