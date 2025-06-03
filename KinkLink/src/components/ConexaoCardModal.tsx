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
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className={styles.closeButton} aria-label="Fechar modal">
          &times;
        </button>
        <h2 id="conexao-modal-title" className={styles.title}>💌 Um Gesto de Conexão! 💌</h2>
        <p className={styles.cardText}>{card.text}</p>
        <div className={styles.buttonContainer}>
          <button className={`${styles.acceptButton} genericButton`} onClick={handleAccept}>Topar!</button>
          <button className={`${styles.rejectButton} genericButton`} onClick={handleReject}>Agora não</button>
        </div>
      </div>
    </div>
  );
}

export default ConexaoCardModal;