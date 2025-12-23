import React from 'react';
import styles from './IosInstallPrompt.module.css';
import { useTranslation } from 'react-i18next';

// Um ícone simples para o botão de compartilhamento do iOS, feito com CSS.
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.shareIcon}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
    <polyline points="16 6 12 2 8 6"></polyline>
    <line x1="12" y1="2" x2="12" y2="15"></line>
  </svg>
);

interface IosInstallPromptProps {
  onClose: () => void;
}

const IosInstallPrompt: React.FC<IosInstallPromptProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.iosInstallPrompt}>
      <button onClick={onClose} className={styles.closeButton}>×</button>
      <div className={styles.content}>
        <p>
          {t('ios_install_prompt_p1')}
          <ShareIcon />
          {t('ios_install_prompt_p2')}
        </p>
      </div>
    </div>
  );
};

export default IosInstallPrompt;
