import React, { useState, useRef, useEffect } from 'react';
import styles from './CreateUserCardModal.module.css';
import type { Card } from '../data/cards';
import IntensitySelector from './IntensitySelector/IntensitySelector';

interface CreateUserCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Card['category'], text: string, intensity: number, notifyAsCreator: boolean) => void;
}

const CreateUserCardModal: React.FC<CreateUserCardModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<Card['category']>('sensorial');
  const [intensity, setIntensity] = useState(1);
  const [notifyAsCreator, setNotifyAsCreator] = useState(true);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (text.trim()) {
      onSubmit(category, text, intensity, notifyAsCreator);
      // Limpa o formulário para a próxima vez
      setText('');
      setCategory('sensorial');
      setIntensity(1);
      setNotifyAsCreator(true);
    }
  };

  const handleInsertSymbol = (symbol: '★' | '▲') => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = text.substring(0, start) + symbol + text.substring(end);
      setText(newText);
      // Foca no textarea e move o cursor para depois do símbolo inserido
      textarea.focus();
      // Usamos um timeout para garantir que o estado foi atualizado antes de mover o cursor
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
            {/* Botões para inserir símbolos */}
            <div className={styles.symbolButtonsContainer}>
              <button type="button" onClick={() => handleInsertSymbol('★')} className={styles.symbolButton}>Inserir ★</button>
              <button type="button" onClick={() => handleInsertSymbol('▲')} className={styles.symbolButton}>Inserir ▲</button>
            </div>
          </div>

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

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Intensidade:</label>
            <IntensitySelector
              currentLevel={intensity}
              onLevelChange={setIntensity}
            />
          </div>

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