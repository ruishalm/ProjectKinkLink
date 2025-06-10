// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\SignupPage.tsx
import React, { useState, type FormEvent, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './SignupPage.module.css'; // Importa os CSS Modules
import { useTranslation } from 'react-i18next';

function SignupPage() {
  // Hooks e Estados
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // Novo estado para o nome de usuário
  const [birthDate, setBirthDate] = useState(''); // Data de Nascimento (YYYY-MM-DD)
  const [gender, setGender] = useState(''); // Identidade de gênero
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado local para o submit do formulário
  const { signup, isLoading: authIsLoading } = useAuth(); // isLoading do AuthContext é para o estado geral de autenticação
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  // Funções Auxiliares
  const calculateAge = (dateString: string): number => {
    const today = new Date();
    const birthDateObj = new Date(dateString);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  // Funções Manipuladoras
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < 18) {
        setError(t('signupPage.errorAgeRequirement'));
        return;
      }
    }

    if (!agreedToTerms) {
      setError(t('signupPage.errorTermsAgreement'));
      return;
    }
    if (!username.trim()) {
      setError(t('signupPage.errorUsernameRequired'));
      return;
    }
    if (password.length < 6) {
      setError(t('signupPage.errorPasswordMinLengthClient'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('signupPage.errorPasswordsDoNotMatchClient'));
      return;
    }

    setIsSubmitting(true);
    const from = location.state?.from?.pathname || '/profile';
    try {
      // Passamos os novos campos para a função signup
      await signup(email, password, username.trim(), birthDate, gender);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMessage = t('signupPage.errorGenericSignup');
      let errorCode: string | undefined = undefined;

      if (typeof err === 'object' && err !== null && 'code' in err) {
        errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
          setError(t('signupPage.errorEmailInUse'));
        } else if (errorCode === 'auth/weak-password') {
          setError(t('signupPage.errorWeakPassword'));
        } else {
          setError(errorMessage); // Para outros erros do Firebase não mapeados especificamente
        }
      } else if (err instanceof Error) {
        setError(err.message || errorMessage);
      } else {
        setError(t('signupPage.errorGenericSignup'));
      }
      console.error("Falha no cadastro:", errorCode || (err instanceof Error ? err.message : 'Erro desconhecido'), err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lógica de Renderização e Variáveis Auxiliares
  const emojiWatermarkStyles = useMemo(() => {
    const localStyles = [];
    const numEmojis = 25;
    for (let i = 0; i < numEmojis; i++) {
      localStyles.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        fontSize: `${Math.random() * 5 + 2.5}rem`,
        transform: `rotate(${Math.random() * 70 - 35}deg)`,
        opacity: Math.random() * 0.04 + 0.03,
      });
    }
    return localStyles;
  }, []);

  if (authIsLoading) {
    return <div className={styles.pageContainer}><p>{t('loading')}</p></div>;
  }

  const isPasswordValidLength = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;

  const getPasswordFieldClassName = () => {
    if (password.length === 0) return styles.input;
    return `${styles.input} ${isPasswordValidLength ? styles.successBorder : styles.warningBorder}`;
  };

  const getConfirmPasswordFieldClassName = () => {
    if (confirmPassword.length === 0 || password.length === 0) return styles.input;
    return `${styles.input} ${(doPasswordsMatch && isPasswordValidLength) ? styles.successBorder : styles.warningBorder}`;
  };

  const canSubmit =
    email.length > 0 &&
    username.trim().length > 0 &&
    birthDate.length > 0 && // Garante que a data de nascimento foi preenchida
    gender.length > 0 && // Agora obrigatório
    isPasswordValidLength &&
    doPasswordsMatch &&
    agreedToTerms &&
    !isSubmitting;

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

        <h1 className={styles.pageTitle}>{t('signupPage.title')}</h1>
        <p className={styles.requiredInfoText}>
          {t('signupPage.allFieldsRequired.part1')}<span className={styles.requiredAsterisk}>*</span>{t('signupPage.allFieldsRequired.part2')}
        </p>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>{t('signupPage.emailLabel')}
              <span className={styles.requiredAsterisk}>*</span></label>
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
            <label htmlFor="username" className={styles.label}>{t('signupPage.usernameLabel')}
              <span className={styles.requiredAsterisk}>*</span></label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input}
              minLength={3} // Exemplo de validação básica
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="birthDate" className={styles.label}>{t('signupPage.birthDateLabel')}
              <span className={styles.requiredAsterisk}>*</span></label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="gender" className={styles.label}>{t('signupPage.genderLabel')}
              <span className={styles.requiredAsterisk}>*</span></label>
            <select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={styles.select} // Estilo para select
              required
            >
              <option value="">{t('gender.select')}</option>
              <option value="homem_cis">{t('gender.homem_cis')}</option>
              <option value="mulher_cis">{t('gender.mulher_cis')}</option>
              <option value="homem_trans">{t('gender.homem_trans')}</option>
              <option value="mulher_trans">{t('gender.mulher_trans')}</option>
              <option value="nao_binario">{t('gender.nao_binario')}</option>
              <option value="outro_genero">{t('gender.outro_genero')}</option>
              <option value="naoinformar_genero">{t('gender.naoinformar_genero')}</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>{t('signupPage.passwordLabel')}
              <span className={styles.requiredAsterisk}>*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={getPasswordFieldClassName()}
            />
            {password.length > 0 && !isPasswordValidLength && <p className={styles.validationMessage}>{t('signupPage.validationPasswordTooShort')}</p>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>{t('signupPage.confirmPasswordLabel')}
              <span className={styles.requiredAsterisk}>*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={getConfirmPasswordFieldClassName()}
            />
            {confirmPassword.length > 0 && password.length > 0 && !doPasswordsMatch && <p className={styles.validationMessage}>{t('signupPage.validationPasswordsDoNotMatch')}</p>}
            {confirmPassword.length > 0 && password.length > 0 && doPasswordsMatch && !isPasswordValidLength && <p className={styles.validationMessage}>{t('signupPage.validationOriginalPasswordStillShort')}</p>}
          </div>
          <div className={styles.termsContainer}>
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className={styles.termsCheckbox}
            />
            <label htmlFor="terms" className={styles.termsLabel}>
              {t('signupPage.termsAgreement')}{' '}
              <Link to="/termos-de-servico" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>
                {t('signupPage.termsLink')}
              </Link>
            </label>
          </div>
          <p className={styles.infoTextSmall}>
            {t('signupPage.importantEmailInfo')}
          </p>
          <button type="submit" className={`${styles.button} genericButton`} disabled={isSubmitting || authIsLoading || !canSubmit}>
            {isSubmitting ? t('signupPage.submitting') : t('buttons.signup')}
          </button>
        </form>
        {error && <p className={styles.errorText}>{error}</p>}
        <p className={styles.navigationText}>
          {t('signupPage.loginPrompt')} <Link to="/login" className={styles.navigationLink}>{t('signupPage.loginLink')}</Link>
        </p>
        <Link to="/" className={styles.navigationLink}>{t('loginPage.backToHomeLink')}</Link>
      </main>
    </div>
  );
}

export default SignupPage;
