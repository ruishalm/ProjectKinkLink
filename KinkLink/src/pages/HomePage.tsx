import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React, { type CSSProperties, useEffect } from 'react'; // Adicionado React e useEffect

function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário está carregando, não faz nada ainda
    if (isLoading) {
      return;
    }
    // Se o usuário está logado E vinculado, redireciona para /cards
    if (user && user.linkedPartnerId) {
      navigate('/cards');
    }
    // Se o usuário está logado mas NÃO vinculado, o LinkedRoute em /cards cuidará disso,
    // mas idealmente ele nem deveria ver opções de "Ver Cartas" aqui.
    // Se não está logado, permanece na HomePage.
  }, [user, isLoading, navigate]);

  const pageContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 'calc(100vh - 150px)', // Ajusta altura considerando o header e um pouco de padding
    padding: '40px 20px',
    textAlign: 'center',
    fontFamily: '"Trebuchet MS", sans-serif',
    color: '#e0e0e0',
  };

  const titleStyle: CSSProperties = {
    fontSize: '3em',
    color: '#64b5f6', // Azul claro
    marginBottom: '15px',
  };

  const subTitleStyle: CSSProperties = {
    fontSize: '1.3em',
    color: '#b0b0b0',
    marginBottom: '40px',
    maxWidth: '600px',
  };

  const buttonContainerStyle: CSSProperties = {
    display: 'flex',
    gap: '20px',
  };

  const buttonStyle: CSSProperties = {
    padding: '15px 30px',
    fontSize: '1.2em',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'none',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
  };

  const primaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#64b5f6',
    color: '#2c2c2c',
  };

  const secondaryButtonStyle: CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#4caf50', // Verde
    color: 'white',
  };

  return (
    <div style={pageContainerStyle}>
      <h1 style={titleStyle}>Bem-vindo(a) ao KinkLink!</h1>
      <p style={subTitleStyle}>Descubra, explore e conecte-se com seu parceiro(a) de uma maneira totalmente nova.</p>
      <div style={buttonContainerStyle}>
        <Link to="/login" style={primaryButtonStyle}>Login</Link>
        <Link to="/signup" style={secondaryButtonStyle}>Cadastre-se</Link>
      </div>
    </div>
  );
}
export default HomePage;
