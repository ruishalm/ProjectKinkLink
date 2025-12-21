import React, { useState, type FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css'; // Importa os CSS Modules
import ForgotPasswordModal from '../components/ForgotPasswordModal'; // Importa o modal

function LoginPage() {
  const { t } = useTranslation();
  // Hooks e Estados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Renomeado de isLoading para evitar conflito
  const { login, loginWithGoogle, isLoading: authIsLoading } = useAuth(); // Adiciona loginWithGoogle
  const navigate = useNavigate();

  const [showEmailPasswordForm, setShowEmailPasswordForm] = useState(false); // Novo estado

  // Novo estado para controlar o modal de recuperação de senha
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previne o recarregamento da página
    setError(null); // Limpa erros anteriores
    setIsSubmitting(true); // Inicia o carregamento

    try {
      await login(email, password); // Chama a função de login do AuthContext
      // Redireciona para o perfil com um estado para mostrar o tutorial
      navigate('/profile', { replace: true, state: { showTutorial: true } });
    } catch (err: unknown) {
      console.error("Falha no login:", err); // Mantém o log completo do erro para debug
      let errorMessage = t('login_error_generic');

      if (typeof err === 'object' && err !== null && 'code' in err) {
        const firebaseError = err as { code: string; message: string }; // Type assertion
        switch (firebaseError.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-email': // O Firebase pode retornar isso se o email não estiver formatado corretamente
            errorMessage = t('login_error_user_not_found');
            break;
          case 'auth/wrong-password':
            errorMessage = t('login_error_wrong_password');
            break;
          case 'auth/invalid-credential': // Erro mais genérico para email/senha inválidos (SDKs mais recentes)
            errorMessage = t('login_error_invalid_credentials');
            break;
          default:
            // Para outros erros do Firebase, podemos usar a mensagem padrão ou uma genérica
            errorMessage = t('login_error_unexpected');
            console.error("Erro não mapeado do Firebase:", firebaseError.code, firebaseError.message);
        }
      } else {
        // Se não for um erro estruturado do Firebase, usa uma mensagem genérica
        errorMessage = t('login_error_unknown');
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false); // Finaliza o carregamento
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsSubmitting(true); // Usar o mesmo estado de carregamento
    try {
      await loginWithGoogle();
      // Redireciona para o perfil com um estado para mostrar o tutorial
      navigate('/profile', { replace: true, state: { showTutorial: true } });
    } catch (err: unknown) {
      console.error("Falha no login com Google:", err);
      if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message: string}).message || t('login_error_google_failed'));
      } else {
        setError(t('login_error_google_unknown'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lógica de Renderização e Variáveis Auxiliares
  const emojiWatermarkStyles = useMemo(() => {
    const styles = [];
    const numEmojis = 25; // Quantidade de emojis
    for (let i = 0; i < numEmojis; i++) {
      styles.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        fontSize: `${Math.random() * 5 + 2.5}rem`, // Tamanhos variando de 2.5rem a 7.5rem
        transform: `rotate(${Math.random() * 70 - 35}deg)`, // Rotação leve de -35 a +35 graus
        opacity: Math.random() * 0.04 + 0.03, // Opacidade sutil entre 0.03 e 0.07
      });
    }
    return styles;
  }, []);

  if (authIsLoading && !showForgotPasswordModal) { // Não mostrar loading se o modal estiver aberto
    return <div className={styles.pageContainer}><p>{t('login_loading')}</p></div>;
  }

  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}> {/* Envolve o conteúdo principal */}
        <div className={styles.watermarkContainer}>
          {emojiWatermarkStyles.map((style, index) => (
            <span key={index} className={styles.watermarkEmoji} style={style}>
              🚫🔞
            </span>
          ))}
        </div>

        <h1 className={styles.pageTitle}>{t('login_title')}</h1>

        {!showEmailPasswordForm && (
          <button
            type="button"
            className={`${styles.button} ${styles.revealFormButton}`}
            onClick={() => setShowEmailPasswordForm(true)}
            disabled={isSubmitting || authIsLoading}
          >
            {t('login_with_email_button')}
          </button>
        )}

        {showEmailPasswordForm && (
          <form onSubmit={handleSubmit} className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>{t('login_email_label')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>{t('login_password_label')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            <button type="submit" className={styles.button} disabled={isSubmitting || authIsLoading}>
              {isSubmitting ? t('login_signing_in_button') : t('login_sign_in_button')}
            </button>
            <div className={styles.forgotPasswordContainer}>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className={styles.forgotPasswordLink}
              >
                {t('login_forgot_password_button')}
              </button>
            </div>
          </form>
        )}

        <div className={styles.separatorContainer}>
          <span className={styles.separatorLine}></span>
          <span className={styles.separatorText}>{t('login_or_separator')}</span>
          <span className={styles.separatorLine}></span>
        </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className={`${styles.button} ${styles.googleButton}`} // Adicione uma classe específica para estilização
            disabled={isSubmitting || authIsLoading}
          >
            {isSubmitting && !showEmailPasswordForm ? t('login_wait_button') : t('login_google_button')}
          </button>

        {error && <p className={styles.errorText}>{error}</p>}
        <p className={styles.navigationText}>
          {t('login_no_account_text')} <Link to="/signup" className={styles.navigationLink}>{t('login_signup_link')}</Link>
        </p>
        <Link to="/" className={styles.navigationLink}>{t('login_back_to_home_link')}</Link>
      </main>

      {showForgotPasswordModal && (
        <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
      )}
    </div>
  );
}

export default LoginPage;
