import React, { type CSSProperties, useEffect } from 'react';
import type { Card } from '../data/cards';

interface ConexaoCardModalProps {
  card: Card | null;
  onAccept: (cardId: string) => void;
  onReject: (cardId: string) => void;
  onClose: () => void; // onClose é chamado por onAccept/onReject internamente
  isOpen: boolean;
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)', // Um pouco mais escuro para destaque
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1050, // Acima de outros modais se houver
};

const modalContentStyle: CSSProperties = {
  backgroundColor: '#2c2c2c', // Um cinza escuro, mas não preto total
  color: '#e0e0e0', // Cinza claro para texto
  padding: '30px 35px',
  borderRadius: '15px', // Bordas mais arredondadas
  textAlign: 'center',
  maxWidth: '450px',
  width: '90%',
  boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
  border: '1px solid #444',
  fontFamily: '"Trebuchet MS", sans-serif',
};

const cardTextStyle: CSSProperties = {
  fontSize: '1.4em', // Texto da carta um pouco maior
  margin: '25px 0',
  lineHeight: '1.7',
  minHeight: '70px',
  color: '#ffffff', // Texto da carta branco para contraste
};

const buttonContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  marginTop: '30px',
};

const buttonBaseStyle: CSSProperties = {
  padding: '14px 28px',
  fontSize: '1.1em',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
};

const acceptButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#5cb85c', // Verde mais vibrante
  color: 'white',
};

const rejectButtonStyle: CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: '#d9534f', // Vermelho mais vibrante
  color: 'white',
};

function ConexaoCardModal({ card, onAccept, onReject, onClose, isOpen }: ConexaoCardModalProps) {
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

  return (
    <div style={modalOverlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="conexao-modal-title">
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 id="conexao-modal-title" style={{ marginTop: 0, color: '#64b5f6', fontSize: '1.8em' }}>💌 Um Gesto de Conexão! 💌</h2>
        <p style={cardTextStyle}>{card.text}</p>
        <div style={buttonContainerStyle}>
          <button style={acceptButtonStyle} onClick={() => { onAccept(card.id); onClose(); }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>Topar!</button>
          <button style={rejectButtonStyle} onClick={() => { onReject(card.id); onClose(); }} onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}>Agora não</button>
        </div>
      </div>
    </div>
  );
}

export default ConexaoCardModal;