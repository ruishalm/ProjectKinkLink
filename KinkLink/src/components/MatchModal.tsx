// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\MatchModal.tsx

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Card } from '../data/cards';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import PlayingCard from './PlayingCard'; // Importa o componente PlayingCard
import styles from './MatchModal.module.css'; // Importa os CSS Modules

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
    // Navega para a página de matches com o hash do cardId para abrir o chat diretamente
    navigate(`/matches#card-${card.id}`);
  };

  // Lógica de Renderização e JSX
  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="match-modal-title">
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className={styles.closeButtonTopRight} aria-label={t('match_modal_close_aria')}>
          &times;
        </button>
        <h2 id="match-modal-title" className={styles.title}>{t('match_modal_title')}</h2>
        <p className={styles.subTitle}>{t('match_modal_subtitle')}</p>
        <div className={styles.cardContainer}>
          {/* Renderiza o PlayingCard com escala um pouco menor para caber bem */}
          <PlayingCard data={card}/>
        </div>
        <div className={styles.buttonContainer}>
          <button className={`${styles.closeButton} genericButton klnkl-match-modal-action-close`} onClick={onClose}>{t('match_modal_close_button')}</button>
          <button className={`${styles.chatButton} genericButton klnkl-match-modal-action-chat`} onClick={handleGoToChat}>{t('match_modal_chat_button')}</button>
        </div>
      </div>
    </div>
  );
}

export default MatchModal;