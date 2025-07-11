// CreateUserCardModal.tsx
import React, { useState, useEffect } from 'react';
import type { Card } from '../data/cards'; // Importa o tipo Card para usar a união de categorias
import CardBack from './CardBack'; // Importa o CardBack
import styles from './CreateUserCardModal.module.css'; // Importa os CSS Modules

interface CreateUserCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Card['category'], text: string, intensity: number, notifyAsCreator: boolean) => void;
}

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

function CreateUserCardModal({ isOpen, onClose, onSubmit }: CreateUserCardModalProps) {
  // Hooks e Estados
  const [cardText, setCardText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Exclude<Card['category'], 'conexao'>>('sensorial');
  const [intensity, setIntensity] = useState<number>(1);
  const [notifyPartnerAsCreator, setNotifyPartnerAsCreator] = useState(true); // Novo estado

  // Efeito para resetar os campos quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      // Limpa os campos ao abrir o modal
      setCardText('');
      setSelectedCategory('sensorial');
      setIntensity(1);
      setNotifyPartnerAsCreator(true); // Resetar ao abrir
    }
  }, [isOpen]); // Este efeito depende apenas de isOpen

  // Efeito para adicionar e remover o listener da tecla Escape
  useEffect(() => {
    if (!isOpen) {
      return; // Não faz nada se o modal não estiver aberto
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]); // Este efeito depende de isOpen e da função onClose

  if (!isOpen) return null;

  // Funções Manipuladoras
  const handleSubmit = () => {
    if (cardText.trim()) {
      onSubmit(selectedCategory, cardText.trim(), intensity, notifyPartnerAsCreator); // Passa o novo estado
      // onClose(); // O fechamento agora é gerenciado pelo componente pai/hook que chama onSubmit
    }
  };

  // Lógica de Renderização e Variáveis Auxiliares
  const currentCategoryStyles = getCategoryStyles(selectedCategory);
  const dynamicCardStyle = {
    backgroundColor: currentCategoryStyles.backgroundColor,
    color: currentCategoryStyles.color,
    border: `8px solid ${currentCategoryStyles.borderColor}`, // Borda aumentada
  };
  const dynamicCornerStyle = {
    color: currentCategoryStyles.color, // Garante contraste do texto no canto
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="create-card-title">
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <h2 id="create-card-title" className={styles.headerTitle}>✨ Criar Nova Carta ✨</h2>

        <div className={styles.controlsContainer}>
          <div className={styles.controlGroup}>
            <label className={styles.label} htmlFor="card-category">Categoria:</label>
            <select id="card-category" className={styles.select} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as Exclude<Card['category'], 'conexao'>)}>
              {userCreatableCategories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className={styles.controlGroup}> {/* Usar controlGroup genérico */}
            <label className={styles.label} htmlFor="card-intensity">Intensidade:</label>
            <div className={styles.intensityCounter}>
              <button
                type="button"
                className={styles.counterButton}
                onClick={() => setIntensity(prev => Math.max(1, prev - 1))}
                disabled={intensity <= 1}
                aria-label="Diminuir intensidade"
              >
                -
              </button>
              <span className={styles.counterValueDisplay} id="card-intensity" aria-live="polite">
                {intensity}
              </span>
              <button
                type="button"
                className={styles.counterButton}
                onClick={() => setIntensity(prev => Math.min(9, prev + 1))}
                disabled={intensity >= 9}
                aria-label="Aumentar intensidade"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Checkbox para notificar o parceiro */}
        <div className={styles.notifyPartnerContainer}>
          <input
            type="checkbox"
            id="notify-partner-checkbox"
            checked={notifyPartnerAsCreator}
            onChange={(e) => setNotifyPartnerAsCreator(e.target.checked)}
            className={styles.checkboxInput}
          />
          <label htmlFor="notify-partner-checkbox" className={styles.checkboxLabel}>
            Avisar parceiro(a) que esta carta é minha sugestão?
          </label>
        </div>

        <div className={styles.cardPreviewContainer}>
          {/* CardBack como fundo da área de preview */}
          <div className={styles.cardBackPreview}>
            <CardBack targetWidth={125} targetHeight={175} />
          </div>

          {/* Pré-visualização da carta que o usuário está criando */}
          <div className={styles.cardVisual} style={dynamicCardStyle}>
            <div className={styles.cardCorner} style={dynamicCornerStyle}>
              <span className={styles.intensityNumber}>{intensity}</span>
              <span className={styles.suit}>{selectedCategory.substring(0,3)}</span> {/* Ex: SEN, POD */}
            </div>
            <div className={styles.cardCenterText}>
              <textarea 
                className={styles.textarea}
                style={{ color: currentCategoryStyles.color }} // Apenas a cor dinâmica aqui
                value={cardText} 
                onChange={(e) => setCardText(e.target.value)} placeholder="Seu texto aqui..." />
            </div>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <button className={`${styles.buttonSecondary} genericButton`} onClick={onClose}>
            Cancelar
          </button>
          <button className={`${styles.button} genericButton`} onClick={handleSubmit} disabled={!cardText.trim()}>
            Criar Carta
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateUserCardModal;
