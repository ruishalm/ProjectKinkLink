import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o estado de autenticação ainda está carregando, não faz nada.
    if (isLoading) {
      return;
    }

    // Se o usuário já está logado, redireciona para o perfil.
    if (user) {
      navigate('/profile', { replace: true });
    }
    // Se não está carregando e não há usuário, ele permanece na página de cadastro.
  }, [user, isLoading, navigate]);

  // Enquanto isLoading é true, ou se o usuário não estiver logado, mostra o conteúdo da página.
  return <div>Página de Cadastro (Conteúdo a ser implementado ou esta página será removida se SignupPage for suficiente)</div>;
};

export default RegisterPage;