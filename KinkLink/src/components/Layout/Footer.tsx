// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\Layout\Footer.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Footer.module.css';
import LanguageSelector from './LanguageSelector';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  const SUPPORT_LINKS = [
    {
      name: 'Catarse',
      href: 'https://www.catarse.me/kinklink',
      logoSrc: '/catarse-logo-h-pb-negativo.png',
      ariaLabel: t('footer_support_catarse_aria'),
      logoClassName: 'catarseLogo',
    },
    {
      name: 'Apoia.se',
      href: 'https://apoia.se/kinklink',
      logoSrc: '/apoia-se-logo.png',
      ariaLabel: t('footer_support_apoiase_aria'),
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

  return (
    <footer className={`${styles.appFooter} klnkl-themed-panel`}>
      <div className={styles.footerContent}>
        <div className={styles.supportSection}>
          <p className={styles.supportText}>
            {t('footer_support_text')}
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
          <p className={styles.socialText}>{t('footer_social_text')}</p>
          <div className={styles.socialIconsContainer}>
            {SOCIAL_MEDIA.map((social) => (
              <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={t('footer_social_aria', { network: social.name })}>
                <img src={social.iconSrc} alt={social.name} className={styles.socialIcon} />
              </a>
            ))}
          </div>
        </div>
        <LanguageSelector />
      </div>
    </footer>
  );
};

export default Footer;