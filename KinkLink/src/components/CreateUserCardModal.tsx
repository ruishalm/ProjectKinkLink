import React, { useState, useRef, useEffect } from 'react';
import styles from './CreateUserCardModal.module.css';
import type { Card } from '../data/cards';
import IntensitySelector from './IntensitySelector/IntensitySelector';

interface CreateUserCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Card['category'], text: string, intensity: number, notifyAsCreator: boolean) => void;
}

/**
 * Modal com um formulário para que os usuários criem suas próprias cartas personalizadas.
 */
const CreateUserCardModal: React.FC<CreateUserCardModalProps> = ({ isOpen, onClose, onSubmit }) => {
  // Estados para controlar os campos do formulário.
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Card['category']>('sensorial');
  const [intensity, setIntensity] = useState(1);
  const [notifyAsCreator, setNotifyAsCreator] = useState(true);
  
  const modalContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Efeito para fechar o modal com a tecla 'Escape' ou ao clicar fora dele.
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Lida com a submissão do formulário.
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (text.trim()) {
      onSubmit(category, text, intensity, notifyAsCreator);
      // Limpa o formulário para a próxima criação.
      setText('');
      setCategory('sensorial');
      setIntensity(1);
      setNotifyAsCreator(true);
    }
  };

  // Permite que o usuário insira símbolos especiais (★, ▲) no textarea.
  const handleInsertSymbol = (symbol: '★' | '▲') => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.substring(0, start) + symbol + text.substring(end);
      setText(newText);
      
      // Foca e posiciona o cursor após o símbolo inserido.
      textarea.focus();
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} klnkl-themed-panel`} ref={modalContentRef}>
        <h2 className={styles.modalTitle}>Criar Nova Carta</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo de Texto da Carta */}
          <div className={styles.formGroup}>
            <label htmlFor="card-text" className={styles.formLabel}>Texto da Carta:</label>
            <textarea
              id="card-text"
              ref={textareaRef}
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: ★ faz uma massagem sensual em ▲..."
              rows={5}
              required
            />
            <div className={styles.symbolButtonsContainer}>
              <button type="button" onClick={() => handleInsertSymbol('★')} className={styles.symbolButton}>Inserir ★</button>
              <button type="button" onClick={() => handleInsertSymbol('▲')} className={styles.symbolButton}>Inserir ▲</button>
            </div>
          </div>

          {/* Seletor de Categoria */}
          <div className={styles.formGroup}>
            <label htmlFor="card-category" className={styles.formLabel}>Categoria:</label>
            <select
              id="card-category"
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value as Card['category'])}
            >
              <option value="sensorial">Sensorial</option>
              <option value="poder">Poder</option>
              <option value="fantasia">Fantasia</option>
              <option value="exposicao">Exposição</option>
              {/* Conexão removida - categoria reservada para cartas do sistema */}
            </select>
          </div>

          {/* Seletor de Intensidade */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Intensidade:</label>
            <IntensitySelector
              currentLevel={intensity}
              onLevelChange={setIntensity}
            />
          </div>

          {/* Opção de Notificação */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={notifyAsCreator}
                onChange={(e) => setNotifyAsCreator(e.target.checked)}
              />
              Notificar meu par que esta carta foi criada por mim
            </label>
          </div>

          {/* Botões de Ação */}
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.button} genericButton`}>Criar Carta</button>
            <button type="button" onClick={onClose} className={`${styles.buttonCancel} genericButton`}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserCardModal;