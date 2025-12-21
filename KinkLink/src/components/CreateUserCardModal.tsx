import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <h2 className={styles.modalTitle}>{t('create_user_card_title')}</h2>
        <form onSubmit={handleSubmit}>
          {/* Campo de Texto da Carta */}
          <div className={styles.formGroup}>
            <label htmlFor="card-text" className={styles.formLabel}>{t('create_user_card_text_label')}</label>
            <textarea
              id="card-text"
              ref={textareaRef}
              className={styles.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('create_user_card_placeholder')}
              rows={5}
              required
            />
            <div className={styles.symbolButtonsContainer}>
              <button type="button" onClick={() => handleInsertSymbol('★')} className={styles.symbolButton}>{t('create_user_card_insert_star')}</button>
              <button type="button" onClick={() => handleInsertSymbol('▲')} className={styles.symbolButton}>{t('create_user_card_insert_triangle')}</button>
            </div>
          </div>

          {/* Seletor de Categoria */}
          <div className={styles.formGroup}>
            <label htmlFor="card-category" className={styles.formLabel}>{t('create_user_card_category_label')}</label>
            <select
              id="card-category"
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value as Card['category'])}
            >
              <option value="sensorial">{t('category_sensorial')}</option>
              <option value="poder">{t('category_poder')}</option>
              <option value="fantasia">{t('category_fantasia')}</option>
              <option value="exposicao">{t('category_exposicao')}</option>
              {/* Conexão removida - categoria reservada para cartas do sistema */}
            </select>
          </div>

          {/* Seletor de Intensidade */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t('create_user_card_intensity_label')}</label>
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
              {t('create_user_card_notify_label')}
            </label>
          </div>

          {/* Botões de Ação */}
          <div className={styles.formActions}>
            <button type="submit" className={`${styles.button} genericButton`}>{t('create_user_card_submit_button')}</button>
            <button type="button" onClick={onClose} className={`${styles.buttonCancel} genericButton`}>{t('create_user_card_cancel_button')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserCardModal;