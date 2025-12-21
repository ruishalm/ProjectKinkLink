import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import styles from './RegisterPage.module.css'; // Importa os CSS Modules

const RegisterPage: React.FC = () => {
  // Hooks
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Efeitos
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

  // Lógica de Renderização
  // Enquanto isLoading é true, ou se o usuário não estiver logado, mostra o conteúdo da página.
  // Se o usuário for redirecionado, este return não será alcançado.
  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}> {/* Envolve o conteúdo principal */}
        <p className={styles.messageText}>{t('register_page_placeholder')}</p>
      </main>
    </div>
  );
};

export default RegisterPage;