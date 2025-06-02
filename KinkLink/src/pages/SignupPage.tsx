// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\SignupPage.tsx
import React, { useState, type FormEvent, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './SignupPage.module.css'; // Importa os CSS Modules

function SignupPage() {
  // Hooks e Estados
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // Novo estado para o nome de usuário
  const [birthDate, setBirthDate] = useState(''); // Data de Nascimento (YYYY-MM-DD)
  const [sex, setSex] = useState(''); // Sexo biológico
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
        setError("Você precisa ter pelo menos 18 anos para se cadastrar.");
        return;
      }
    }

    if (!agreedToTerms) {
      setError("Você precisa concordar com os Termos de Serviço para se cadastrar.");
      return;
    }
    if (!username.trim()) {
      setError("Por favor, insira um nome de usuário.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem!");
      return;
    }

    setIsSubmitting(true);
    const from = location.state?.from?.pathname || '/profile';
    try {
      // Passamos os novos campos para a função signup
      await signup(email, password, username.trim(), birthDate, sex, gender);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMessage = 'Falha ao tentar cadastrar. Tente novamente.';
      let errorCode: string | undefined = undefined;

      if (typeof err === 'object' && err !== null && 'code' in err) {
        errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
          setError('Este e-mail já está em uso. Tente fazer login ou use um e-mail diferente.');
        } else {
          setError(errorMessage); // Para outros erros do Firebase não mapeados especificamente
        }
      } else if (err instanceof Error) {
        setError(err.message || errorMessage);
      } else {
        setError('Ocorreu um erro desconhecido ao tentar cadastrar.');
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
    return <div className={styles.pageContainer}><p>Carregando...</p></div>;
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
    sex.length > 0 && // Agora obrigatório
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

        <h1 className={styles.pageTitle}>Cadastro</h1>
        <p className={styles.requiredInfoText}>
          Todos os campos marcados com <span className={styles.requiredAsterisk}>*</span> são obrigatórios.
        </p>
        <form onSubmit={handleSubmit} className={styles.formContainer}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>Email:
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
            <label htmlFor="username" className={styles.label}>Nome de Usuário:
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
            <label htmlFor="birthDate" className={styles.label}>Data de Nascimento:
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
            <label htmlFor="sex" className={styles.label}>Sexo Atribuído ao Nascer:
              <span className={styles.requiredAsterisk}>*</span></label>
            <select
              id="sex"
              name="sex"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className={styles.select} // Estilo para select
              required
            >
              <option value="">Selecione...</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              {/* <option value="intersexo">Intersexo</option> Removido */}
              <option value="naoinformar_sexo">Prefiro não informar</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="gender" className={styles.label}>Identidade de Gênero:
              <span className={styles.requiredAsterisk}>*</span></label>
            <select
              id="gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={styles.select} // Estilo para select
              required
            >
              <option value="">Selecione...</option>
              <option value="homem_cis">Homem Cisgênero</option>
              <option value="mulher_cis">Mulher Cisgênero</option>
              <option value="homem_trans">Homem Transgênero</option>
              <option value="mulher_trans">Mulher Transgênero</option>
              <option value="nao_binario">Não-binário</option>
              <option value="outro_genero">Outro</option>
              <option value="naoinformar_genero">Prefiro não informar</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>Senha:
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
            {password.length > 0 && !isPasswordValidLength && <p className={styles.validationMessage}>Senha muito curta (mínimo 6 caracteres).</p>}
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirmar Senha:
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
            {confirmPassword.length > 0 && password.length > 0 && !doPasswordsMatch && <p className={styles.validationMessage}>As senhas não coincidem.</p>}
            {confirmPassword.length > 0 && password.length > 0 && doPasswordsMatch && !isPasswordValidLength && <p className={styles.validationMessage}>A senha original ainda é muito curta.</p>}
          </div>
          <div className={styles.termsContainer}>
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className={styles.termsCheckbox}
            />
            <label htmlFor="terms" className={styles.termsLabel}> {/* Não é obrigatório por asterisco, mas é pela lógica */}
              Eu li e concordo com os{' '}
              <Link to="/termos-de-servico" target="_blank" rel="noopener noreferrer" className={styles.termsLink}>
                Termos de Serviço
              </Link>
            </label>
          </div>
          <p className={styles.infoTextSmall}>
            Importante: Utilize um endereço de e-mail ao qual você tenha acesso. Ele será usado para recuperação de senha caso necessário.
          </p>
          <button type="submit" className={`${styles.button} genericButton`} disabled={isSubmitting || authIsLoading || !canSubmit}>
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        {error && <p className={styles.errorText}>{error}</p>}
        <p className={styles.navigationText}>
          Já tem uma conta? <Link to="/login" className={styles.navigationLink}>Faça login</Link>
        </p>
        <Link to="/" className={styles.navigationLink}>Voltar para a Página Inicial</Link>
      </main>
    </div>
  );
}

export default SignupPage;
