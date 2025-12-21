import React, { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import styles from './ForgotPasswordModal.module.css';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

/**
 * Modal que fornece um formulário para o usuário solicitar um e-mail de redefinição de senha.
 */
function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    if (!email.trim()) {
      setError(t('forgot_password_modal_error_no_email'));
      setIsSubmitting(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      // Exibe uma mensagem genérica por segurança, para não confirmar se um e-mail está ou não cadastrado.
      setMessage(t('forgot_password_modal_success_message'));
      setEmail('');
    } catch (err: unknown) {
      // O Firebase geralmente não retorna erros específicos aqui por segurança,
      // mas tratamos erros genéricos de rede, etc.
      let errorMessage = t('forgot_password_modal_error_generic');
      if (err instanceof Error) {
        // We don't want to show firebase errors to the user
        // errorMessage = err.message || errorMessage;
      }
      console.error("Erro em requestPasswordReset:", err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} klnkl-themed-panel`}>
        <button onClick={onClose} className={styles.closeButton}>&times;</button>
        <h2>{t('forgot_password_modal_title')}</h2>
        <p className={styles.instructions}>
          {t('forgot_password_modal_instructions')}
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="reset-email" className={styles.label}>{t('forgot_password_modal_email_label')}</label>
            <input
              type="email"
              id="reset-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>
          {/* Mensagens de sucesso ou erro */}
          {message && <p className={styles.successMessage}>{message}</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}
          
          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? t('forgot_password_modal_sending_button') : t('forgot_password_modal_send_button')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
