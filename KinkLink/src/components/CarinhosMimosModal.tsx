// src/components/CarinhosMimosModal.tsx (NOVO ARQUIVO)
import React, { useState, useEffect, type CSSProperties } from 'react';
import type { Card } from '../data/cards';

interface CarinhosMimosModalProps {
  isOpen: boolean;
  onClose: () => void;
  conexaoCards: Card[];
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1055, // Z-index para ficar acima de outros elementos se necessário
};

const modalContentStyle: CSSProperties = {
  backgroundColor: '#2c2c2c',
  color: '#e0e0e0',
  padding: '25px',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
  width: '90%',
  maxWidth: '550px',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: '"Trebuchet MS", sans-serif',
};

const tableContainerStyle: CSSProperties = {
  overflowY: 'auto',
  flexGrow: 1,
  marginTop: '15px',
  border: '1px solid #444',
  borderRadius: '8px',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: CSSProperties = {
  backgroundColor: '#353535',
  color: '#64b5f6',
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #4a4a4a',
  position: 'sticky', // Faz o cabeçalho fixo ao rolar
  top: 0,
  zIndex: 1,
};

const tdStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #444',
  verticalAlign: 'top',
};

const checkboxStyle: CSSProperties = {
  width: '20px',
  height: '20px',
  cursor: 'pointer',
};

const STORAGE_KEY_PREFIX = 'kinklink_carinho_status_';

function CarinhosMimosModal({ isOpen, onClose, conexaoCards }: CarinhosMimosModalProps) {
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

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, color: '#64b5f6', textAlign: 'center', marginBottom: '10px' }}>
          ❤️ Carinhos & Mimos ❤️
        </h2>
        <p style={{textAlign: 'center', fontSize: '0.9em', color: '#b0b0b0', marginBottom: '15px'}}>
          Pequenos gestos para fortalecer a conexão. Marque os que você já fez!
        </p>
        
        {conexaoCards.length === 0 ? (
          <p style={{textAlign: 'center', color: '#aaa'}}>Nenhuma sugestão de carinho disponível no momento.</p>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Proposta</th>
                  <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Feito?</th>
                </tr>
              </thead>
              <tbody>
                {conexaoCards.map(card => (
                  <tr key={card.id}>
                    <td style={tdStyle}>{card.text}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        style={checkboxStyle}
                        checked={!!doneStatus[card.id]}
                        onChange={() => handleToggleDone(card.id)}
                        aria-labelledby={`conexao-card-text-${card.id}`}
                      />
                      {/* Para acessibilidade, associar o texto da carta ao checkbox */}
                      <span id={`conexao-card-text-${card.id}`} style={{display: 'none'}}>{card.text}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button 
          onClick={onClose} 
          style={{ 
            marginTop: '20px', 
            padding: '10px 20px', 
            alignSelf: 'center', 
            backgroundColor: '#757575', 
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default CarinhosMimosModal;
