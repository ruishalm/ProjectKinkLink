import React, { useState, type CSSProperties, useEffect } from 'react';
import type { Card } from '../data/cards'; // Importa o tipo Card para usar a união de categorias
import CardBack from './CardBack'; // Importa o CardBack

interface CreateUserCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Card['category'], text: string, intensity: number) => void;
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)', // Fundo mais escuro
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1070, // Acima de outros modais
};

const modalContentStyle: CSSProperties = {
  backgroundColor: '#1e1e1e', // Fundo bem escuro
  color: '#e0e0e0',
  padding: '30px 40px',
  borderRadius: '20px', // Bordas mais arredondadas para o modal em si
  textAlign: 'left',
  maxWidth: '600px', // Aumentar um pouco para acomodar controles e carta
  width: '90%',
  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
  border: '1px solid #444',
  fontFamily: '"Trebuchet MS", sans-serif',
};

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 'bold',
  color: '#61dafb', // Cor de destaque
};

const controlsContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end', // Alinha os labels com os inputs
  marginBottom: '25px',
  gap: '20px',
};

const selectStyle: CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #555',
  backgroundColor: '#3a3f47',
  color: '#e0e0e0',
  fontSize: '1em',
  boxSizing: 'border-box',
  cursor: 'pointer',
};

const inputNumberStyle: CSSProperties = {
  ...selectStyle,
  width: '80px', // Menor para intensidade
  textAlign: 'center',
};

const cardPreviewContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '25px',
  position: 'relative', // Para posicionar o CardBack e a pré-visualização
  minHeight: '350px', // Para dar espaço à carta
};

const textareaStyle: CSSProperties = {
  flexGrow: 1,
  padding: '15px', // Mais padding interno
  border: '1px solid #555',
  backgroundColor: '#3a3f47',
  color: '#e0e0e0',
  fontSize: '1em',
  boxSizing: 'border-box',
  resize: 'vertical',
  borderRadius: '6px', // Bordas mais suaves
  minHeight: '150px',
};

const buttonStyle: CSSProperties = {
  padding: '12px 25px',
  fontSize: '1.1em',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  backgroundColor: '#61dafb',
  color: '#20232a',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
};

// Categorias permitidas para criação pelo usuário (sem 'conexao' por enquanto)
const userCreatableCategories: Exclude<Card['category'], 'conexao'>[] = ['sensorial', 'poder', 'fantasia', 'exposicao'];

// Função para obter a cor de fundo e texto baseada na categoria (similar à de PlayingCard)
const getCategoryStyles = (category: Card['category']): { backgroundColor: string; color: string; borderColor: string } => {
  switch (category.toLowerCase()) {
    case 'sensorial': return { backgroundColor: '#FFD700', color: '#4A3B00', borderColor: '#B8860B' };
    case 'poder': return { backgroundColor: '#E53935', color: '#FFFFFF', borderColor: '#B71C1C' };
    case 'fantasia': return { backgroundColor: '#5E35B1', color: '#FFFFFF', borderColor: '#311B92' };
    case 'exposicao': return { backgroundColor: '#43A047', color: '#FFFFFF', borderColor: '#1B5E20' };
    case 'conexao': return { backgroundColor: '#FFFFFF', color: '#333333', borderColor: '#696969' }; // Branco com borda cinza escura
    default: return { backgroundColor: '#ECEFF1', color: '#263238', borderColor: '#90A4AE' };
  }
};

const cardVisualStyle: CSSProperties = {
  width: '250px', // Proporção de carta (ex: 2.5in)
  height: '350px', // Proporção de carta (ex: 3.5in)
  borderRadius: '12px',
  padding: '15px',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  position: 'relative', // Para posicionar elementos internos
  boxSizing: 'border-box',
  overflow: 'hidden', // Garante que cantos arredondados funcionem bem
  zIndex: 2, // Para ficar na frente do CardBack
};

const cardCornerStyle: CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  textAlign: 'center',
  lineHeight: '1',
};

const intensityNumberStyle: CSSProperties = {
  fontSize: '2.5em', // Número grande
  fontWeight: 'bold',
  display: 'block',
};

const suitStyle: CSSProperties = {
  fontSize: '0.7em',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'block',
  marginTop: '2px',
};

const cardCenterTextStyle: CSSProperties = {
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

function CreateUserCardModal({ isOpen, onClose, onSubmit }: CreateUserCardModalProps) {
  const [cardText, setCardText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Exclude<Card['category'], 'conexao'>>('sensorial');
  const [intensity, setIntensity] = useState<number>(1);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Limpa os campos ao abrir o modal
      setCardText('');
      setSelectedCategory('sensorial');
      setIntensity(1);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (cardText.trim()) {
      onSubmit(selectedCategory, cardText.trim(), intensity);
      // onClose(); // O fechamento agora é gerenciado pelo componente pai/hook que chama onSubmit
    }
  };

  const currentCategoryStyles = getCategoryStyles(selectedCategory);
  const dynamicCardStyle: CSSProperties = {
    ...cardVisualStyle,
    backgroundColor: currentCategoryStyles.backgroundColor,
    color: currentCategoryStyles.color,
    border: `8px solid ${currentCategoryStyles.borderColor}`, // Borda aumentada
  };
  const dynamicCornerStyle: CSSProperties = {
    ...cardCornerStyle,
    color: currentCategoryStyles.color, // Garante contraste do texto no canto
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-card-title">
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 id="create-card-title" style={{ marginTop: 0, color: '#61dafb', textAlign: 'center', marginBottom: '25px' }}>✨ Criar Nova Carta ✨</h2>

        <div style={controlsContainerStyle}>
          <div style={{ flexGrow: 1 }}>
            <label style={labelStyle} htmlFor="card-category">Categoria:</label>
            <select id="card-category" style={selectStyle} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as Exclude<Card['category'], 'conexao'>)}>
              {userCreatableCategories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="card-intensity">Intensidade:</label>
            <input
              type="number"
              id="card-intensity"
              style={inputNumberStyle}
              value={intensity}
              onChange={(e) => setIntensity(Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)))} // Limita entre 1 e 5
              min="1"
              max="5"
            />
          </div>
        </div>

        <div style={cardPreviewContainerStyle}>
          {/* CardBack como fundo da área de preview */}
          <div style={{ position: 'absolute', zIndex: 1, opacity: 0.8 /* Opacidade aumentada para melhor visibilidade */ }}>
            <CardBack />
          </div>

          {/* Pré-visualização da carta que o usuário está criando */}
          <div style={dynamicCardStyle}> {/* Este já tem zIndex: 2 implícito ou pode ser adicionado */}
            <div style={dynamicCornerStyle}>
              <span style={intensityNumberStyle}>{intensity}</span>
              <span style={suitStyle}>{selectedCategory.substring(0,3)}</span> {/* Ex: SEN, POD */}
            </div>
            <div style={cardCenterTextStyle}>
              <textarea 
                style={{...textareaStyle, backgroundColor: 'transparent', border: 'none', color: currentCategoryStyles.color, textAlign: 'center', fontSize: '1.1em'}} 
                value={cardText} 
                onChange={(e) => setCardText(e.target.value)} placeholder="Seu texto aqui..." />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}> {/* Botão centralizado */}
          <button style={buttonStyle} onClick={handleSubmit} disabled={!cardText.trim()}>
            Salvar Carta
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateUserCardModal;
