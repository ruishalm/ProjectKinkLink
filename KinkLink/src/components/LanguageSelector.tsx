// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\LanguageSelector.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSelector.module.css'; // Criaremos este arquivo de estilo

const LANGUAGES = [
  { code: 'pt', label: 'Português (PT)' },
  { code: 'en', label: 'English (EN)' },
  { code: 'es', label: 'Español (ES)' },
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <select
      className={`${styles.languageDropdown} genericButton`} // Pode usar genericButton para herdar alguns estilos base
      value={i18n.resolvedLanguage}
      onChange={(e) => changeLanguage(e.target.value)}
      aria-label="Selecionar idioma"
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