import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './SupportPage.module.css'; // Certifique-se que este arquivo CSS existe

const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <h1 className={styles.title}>{t('support_page_title')}</h1>
        <p className={styles.text}>
          {t('support_page_text_email')}
        </p>
        <a href="mailto:ruishalm2@gmail.com" className={styles.emailLink}>
          ruishalm2@gmail.com
        </a>
        <p className={styles.text} style={{ marginTop: '30px' }}>
          {t('support_page_text_faq')}
        </p>
        <Link to="/" className={`${styles.backLink} genericButton`}>
          {t('support_page_back_button')}
        </Link>
      </main>
    </div>
  );
};

export default SupportPage;
