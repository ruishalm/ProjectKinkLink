import { useState, type FormEvent, type CSSProperties } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Para exibir mensagens de erro
  const [isLoading, setIsLoading] = useState(false); // Para feedback de carregamento
  const { signup, isLoading: authIsLoading } = useAuth(); // Pega signup e isLoading do AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile'; // Destino padrão após signup

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Limpa erros anteriores

    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    console.log('Signup attempt com:', { email, password });

    setIsLoading(true); // Inicia o carregamento
    try {
      await signup(email, password); // Chama a função de signup do AuthContext
      navigate(from, { replace: true }); // Redireciona após cadastro bem-sucedido
    } catch (err: unknown) {
      const errorMessage = 'Falha ao tentar cadastrar. Tente novamente.';
      let errorCode: string | undefined = undefined;

      if (typeof err === 'object' && err !== null && 'code' in err) {
        errorCode = (err as { code: string }).code;
        if (errorCode === 'auth/email-already-in-use') {
          setError('Este e-mail já está em uso. Tente fazer login ou use um e-mail diferente.');
        }
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
    padding: '20px 0',
  };

  const formContainerStyle: CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    padding: '25px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    textAlign: 'left',
  };

  const inputGroupStyle: CSSProperties = { marginBottom: '15px' };
  const labelStyle: CSSProperties = { display: 'block', marginBottom: '5px' };
  const inputStyle: CSSProperties = { width: '100%', padding: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #555' };
  const buttonStyle: CSSProperties = { width: '100%', padding: '12px', marginTop: '10px', cursor: 'pointer' };
  const errorStyle: CSSProperties = { color: 'red', marginTop: '10px', textAlign: 'center' };

  // Se o AuthContext ainda está carregando o estado inicial do usuário, pode mostrar um loader
  if (authIsLoading) {
    return <div style={pageContainerStyle}><p>Carregando...</p></div>;
  }

  return (
    <div style={pageContainerStyle}>
      <h1>Cadastro</h1>
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
            style={inputStyle}
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
            style={inputStyle}
          />
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
            style={inputStyle}
          />
        </div>
        <button type="submit" style={buttonStyle} disabled={isLoading}>{isLoading ? 'Cadastrando...' : 'Cadastrar'}</button>
      </form>
      {error && <p style={errorStyle}>{error}</p>}
      <p style={{ marginTop: '20px' }}>Já tem uma conta? <Link to="/login">Faça login</Link></p>
      <Link to="/" style={{ marginTop: '10px', display: 'inline-block' }}>Voltar para a Página Inicial</Link>
    </div>
  );
}

export default SignupPage;
