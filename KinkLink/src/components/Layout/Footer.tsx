// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\Layout\Footer.tsx
import React from 'react';
import styles from './Footer.module.css';

const CATARSE_LINK = 'https://www.catarse.me/kinklink';
const CATARSE_LOGO_SRC = '/catarse-logo-h-pb-negativo.png'; // Imagem na pasta public

const Footer: React.FC = () => {
  return (
    <footer className={`${styles.appFooter} klnkl-themed-panel`}>
      <div className={styles.footerContent}>
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
    </footer>
  );
};

export default Footer;