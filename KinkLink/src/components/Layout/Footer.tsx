// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\Layout\Footer.tsx
import React from 'react';
import styles from './Footer.module.css';

const SUPPORT_LINKS = [
  {
    name: 'Catarse',
    href: 'https://www.catarse.me/kinklink',
    logoSrc: '/catarse-logo-h-pb-negativo.png',
    ariaLabel: 'Apoie o KinkLink no Catarse',
    logoClassName: 'catarseLogo',
  },
  {
    name: 'Apoia.se',
    href: 'https://apoia.se/kinklink',
    logoSrc: '/apoia-se-logo.png',
    ariaLabel: 'Apoie o KinkLink no Apoia.se',
    logoClassName: 'apoiaseLogo',
  },
];

const SOCIAL_MEDIA = [
  {
    name: 'X (Twitter)',
    href: 'https://x.com/kinklinkapp',
    iconSrc: '/Socials_X.png',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/kinklinkapp/',
    iconSrc: '/Socials_Instagram.png',
  },
  {
    name: 'BlueSky',
    href: 'https://bsky.app/profile/kinklinkapp.bsky.social',
    iconSrc: '/Socials_BlueSky.png',
  },
  {
    name: 'Reddit',
    href: 'https://www.reddit.com/r/KinkLinkApp/',
    iconSrc: '/Socials_Reddit.png',
  },
];

const Footer: React.FC = () => {
  return (
    <footer className={`${styles.appFooter} klnkl-themed-panel`}>
      <div className={styles.footerContent}>
        <div className={styles.supportSection}>
          <p className={styles.supportText}>
            Gostou do projeto? Nos ajude a manter e melhorar ele!
          </p>
          <div className={styles.supportLogosContainer}>
            {SUPPORT_LINKS.map((link) => (
              <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.supportLink} aria-label={link.ariaLabel} >
                <img src={link.logoSrc} alt={`Logo ${link.name}`} className={styles[link.logoClassName]} />
              </a>
            ))}
          </div>
        </div>

        <div className={styles.socialMediaSection}>
          <p className={styles.socialText}>Siga nossas redes sociais:</p>
          <div className={styles.socialIconsContainer}>
            {SOCIAL_MEDIA.map((social) => (
              <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`KinkLink no ${social.name}`}>
                <img src={social.iconSrc} alt={social.name} className={styles.socialIcon} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;