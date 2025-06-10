// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\LanguageSelector.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSelector.module.css'; // Criaremos este arquivo de estilo

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const LANGUAGES = [
    { code: 'pt', label: t('languageSelector.pt') },
    { code: 'en', label: t('languageSelector.en') },
    { code: 'es', label: t('languageSelector.es') },
  ];
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <select
      className={`${styles.languageDropdown} genericButton`} // Pode usar genericButton para herdar alguns estilos base
      value={i18n.resolvedLanguage}
      onChange={(e) => changeLanguage(e.target.value)}
      aria-label={t('languageSelector.ariaLabel')}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;