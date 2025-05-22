// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\CreateUserConexaoCardModal.tsx
import React, { useState, type CSSProperties, useEffect } from 'react';

interface CreateUserConexaoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardText: string) => void;
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1060, // Um pouco acima do ConexaoCardModal
};

const modalContentStyle: CSSProperties = {
  backgroundColor: '#282c34', // Um tom escuro diferente
  color: '#e0e0e0',
  padding: '30px 35px',
  borderRadius: '15px',
  textAlign: 'left', // Alinhar à esquerda para formulário
  maxWidth: '500px',
  width: '90%',
  boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
  border: '1px solid #444',
  fontFamily: '"Trebuchet MS", sans-serif',
};

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: '100px',
  padding: '10px',
  marginBottom: '20px',
  borderRadius: '8px',
  border: '1px solid #555',
  backgroundColor: '#3a3f47',
  color: '#e0e0e0',
  fontSize: '1em',
  boxSizing: 'border-box',
  resize: 'vertical',
};

const buttonStyle: CSSProperties = {
  padding: '12px 25px',
  fontSize: '1.1em',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  backgroundColor: '#61dafb', // Cor de destaque React
  color: '#20232a',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
};

function CreateUserConexaoCardModal({ isOpen, onClose, onSubmit }: CreateUserConexaoCardModalProps) {
  const [cardText, setCardText] = useState('');

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Limpa o texto ao abrir o modal
      setCardText('');
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (cardText.trim()) {
      onSubmit(cardText.trim());
      // onClose(); // O fechamento agora é gerenciado pelo hook que chama onSubmit
    }
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-conexao-title">
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 id="create-conexao-title" style={{ marginTop: 0, color: '#61dafb', textAlign: 'center', marginBottom: '25px' }}>✨ Crie seu Gesto de Conexão! ✨</h2>
        <textarea
          style={textareaStyle}
          value={cardText}
          onChange={(e) => setCardText(e.target.value)}
          placeholder="Descreva um gesto, uma pergunta ou uma pequena ação para se conectar com seu parceiro(a)..."
          rows={4}
        />
        <div style={{ textAlign: 'right' }}> {/* Alinha botão à direita */}
          <button style={buttonStyle} onClick={handleSubmit} disabled={!cardText.trim()}>
            Salvar Carta
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateUserConexaoCardModal; // Certifique-se que esta linha existe!
