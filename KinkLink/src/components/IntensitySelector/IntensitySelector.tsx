import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './IntensitySelector.module.css';


interface IntensitySelectorProps {
  currentLevel: number;
  onLevelChange: (level: number) => void;
}

const IntensitySelector: React.FC<IntensitySelectorProps> = ({ currentLevel, onLevelChange }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const intensityLevels = [
    { level: 1, label: t('intensity_level_1') },
    { level: 2, label: t('intensity_level_2') },
    { level: 3, label: t('intensity_level_3') },
    { level: 4, label: t('intensity_level_4'), warning: true },
    { level: 5, label: t('intensity_level_5'), warning: true },
    { level: 6, label: t('intensity_level_6'), warning: true },
    { level: 7, label: t('intensity_level_7'), warning: true },
    { level: 8, label: t('intensity_level_8'), warning: false },
  ];

  const selectedLabel = intensityLevels.find(l => l.level === currentLevel)?.label || t('intensity_select_placeholder');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);


  const handleSelect = (level: number) => {
    onLevelChange(level);
    setIsOpen(false);
  };

  return (
    <div className={styles.selectorContainer} ref={wrapperRef}>
      <label className={styles.mainLabel}>{t('intensity_selector_label')}</label>
      <button
        type="button"
        className={`${styles.selectorDisplay} genericButton`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedLabel}
        <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>▼</span>
      </button>
      {isOpen && (
        <ul className={`${styles.optionsList} klnkl-themed-panel`} role="listbox">
          {intensityLevels.map(({ level, label, warning }) => (
            <li
              key={level}
              className={styles.optionItem}
              onClick={() => handleSelect(level)}
              role="option"
              aria-selected={level === currentLevel}
            >
              <span>{label}</span>
              {warning && (
                <p className={styles.intensityWarning}>
                  {t('intensity_warning_third_party')}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IntensitySelector;
