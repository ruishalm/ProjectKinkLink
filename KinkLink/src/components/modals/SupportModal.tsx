import React from 'react';
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
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton} aria-label="Fechar modal">×</button>
        
        <h2 className={styles.title}>Obrigado por estar aqui!</h2>
        
        <p className={styles.mainText}>
          O Kinklink foi pensado para melhorar a comunicação, e acreditamos que todos devem ter direito à comunicação, por isso nosso app é 100% gratuito e sempre será!
        </p>
        <p className={styles.mainText}>
          Se você gosta do projeto e quer ajudar a manter ele no ar e melhorando cada dia mais, considere nos apoiar e nos siga nas nossas redes sociais.
        </p>
        <p className={styles.mainText} style={{ textAlign: 'right', fontStyle: 'italic', marginTop: '20px' }}>
          - O Criador
        </p>

        <div className={styles.supportSection}>
          <div className={styles.supportLogosContainer}>
            <a href={CATARSE_LINK} target="_blank" rel="noopener noreferrer" className={styles.supportLink} aria-label="Apoie o KinkLink no Catarse">
              <img src={CATARSE_LOGO_SRC} alt="Logo Catarse" className={styles.supportLogo} />
            </a>
            <a href={APOIASE_LINK} target="_blank" rel="noopener noreferrer" className={styles.supportLink} aria-label="Apoie o KinkLink no Apoia.se">
              <img src={APOIASE_LOGO_SRC} alt="Logo Apoia.se" className={styles.supportLogo} />
            </a>
          </div>
        </div>

        <div className={styles.socialMediaSection}>
          <div className={styles.socialIconsContainer}>
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" aria-label="KinkLink no X (Twitter)">
              <img src={SOCIAL_ICONS.twitter} alt="X (Twitter)" className={styles.socialIcon} />
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="KinkLink no Instagram">
              <img src={SOCIAL_ICONS.instagram} alt="Instagram" className={styles.socialIcon} />
            </a>
            <a href={SOCIAL_LINKS.bluesky} target="_blank" rel="noopener noreferrer" aria-label="KinkLink no BlueSky">
              <img src={SOCIAL_ICONS.bluesky} alt="BlueSky" className={styles.socialIcon} />
            </a>
            <a href={SOCIAL_LINKS.reddit} target="_blank" rel="noopener noreferrer" aria-label="KinkLink no Reddit">
              <img src={SOCIAL_ICONS.reddit} alt="Reddit" className={styles.socialIcon} />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupportModal;