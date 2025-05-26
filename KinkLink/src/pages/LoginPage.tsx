import React, { useState, type FormEvent, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css'; // Importa os CSS Modules

function LoginPage() {
  // Hooks e Estados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Renomeado de isLoading para evitar conflito
  const { login, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previne o recarregamento da página
    setError(null); // Limpa erros anteriores
    setIsSubmitting(true); // Inicia o carregamento

    try {
      const from = location.state?.from?.pathname || '/profile'; // Destino padrão após login
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
      setIsSubmitting(false); // Finaliza o carregamento
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

  if (authIsLoading) {
    return <div className={styles.pageContainer}><p>Carregando...</p></div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.watermarkContainer}>
        {emojiWatermarkStyles.map((style, index) => (
          <span key={index} className={styles.watermarkEmoji} style={style}>
            🚫🔞
          </span>
        ))}
      </div>

      <h1 className={styles.pageTitle}>Login</h1>
      <form onSubmit={handleSubmit} className={styles.formContainer}>
        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>Email:</label>
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
          <label htmlFor="password" className={styles.label}>Senha:</label>
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
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {error && <p className={styles.errorText}>{error}</p>}
      <p className={styles.navigationText}>
        Não tem uma conta? <Link to="/signup" className={styles.navigationLink}>Cadastre-se</Link>
      </p>
      <Link to="/" className={styles.navigationLink}>Voltar para a Página Inicial</Link>
    </div>
  );
}

export default LoginPage;
