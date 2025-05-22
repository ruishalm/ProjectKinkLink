import { useState, type FormEvent, type CSSProperties } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile'; // Destino padrão após signup

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    console.log('Signup attempt com:', { email, password });
    // Simula o cadastro e login automático
    // No futuro, isso viria da sua API após um cadastro bem-sucedido
    login(email, 'user-456'); // Passa o email e um ID mockado diferente
    navigate(from, { replace: true }); // Redireciona para a página de origem ou perfil
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
        <button type="submit" style={buttonStyle}>Cadastrar</button>
      </form>
      <p style={{ marginTop: '20px' }}>Já tem uma conta? <Link to="/login">Faça login</Link></p>
      <Link to="/" style={{ marginTop: '10px', display: 'inline-block' }}>Voltar para a Página Inicial</Link>
    </div>
  );
}

export default SignupPage;
