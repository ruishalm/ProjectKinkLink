// src/components/CarinhosMimosModal.tsx (NOVO ARQUIVO)
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card } from '../data/cards';
import styles from './CarinhosMimosModal.module.css'; // Importa os CSS Modules

interface CarinhosMimosModalProps {
  isOpen: boolean;
  onClose: () => void;
  conexaoCards: Card[];
}

const STORAGE_KEY_PREFIX = 'kinklink_carinho_status_';

function CarinhosMimosModal({ isOpen, onClose, conexaoCards }: CarinhosMimosModalProps) {
  const { t } = useTranslation();
  // Hooks e Estados
  const [doneStatus, setDoneStatus] = useState<Record<string, boolean>>({});

  // Carregar status do localStorage ao montar
  useEffect(() => {
    if (isOpen) {
      const loadedStatus: Record<string, boolean> = {};
      conexaoCards.forEach(card => {
        const storedValue = localStorage.getItem(`${STORAGE_KEY_PREFIX}${card.id}`);
        loadedStatus[card.id] = storedValue === 'true';
      });
      setDoneStatus(loadedStatus);
    }
  }, [isOpen, conexaoCards]);

  // Funções Manipuladoras
  const handleToggleDone = (cardId: string) => {
    const newStatus = !doneStatus[cardId];
    setDoneStatus(prevStatus => ({
      ...prevStatus,
      [cardId]: newStatus,
    }));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${cardId}`, String(newStatus));
  };
  
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Lógica de Renderização e JSX
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.headerTitle}>
          {t('carinhos_modal_title')}
        </h2>
        <p className={styles.subText}>
          {t('carinhos_modal_subtitle')}
        </p>
        
        {conexaoCards.length === 0 ? (
          <p className={styles.noSuggestionsText}>{t('carinhos_modal_empty')}</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>{t('carinhos_modal_th_proposal')}</th>
                  <th className={`${styles.th}`} style={{ width: '80px', textAlign: 'center' }}>{t('carinhos_modal_th_done')}</th>
                </tr>
              </thead>
              <tbody>
                {conexaoCards.map(card => (
                  <tr key={card.id}>
                    <td className={styles.td}>{card.text}</td>
                    <td className={styles.td} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={!!doneStatus[card.id]}
                        onChange={() => handleToggleDone(card.id)}
                        aria-labelledby={`conexao-card-text-${card.id}`}
                      />
                      <span id={`conexao-card-text-${card.id}`} style={{display: 'none'}}>{card.text}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={onClose} className={`${styles.closeButton} genericButton`}>
          {t('carinhos_modal_close')}
        </button>
      </div>
    </div>
  );
}

export default CarinhosMimosModal;
