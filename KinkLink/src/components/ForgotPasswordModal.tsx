import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Ajuste o caminho se necessário
import styles from './ForgotPasswordModal.module.css'; // Corrigido para .css
import { useTranslation } from 'react-i18next';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestPasswordReset } = useAuth(); // Precisaremos adicionar esta função ao AuthContext
  const { t } = useTranslation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    if (!email.trim()) {
      setError(t('modals.forgotPassword.errorEnterEmail'));
      setIsSubmitting(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      setMessage(t('modals.forgotPassword.successMessage'));
      setEmail(''); // Limpa o campo após o envio
    } catch (err: unknown) {
      const errorMessage = t('modals.forgotPassword.errorMessage'); // Usar a chave genérica do arquivo de tradução
      if (typeof err === 'object' && err !== null && 'code' in err) {
        // O Firebase geralmente não retorna erros específicos para sendPasswordResetEmail
        // por razões de segurança (para não revelar se um e-mail está ou não cadastrado).
        // Mas podemos tratar erros genéricos de rede, etc.
        console.error("Erro em requestPasswordReset:", (err as { code: string }).code, err);
      } else if (err instanceof Error) {
        // errorMessage = err.message || errorMessage; // A mensagem de erro do Firebase pode não ser ideal para o usuário
        console.error("Erro em requestPasswordReset:", err.message, err);
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modalContent} klnkl-themed-panel`}>
        <button onClick={onClose} className={styles.closeButton} aria-label={t('buttons.close')}>&times;</button>
        <h2>{t('modals.forgotPassword.title')}</h2>
        <p className={styles.instructions}>
          {t('modals.forgotPassword.instructions')}
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="reset-email" className={styles.label}>{t('modals.forgotPassword.emailLabel')}</label>
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
          {message && <p className={styles.successMessage}>{message}</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}
          <button type="submit" className={styles.button} disabled={isSubmitting}>
            {isSubmitting ? t('modals.forgotPassword.sendingButton') : t('modals.forgotPassword.sendResetEmailButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
