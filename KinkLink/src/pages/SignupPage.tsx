import React, { useState, type FormEvent, type CSSProperties, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false); // Novo estado para o checkbox
  const [error, setError] = useState<string | null>(null); // Para exibir mensagens de erro
  const [isLoading, setIsLoading] = useState(false); // Para feedback de carregamento
  const { signup, isLoading: authIsLoading } = useAuth(); // Pega signup e isLoading do AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile'; // Destino padrão após signup

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Limpa erros anteriores

    if (!agreedToTerms) {
      setError("Você precisa concordar com os Termos de Serviço para se cadastrar.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem!"); // Usar o estado de erro em vez de alert
      return;
    }
    console.log('Signup attempt com:', { email, password });

    setIsLoading(true); // Inicia o carregamento
    try {
      await signup(email, password); // Chama a função de signup do AuthContext
      navigate(from, { replace: true }); // Redireciona após cadastro bem-sucedido
    } catch (err: unknown) {
      const errorMessage = 'Falha ao tentar cadastrar. Tente novamente.'; // Alterado para const
      let errorCode: string | undefined = undefined;

      if (typeof err === 'object' && err !== null && 'code' in err) {
        errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
          setError('Este e-mail já está em uso. Tente fazer login ou use um e-mail diferente.');
        }
        // O Firebase já trata 'auth/weak-password' se a senha for curta, mas nossa validação manual é mais amigável.
        // Poderíamos adicionar mais mapeamentos de erro aqui se necessário.
      } else if (err instanceof Error) {
        setError(err.message || errorMessage);
      } else {
        setError('Ocorreu um erro desconhecido ao tentar cadastrar.');
      }
      console.error("Falha no cadastro:", errorCode || (err instanceof Error ? err.message : 'Erro desconhecido'), err);
    } finally {
      setIsLoading(false); // Finaliza o carregamento
    }
  };

  const pageContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    minHeight: '100vh', // Para ocupar a altura da tela
    padding: '20px', // Padding em todos os lados
    boxSizing: 'border-box', // Para o padding não aumentar a altura total
    backgroundColor: '#2c2c2c', // Fundo cinza escuro principal da página
    position: 'relative', // Para posicionar a marca d'água absolutamente
    overflow: 'hidden', // Para conter a marca d'água
  };

  const formContainerStyle: CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '25px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    zIndex: 1, // Para garantir que o formulário fique sobre a marca d'água
    textAlign: 'left',
  };

  const inputGroupStyle: CSSProperties = { marginBottom: '15px' };
  const labelStyle: CSSProperties = { display: 'block', marginBottom: '5px' };
  const inputStyle: CSSProperties = { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #555' };
  const buttonStyle: CSSProperties = { width: '100%', padding: '12px', marginTop: '10px', cursor: 'pointer' };
  const errorStyle: CSSProperties = { color: '#ff7b7b', marginTop: '10px', textAlign: 'center', fontSize: '0.9em' };
  const successBorderStyle: CSSProperties = { borderColor: '#4CAF50', borderWidth: '2px' }; // Verde para sucesso
  const warningBorderStyle: CSSProperties = { borderColor: '#ff9800', borderWidth: '2px' }; // Laranja para aviso

  // Estilos para a marca d'água de emojis (movido para antes da condição)
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

  // Se o AuthContext ainda está carregando o estado inicial do usuário, pode mostrar um loader
  if (authIsLoading) {
    return <div style={pageContainerStyle}><p>Carregando...</p></div>;
  }

  const isPasswordValidLength = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;

  // Condições para feedback visual e habilitação do botão
  const passwordFieldStyle = {
    ...inputStyle,
    ...(password.length > 0 && (isPasswordValidLength ? successBorderStyle : warningBorderStyle)),
  };
  const confirmPasswordFieldStyle = {
    ...inputStyle,
    ...(confirmPassword.length > 0 && password.length > 0 && (doPasswordsMatch && isPasswordValidLength ? successBorderStyle : warningBorderStyle)),
  };

  const canSubmit = email.length > 0 && isPasswordValidLength && doPasswordsMatch && agreedToTerms && !isLoading;

  return (
    <div style={pageContainerStyle}>
      {/* Container da Marca D'água - AGORA ABSOLUTO E PRIMEIRO FILHO */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // Atrás do conteúdo do pageContainerStyle
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {emojiWatermarkStyles.map((style, index) => (
          <span key={index} style={{ position: 'absolute', userSelect: 'none', color: '#888', /* Cor cinza para os emojis */ ...style }}>
            🚫🔞
          </span>
        ))}
      </div>
      {/* Conteúdo da Página */}
      {/* Adicionar zIndex: 1 para garantir que o conteúdo fique sobre a marca d'água */}
      <h1 style={{ zIndex: 1, position: 'relative' }}>Cadastro</h1>
      <form onSubmit={handleSubmit} style={formContainerStyle}>
        <div style={inputGroupStyle}>
          <label htmlFor="email" style={labelStyle}>Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle} // Email não precisa de borda dinâmica por enquanto
          />
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="password" style={labelStyle}>Senha:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={passwordFieldStyle}
          />
          {password.length > 0 && !isPasswordValidLength && <p style={{ color: '#ffcc80', fontSize: '0.9em', marginTop: '5px' }}>Senha muito curta (mínimo 6 caracteres).</p>}
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="confirmPassword" style={labelStyle}>Confirmar Senha:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={confirmPasswordFieldStyle}
          />
          {confirmPassword.length > 0 && password.length > 0 && !doPasswordsMatch && <p style={{ color: '#ffcc80', fontSize: '0.9em', marginTop: '5px' }}>As senhas não coincidem.</p>}
          {confirmPassword.length > 0 && password.length > 0 && doPasswordsMatch && !isPasswordValidLength && <p style={{ color: '#ffcc80', fontSize: '0.9em', marginTop: '5px' }}>A senha original ainda é muito curta.</p>}
        </div>
        {/* Checkbox para Termos de Serviço */}
        <div style={{ marginTop: '15px', marginBottom: '15px', fontSize: '0.9em', textAlign: 'left' }}>
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ marginRight: '8px', verticalAlign: 'middle' }}
          />
          <label htmlFor="terms" style={{ verticalAlign: 'middle' }}>
            Eu li e concordo com os{' '}
            <Link to="/termos-de-servico" target="_blank" rel="noopener noreferrer" style={{ color: '#64b5f6', textDecoration: 'underline' }}>
              Termos de Serviço
            </Link>
            {/* Adicionar link para Política de Privacidade quando tiver */}
            {/* e a <Link to="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" style={{color: '#64b5f6', textDecoration: 'underline'}}>Política de Privacidade</Link> */}
          </label>
        </div>
        <button type="submit" style={buttonStyle} disabled={isLoading || !canSubmit}>{isLoading ? 'Cadastrando...' : 'Cadastrar'}</button>
      </form>
      {error && <p style={{...errorStyle, zIndex: 1, position: 'relative'}}>{error}</p>}
      <p style={{ marginTop: '20px', zIndex: 1, position: 'relative' }}>Já tem uma conta? <Link to="/login">Faça login</Link></p>
      <Link to="/" style={{ marginTop: '10px', display: 'inline-block', zIndex: 1, position: 'relative' }}>Voltar para a Página Inicial</Link>
    </div>
  );
}

export default SignupPage;
