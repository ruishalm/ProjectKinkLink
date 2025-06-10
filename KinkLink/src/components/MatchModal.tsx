// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\MatchModal.tsx

import React, { useEffect } from 'react';
import type { Card } from '../data/cards';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import PlayingCard from './PlayingCard'; // Importa o componente PlayingCard
import styles from './MatchModal.module.css'; // Importa os CSS Modules
import { useTranslation } from 'react-i18next';

interface MatchModalProps {
  card: Card;
  onClose: () => void;
}

function MatchModal({ card, onClose }: MatchModalProps) {
  const { t } = useTranslation();
  // Hooks e Efeitos
  // Adiciona listener para fechar com a tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const navigate = useNavigate();

  // Funções Manipuladoras
  const handleGoToChat = () => {
    onClose(); // Fecha o MatchModal
    navigate('/matches', { state: { openChatForCardId: card.id, cardDataForChat: card } });
  };

  // Lógica de Renderização e JSX
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="match-modal-title">
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className={styles.closeButtonTopRight} aria-label={t('buttons.close')}>
          &times;
        </button>
        <h2 id="match-modal-title" className={styles.title}>{t('modals.match.title')}</h2>
        <p className={styles.subTitle}>{t('modals.match.subTitle')}</p>
        <div className={styles.cardContainer}>
          {/* Renderiza o PlayingCard com escala um pouco menor para caber bem */}
          <PlayingCard data={card}/>
        </div>
        <div className={styles.buttonContainer}>
          <button className={`${styles.closeButton} genericButton klnkl-match-modal-action-close`} onClick={onClose}>{t('modals.match.closeButton')}</button>
          <button className={`${styles.chatButton} genericButton klnkl-match-modal-action-chat`} onClick={handleGoToChat}>{t('modals.match.chatButton')}</button>
        </div>
      </div>
    </div>
  );
}

export default MatchModal;