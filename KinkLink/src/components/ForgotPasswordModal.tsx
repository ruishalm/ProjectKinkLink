import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './ForgotPasswordModal.module.css';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

/**
 * Modal que fornece um formulário para o usuário solicitar um e-mail de redefinição de senha.
 */
function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
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
      setError("Por favor, insira seu endereço de e-mail.");
      setIsSubmitting(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      // Exibe uma mensagem genérica por segurança, para não confirmar se um e-mail está ou não cadastrado.
      setMessage("Se uma conta existir para este e-mail, um link de redefinição foi enviado. Verifique sua caixa de entrada e spam.");
      setEmail('');
    } catch (err: unknown) {
      // O Firebase geralmente não retorna erros específicos aqui por segurança,
      // mas tratamos erros genéricos de rede, etc.
      let errorMessage = "Ocorreu um erro ao tentar enviar o e-mail de redefinição.";
      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
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
        <h2>Recuperar Senha</h2>
        <p className={styles.instructions}>
          Digite o endereço de e-mail associado à sua conta KinkLink.
          Enviaremos um link para você redefinir sua senha.
        </p>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label htmlFor="reset-email" className={styles.label}>Email:</label>
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
            {isSubmitting ? 'Enviando...' : 'Enviar E-mail de Redefinição'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
