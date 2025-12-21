// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\SignupPage.tsx
import React, { useState, type FormEvent, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import styles from './SignupPage.module.css'; // Importa os CSS Modules

function SignupPage() {
  const { t } = useTranslation();
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
        setError(t('signup_error_age'));
        return;
      }
    }

    if (!agreedToTerms) {
      setError(t('signup_error_terms'));
      return;
    }
    if (!username.trim()) {
      setError(t('signup_error_username_required'));
      return;
    }
    if (password.length < 6) {
      setError(t('signup_error_password_length'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('signup_error_password_mismatch'));
      return;
    }

    setIsSubmitting(true);
    const from = location.state?.from?.pathname || '/profile';
    try {
      // Passamos os novos campos para a função signup
      await signup(email, password, username.trim(), birthDate, gender);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMessage = t('signup_error_generic');
      let errorCode: string | undefined = undefined;

      if (typeof err === 'object' && err !== null && 'code' in err) {
        errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
          setError(t('signup_error_email_in_use'));
        } else {
          setError(errorMessage); // Para outros erros do Firebase não mapeados especificamente
        }
      } else if (err instanceof Error) {
        setError(err.message || errorMessage);
      } else {
        setError(t('signup_error_unknown'));
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
    return <div className={styles.pageContainer}><p>{t('signup_loading')}</p></div>;
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

        <h1 className={styles.pageTitle}>{t('signup_title')}</h1>
        <p className={styles.requiredInfoText}>
          <Trans i18nKey="signup_required_fields">
            Todos os campos marcados com <span className={styles.requiredAsterisk}>*</span> são obrigatórios.
          </Trans>
        </p>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>{t('signup_email_label')}
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
            <label htmlFor="username" className={styles.label}>{t('signup_username_label')}
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
            <label htmlFor="birthDate" className={styles.label}>{t('signup_birthdate_label')}
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
            <label htmlFor="gender" className={styles.label}>{t('signup_gender_label')}
              <span className={styles.requiredAsterisk}>*</span></label>
            <select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={styles.select} // Estilo para select
              required
            >
              <option value="">{t('signup_gender_select')}</option>
              <option value="homem_cis">{t('signup_gender_male_cis')}</option>
              <option value="mulher_cis">{t('signup_gender_female_cis')}</option>
              <option value="homem_trans">{t('signup_gender_male_trans')}</option>
              <option value="mulher_trans">{t('signup_gender_female_trans')}</option>
              <option value="nao_binario">{t('signup_gender_non_binary')}</option>
              <option value="outro_genero">{t('signup_gender_other')}</option>
              <option value="naoinformar_genero">{t('signup_gender_prefer_not_to_say')}</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>{t('signup_password_label')}
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
            {password.length > 0 && !isPasswordValidLength && <p className={styles.validationMessage}>{t('signup_validation_password_short')}</p>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>{t('signup_confirm_password_label')}
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
            {confirmPassword.length > 0 && password.length > 0 && !doPasswordsMatch && <p className={styles.validationMessage}>{t('signup_validation_passwords_dont_match')}</p>}
            {confirmPassword.length > 0 && password.length > 0 && doPasswordsMatch && !isPasswordValidLength && <p className={styles.validationMessage}>{t('signup_validation_original_password_short')}</p>}
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
              <Trans i18nKey="signup_terms_agreement">
                Eu li e concordo com os <Link to="/termos-de-servico" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>Termos de Serviço</Link>
              </Trans>
            </label>
          </div>
          <p className={styles.infoTextSmall}>
            {t('signup_privacy_tip')}
          </p>
          <button type="submit" className={`${styles.button} genericButton`} disabled={isSubmitting || authIsLoading || !canSubmit}>
            {isSubmitting ? t('signup_registering_button') : t('signup_register_button')}
          </button>
        </form>
        {error && <p className={styles.errorText}>{error}</p>}
        <p className={styles.navigationText}>
          <Trans i18nKey="signup_already_have_account_full">
            Já tem uma conta? <Link to="/login" className={styles.navigationLink}>Faça login</Link>
          </Trans>
        </p>
        <Link to="/" className={styles.navigationLink}>{t('login_back_to_home_link')}</Link>
      </main>
    </div>
  );
}

export default SignupPage;
