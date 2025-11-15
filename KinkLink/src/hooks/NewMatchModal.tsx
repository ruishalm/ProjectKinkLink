// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\modals\NewMatchModal.tsx
import React from 'react';
import type { Card } from '../data/cards';
import PlayingCard from '../components/PlayingCard';
import styles from './NewMatchModal.module.css';

interface NewMatchModalProps {
  matches: Card[];
  onClose: () => void;
}

const NewMatchModal: React.FC<NewMatchModalProps> = ({ matches, onClose }) => {
  // Efeito para fechar com a tecla ESC
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButton} aria-label="Fechar">&times;</button>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>🎉 Novo Link! 🎉</h2>
          <p className={styles.modalSubtitle}>
            Você e seu par toparam as mesmas cartas!
          </p>
        </div>
        <div className={styles.matchesContainer}>
          {matches.map((card) => (
            <div key={card.id} className={styles.cardWrapper}>
              <PlayingCard
                data={card}
                targetWidth={150}
                targetHeight={210}
                isFlipped={false}
              />
            </div>
          ))}
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={`${styles.okButton} genericButton`}>
            Legal!
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMatchModal;