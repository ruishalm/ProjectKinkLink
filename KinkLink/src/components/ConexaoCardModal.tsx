import React, { useEffect } from 'react';
import type { Card } from '../data/cards';
import styles from './ConexaoCardModal.module.css'; // Importa os CSS Modules

interface ConexaoCardModalProps {
  card: Card | null;
  onAccept: (cardId: string) => void;
  onReject: (cardId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

function ConexaoCardModal({ card, onAccept, onReject, onClose, isOpen }: ConexaoCardModalProps) {
  // Efeitos
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(); // Ou onReject(card.id) se preferir que Esc seja um "não"
      }
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, card]);

  if (!isOpen || !card) return null;

  // Funções Manipuladoras
  const handleAccept = () => {
    onAccept(card.id);
    onClose();
  };

  const handleReject = () => {
    onReject(card.id);
    onClose();
  };

  // Lógica de Renderização e JSX
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="conexao-modal-title">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 id="conexao-modal-title" className={styles.title}>💌 Um Gesto de Conexão! 💌</h2>
        <p className={styles.cardText}>{card.text}</p>
        <div className={styles.buttonContainer}>
          <button className={styles.acceptButton} onClick={handleAccept} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>Topar!</button>
          <button className={styles.rejectButton} onClick={handleReject} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>Agora não</button>
        </div>
      </div>
    </div>
  );
}

export default ConexaoCardModal;