// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth(); // Usaremos isAuthenticated diretamente
  const location = useLocation();

  if (isLoading) {
    return <div>Carregando autenticação...</div>; // Ou um spinner/componente de loading
  }

  if (!isAuthenticated) {
    // Usuário não autenticado, redireciona para login
    // Mantém o estado 'from' para redirecionar de volta após o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // Renderiza as rotas filhas aninhadas
};

export default ProtectedRoute;
