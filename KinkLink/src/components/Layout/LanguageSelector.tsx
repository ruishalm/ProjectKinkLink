// KinkLink/src/components/Layout/LanguageSelector.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSelector.module.css';

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className={styles.languageSelectorContainer}>
      <select 
        className={styles.languageSelect} 
        value={i18n.language} 
        onChange={changeLanguage}
        aria-label={t('language_selector_aria_label')}
      >
        <option value="pt">{t('language_pt')}</option>
        <option value="en">{t('language_en')}</option>
        <option value="es">{t('language_es')}</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
