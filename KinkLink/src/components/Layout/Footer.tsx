// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\Layout\Footer.tsx
import React from 'react';
import styles from './Footer.module.css';

const CATARSE_LINK = 'https://www.catarse.me/kinklink';
const CATARSE_LOGO_SRC = '/catarse-logo-h-pb-negativo.png'; // Imagem na pasta public

// Links e ícones das Redes Sociais
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

const Footer: React.FC = () => {
  return (
    <footer className={`${styles.appFooter} klnkl-themed-panel`}>
      <div className={styles.footerContent}>
        <div className={styles.supportSection}>
          <p className={styles.supportText}>
            Gostou do projeto? Nos ajude a manter e melhorar ele!
          </p>
          <a
            href={CATARSE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.catarseLink}
            aria-label="Apoie o KinkLink no Catarse"
          >
            <img src={CATARSE_LOGO_SRC} alt="Logo Catarse" className={styles.catarseLogo} />
          </a>
        </div>

        <div className={styles.socialMediaSection}>
          <p className={styles.socialText}>Siga nossas redes sociais:</p>
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
    </footer>
  );
};

export default Footer;