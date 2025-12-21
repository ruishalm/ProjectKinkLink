import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SupportModal.module.css';

// Constants for links and logos, same as footer
const CATARSE_LINK = 'https://www.catarse.me/kinklink';
const CATARSE_LOGO_SRC = '/catarse-logo-h-pb-negativo.png';
const APOIASE_LINK = 'https://apoia.se/kinklink';
const APOIASE_LOGO_SRC = '/apoia-se-logo.png';

const SOCIAL_LINKS = {
  bluesky: 'https://bsky.app/profile/kinklinkapp.bsky.social',
  twitter: 'https://x.com/kinklinkapp',
  instagram: 'https://www.instagram.com/kinklinkapp/',
  reddit: 'https://www.reddit.com/r/KinkLinkApp/',
};

const SOCIAL_ICONS = {
  bluesky: '/Socials_BlueSky.png',
  twitter: '/Socials_X.png',
  instagram: '/Socials_Instagram.png',
  reddit: '/Socials_Reddit.png',
};

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton} aria-label={t('support_modal_close_aria')}>×</button>
        
        <h2 className={styles.title}>{t('support_modal_title')}</h2>
        
        <p className={styles.mainText}>
          {t('support_modal_text_1')}
        </p>
        <p className={styles.mainText}>
          {t('support_modal_text_2')}
        </p>
        <p className={styles.mainText} style={{ textAlign: 'right', fontStyle: 'italic', marginTop: '20px' }}>
          {t('support_modal_signature')}
        </p>

        <div className={styles.supportSection}>
          <div className={styles.supportLogosContainer}>
            <a href={CATARSE_LINK} target="_blank" rel="noopener noreferrer" className={styles.supportLink} aria-label={t('support_modal_catarse_aria')}>
              <img src={CATARSE_LOGO_SRC} alt="Logo Catarse" className={styles.supportLogo} />
            </a>
            <a href={APOIASE_LINK} target="_blank" rel="noopener noreferrer" className={styles.supportLink} aria-label={t('support_modal_apoiase_aria')}>
              <img src={APOIASE_LOGO_SRC} alt="Logo Apoia.se" className={styles.supportLogo} />
            </a>
          </div>
        </div>

        <div className={styles.socialMediaSection}>
          <div className={styles.socialIconsContainer}>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" aria-label={t('support_modal_social_aria', { network: 'X (Twitter)' })}>
              <img src={SOCIAL_ICONS.twitter} alt="X (Twitter)" className={styles.socialIcon} />
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label={t('support_modal_social_aria', { network: 'Instagram' })}>
              <img src={SOCIAL_ICONS.instagram} alt="Instagram" className={styles.socialIcon} />
            </a>
            <a href={SOCIAL_LINKS.bluesky} target="_blank" rel="noopener noreferrer" aria-label={t('support_modal_social_aria', { network: 'BlueSky' })}>
              <img src={SOCIAL_ICONS.bluesky} alt="BlueSky" className={styles.socialIcon} />
            </a>
            <a href={SOCIAL_LINKS.reddit} target="_blank" rel="noopener noreferrer" aria-label={t('support_modal_social_aria', { network: 'Reddit' })}>
              <img src={SOCIAL_ICONS.reddit} alt="Reddit" className={styles.socialIcon} />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupportModal;