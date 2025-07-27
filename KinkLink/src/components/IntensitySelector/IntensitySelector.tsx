import React, { useState, useRef, useEffect } from 'react';
import styles from './IntensitySelector.module.css';

const intensityLevels = [
  { level: 1, label: 'Nível 1: Leve' },
  { level: 2, label: 'Nível 2: Moderado' },
  { level: 3, label: 'Nível 3: Apimentado' },
  { level: 4, label: 'Nível 4: Intenso (+1)', warning: true },
  { level: 5, label: 'Nível 5: Extremo (Grupo)', warning: true },
  { level: 6, label: 'Nível 6: Hardcore (Grupo+)', warning: true },
  { level: 7, label: 'Nível 7: Fetiches Específicos', warning: true },
  { level: 8, label: 'Nível 8: Sem Limites (Padrão)', warning: false },
];

interface IntensitySelectorProps {
  currentLevel: number;
  onLevelChange: (level: number) => void;
}

const IntensitySelector: React.FC<IntensitySelectorProps> = ({ currentLevel, onLevelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedLabel = intensityLevels.find(l => l.level === currentLevel)?.label || 'Selecione...';

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
      <label className={styles.mainLabel}>Intensidade Máxima das Cartas:</label>
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
                  Aviso: Pode incluir interações com terceiros.
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
