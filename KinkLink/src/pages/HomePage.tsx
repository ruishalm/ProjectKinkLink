import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './HomePage.module.css';
import InteractiveDemo from '../components/HomePageDemo/InteractiveDemo';

function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (user) {
      navigate('/profile', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <h1 className={styles.title}>{t('homepage_title')}</h1>
        <p className={styles.subTitle}>
          {t('homepage_subtitle')}
        </p>
        <div className={styles.buttonContainer}>
          <Link to="/login" className={styles.primaryButton}>{t('homepage_login_button')}</Link>
          <Link to="/signup" className={styles.secondaryButton}>{t('homepage_signup_button')}</Link>
        </div>

        <section className={styles.demoSection}>
          <InteractiveDemo />
        </section>
      </main>
    </div>
  );
}
export default HomePage;
