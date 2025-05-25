// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\MatchModal.tsx

import React, { type CSSProperties, useEffect } from 'react'; // Adicionado React e useEffect
import type { Card } from '../data/cards';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import PlayingCard from './PlayingCard'; // Importa o componente PlayingCard

interface MatchModalProps {
  card: Card;
  onClose: () => void;
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1040, // Ajustar z-index se necessário em relação a outros modais
};

const modalContentStyle: CSSProperties = {
  backgroundColor: '#2c2c2c', // Fundo escuro para consistência
  padding: '30px',
  borderRadius: '10px',
  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  textAlign: 'center',
  maxWidth: '350px', // Ajustar para acomodar a carta
  width: '90%',
  color: '#e0e0e0', // Texto claro
  fontFamily: '"Trebuchet MS", sans-serif',
};

const titleStyle: CSSProperties = {
  fontSize: '2em',
  color: '#55efc4', // Cor vibrante para o título
  margin: '0 0 10px 0',
};

const subTitleStyle: CSSProperties = {
  fontSize: '1.1em',
  marginBottom: '20px',
  color: '#b0b0b0',
};

const closeButtonStyle: CSSProperties = {
  marginTop: '20px',
  padding: '10px 20px',
  backgroundColor: '#55efc4', // Cor do botão "Topo!"
  color: '#20232a', // Texto escuro para contraste
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
};

const chatButtonStyle: CSSProperties = {
  ...closeButtonStyle,
  backgroundColor: '#64b5f6', // Um azul para diferenciar
  marginLeft: '10px',
};

function MatchModal({ card, onClose }: MatchModalProps) {
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

  const handleGoToChat = () => {
    onClose(); // Fecha o MatchModal
    navigate('/matches', { state: { openChatForCardId: card.id, cardDataForChat: card } });
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="match-modal-title">
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 id="match-modal-title" style={titleStyle}>🔗 LINK! 🎉</h2>
        <p style={subTitleStyle}>Vocês dois toparam a carta:</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          {/* Renderiza o PlayingCard com escala um pouco menor para caber bem */}
          <PlayingCard data={card}/>
        </div>
        <div>
          <button style={closeButtonStyle} onClick={onClose} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>Legal!</button>
          <button style={chatButtonStyle} onClick={handleGoToChat} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>Vamos conversar</button>
        </div>
      </div>
    </div>
  );
}

export default MatchModal;