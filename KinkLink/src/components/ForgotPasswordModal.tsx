import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Ajuste o caminho se necessário
import styles from './ForgotPasswordModal.module.css'; // Corrigido para .css

interface ForgotPasswordModalProps {
  onClose: () => void;
}

function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestPasswordReset } = useAuth(); // Precisaremos adicionar esta função ao AuthContext

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
      setMessage("Se uma conta existir para este e-mail, um link de redefinição foi enviado. Verifique sua caixa de entrada e spam.");
      setEmail(''); // Limpa o campo após o envio
    } catch (err: unknown) {
      let errorMessage = "Ocorreu um erro ao tentar enviar o e-mail de redefinição.";
      if (typeof err === 'object' && err !== null && 'code' in err) {
        // O Firebase geralmente não retorna erros específicos para sendPasswordResetEmail
        // por razões de segurança (para não revelar se um e-mail está ou não cadastrado).
        // Mas podemos tratar erros genéricos de rede, etc.
        console.error("Erro em requestPasswordReset:", (err as { code: string }).code, err);
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
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
