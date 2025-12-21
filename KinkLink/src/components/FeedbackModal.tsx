// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\FeedbackModal.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './FeedbackModal.module.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (feedbackText: string) => Promise<void>;
  initialText?: string;
}

/**
 * Modal para que os usuários enviem feedback, sugestões ou reportem bugs.
 */
const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmitFeedback, initialText = '' }) => {
  // Estados para controlar o texto do formulário, e os estados de envio, erro e sucesso.
  const { t } = useTranslation();
  const [feedbackText, setFeedbackText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Efeito para resetar o estado do modal sempre que ele é aberto.
  useEffect(() => {
    if (isOpen) {
      setFeedbackText(initialText);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialText]);

  // Efeito para fechar o modal com a tecla 'Escape'.
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Lida com a submissão do formulário de feedback.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feedbackText.trim()) {
      setError(t('feedback_modal_error_empty'));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await onSubmitFeedback(feedbackText.trim());
      setSuccessMessage(t('feedback_modal_success'));
      setFeedbackText(''); // Limpa o campo após o envio.
    } catch (err) {
      console.error("Erro ao enviar feedback:", err);
      setError(t('feedback_modal_error_generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} klnkl-themed-panel`} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButtonTop} aria-label={t('feedback_modal_close_aria')}>&times;</button>
        <h2 className={styles.title}>{t('feedback_modal_title')}</h2>
        <p className={styles.instructions}>{t('feedback_modal_instructions')}</p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder={t('feedback_modal_placeholder')}
            rows={6}
            disabled={isSubmitting || !!successMessage}
          />
          
          {/* Mensagens de erro ou sucesso */}
          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
          
          {/* Botões de Ação */}
          <div className={styles.buttonContainer}>
            <button type="button" onClick={onClose} className={`${styles.buttonSecondary} genericButton`} disabled={isSubmitting}>
              {t('feedback_modal_cancel_button')}
            </button>
            <button type="submit" className={`${styles.buttonPrimary} genericButton`} disabled={isSubmitting || !feedbackText.trim() || !!successMessage}>
              {isSubmitting ? t('feedback_modal_sending_button') : t('feedback_modal_send_button')}
            </button>
          </div>
        </form>
        
        {/* Contato Alternativo */}
        <div className={styles.alternativeContact}>
          <p>{t('feedback_modal_or')}</p>
          <p>{t('feedback_modal_contact_us')} <a href="mailto:ruishalm.matzukan@gmail.com" className={styles.emailLink}>ruishalm.matzukan@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
