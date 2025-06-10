import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect } from 'react'; // Removido CSSProperties
import styles from './HomePage.module.css'; // Importa os CSS Modules
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Se o usuário está carregando, não faz nada ainda
    if (isLoading) {
      return;
    }
    if (user) { // Usuário está logado
      // Se o usuário está logado, sempre redireciona para o perfil primeiro.
      navigate('/profile', { replace: true });
    }
    // Se !user (não logado), permanece na HomePage, que é o comportamento desejado.
  }, [user, isLoading, navigate]);

  return (
    <div className={styles.pageContainer}>
      {/* Envolve o conteúdo principal para melhor organização e estilização se o header for sticky */}
      <main className={styles.mainContent}>
        <h1 className={styles.title}>{t('homePage.welcomeTitle')}</h1>
        <p className={styles.subTitle}>
          {t('homePage.welcomeSubtitle')}
        </p>
        <div className={styles.buttonContainer}>
          <Link to="/login" className={styles.primaryButton}>{t('buttons.login')}</Link>
          <Link to="/signup" className={styles.secondaryButton}>{t('buttons.signup')}</Link>
        </div>
      </main>
    </div>
  );
}
export default HomePage;
