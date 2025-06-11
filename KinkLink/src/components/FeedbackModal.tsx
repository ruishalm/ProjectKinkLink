// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\FeedbackModal.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import styles from './FeedbackModal.module.css'; // Criaremos este CSS Module

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (feedbackText: string) => Promise<void>; // Função que lida com o envio
  initialText?: string; // Para preencher com texto existente, se houver
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmitFeedback, initialText = '' }) => {
  const [feedbackText, setFeedbackText] = useState(initialText);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // const { t } = useTranslation(); // Removido

  useEffect(() => {
    if (isOpen) {
      setFeedbackText(initialText); // Reseta o texto ao abrir
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialText]);

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feedbackText.trim()) {
      setError('Por favor, escreva seu feedback antes de enviar.'); // String fixa
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await onSubmitFeedback(feedbackText.trim());
      setSuccessMessage('Feedback enviado com sucesso! Obrigado.'); // String fixa
      setFeedbackText(''); // Limpa o campo após o envio bem-sucedido
      // Poderia fechar o modal automaticamente após um tempo ou deixar o usuário fechar
      // setTimeout(onClose, 2000); // Exemplo: fecha após 2 segundos
    } catch (err) {
      console.error("Erro ao enviar feedback:", err);
      setError('Erro ao enviar o feedback. Por favor, tente novamente.'); // String fixa
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
        <button onClick={onClose} className={styles.closeButtonTop} aria-label="Fechar">&times;</button>
        <h2 className={styles.title}>Enviar Feedback / Reportar Bug</h2>
        <p className={styles.instructions}>Encontrou um problema ou tem uma sugestão? Conte-nos! Seu feedback nos ajuda a melhorar o KinkLink.</p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Descreva o bug ou sua sugestão aqui..."
            rows={6}
            disabled={isSubmitting || !!successMessage}
          />
          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
          <div className={styles.buttonContainer}>
            <button type="button" onClick={onClose} className={`${styles.buttonSecondary} genericButton`} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={`${styles.buttonPrimary} genericButton`} disabled={isSubmitting || !feedbackText.trim() || !!successMessage}>
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
