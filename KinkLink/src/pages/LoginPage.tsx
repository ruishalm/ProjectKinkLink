import React, { useState, type FormEvent, type CSSProperties, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Para exibir mensagens de erro
  const [isLoading, setIsLoading] = useState(false); // Para feedback de carregamento
  const { login, isLoading: authIsLoading } = useAuth(); // Pega isLoading do AuthContext também
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile'; // Destino padrão após login

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previne o recarregamento da página
    setError(null); // Limpa erros anteriores
    setIsLoading(true); // Inicia o carregamento

    try {
      await login(email, password); // Chama a função de login do AuthContext
      navigate(from, { replace: true }); // Redireciona após login bem-sucedido
    } catch (err: unknown) {
      console.error("Falha no login:", err);
      // Idealmente, mapear códigos de erro do Firebase para mensagens amigáveis
      if (err instanceof Error) {
        setError(err.message || 'Falha ao tentar fazer login. Verifique suas credenciais.');
      } else {
        setError('Ocorreu um erro desconhecido ao tentar fazer login.');
      }
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
  const errorStyle: CSSProperties = { color: 'red', marginTop: '10px', textAlign: 'center' };

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
      <h1 style={{ zIndex: 1, position: 'relative' }}>Login</h1>
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
        <button type="submit" style={buttonStyle} disabled={isLoading}>{isLoading ? 'Entrando...' : 'Entrar'}</button>
      </form>
      {error && <p style={{...errorStyle, zIndex: 1, position: 'relative'}}>{error}</p>}
      <p style={{ marginTop: '20px', zIndex: 1, position: 'relative' }}>Não tem uma conta? <Link to="/signup">Cadastre-se</Link></p>
      <Link to="/" style={{ marginTop: '10px', display: 'inline-block', zIndex: 1, position: 'relative' }}>Voltar para a Página Inicial</Link>
    </div>
  );
}

export default LoginPage;
