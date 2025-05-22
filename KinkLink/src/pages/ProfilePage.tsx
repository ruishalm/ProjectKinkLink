// d:\Projetos\Github\app\KinkLink\KinkLink\src\pages\ProfilePage.tsx
import React, { useState, useEffect, type FormEvent, type CSSProperties, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions'; // Para contadores de conexão

// Estilos (baseados no que tínhamos em LinkCouplePage e adaptados)
const pageStyle: CSSProperties = {
  maxWidth: '700px',
  margin: '40px auto',
  padding: '30px',
  backgroundColor: '#2c2c2c',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
  color: '#e0e0e0',
  fontFamily: '"Trebuchet MS", sans-serif',
};

const sectionStyle: CSSProperties = {
  marginBottom: '30px',
  padding: '25px',
  backgroundColor: '#353535',
  borderRadius: '8px',
  border: '1px solid #444',
};

const titleStyle: CSSProperties = {
  marginTop: 0,
  color: '#64b5f6',
  marginBottom: '20px',
  borderBottom: '1px solid #4a4a4a',
  paddingBottom: '10px',
};

const inputStyle: CSSProperties = {
  width: 'calc(100% - 22px)', // Ajuste para padding
  padding: '12px',
  marginBottom: '15px',
  border: '1px solid #555',
  borderRadius: '6px',
  backgroundColor: '#404040',
  color: '#e0e0e0',
  fontSize: '1em',
  boxSizing: 'border-box',
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: '100px',
  resize: 'vertical',
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#64b5f6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
  marginRight: '10px',
};

const destructiveButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#f44336',
};

const infoTextStyle: CSSProperties = {
  fontSize: '1.1em',
  lineHeight: '1.6',
  marginBottom: '10px',
  color: '#c0c0c0',
};

const linkStyle: CSSProperties = {
  color: '#64b5f6',
  textDecoration: 'none',
  fontSize: '1em',
};

function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const { conexaoAcceptedCount, conexaoRejectedCount } = useUserCardInteractions(); // Obtém os contadores
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
    } else {
      // Se não houver usuário (ex: após logout), redireciona para login
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    // navigate('/login'); // O ProtectedRoute já deve cuidar do redirecionamento
  };

  const handleProfileUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (user) {
      updateUser({ username, bio });
      setIsEditing(false); // Sai do modo de edição após salvar
    }
  };

  if (!user) {
    return <div style={pageStyle}><p>Carregando perfil...</p></div>; // Ou um spinner
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ textAlign: 'center', color: '#64b5f6', marginBottom: '30px' }}>Meu Perfil</h1>

      {isEditing ? (
        <form onSubmit={handleProfileUpdate} style={sectionStyle}>
          <h2 style={titleStyle}>Editar Perfil</h2>
          <div>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nome de Usuário:</label>
            <input
              type="text"
              id="username"
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bio" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bio:</label>
            <textarea
              id="bio"
              style={textareaStyle}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div style={{ marginTop: '20px' }}>
            <button type="submit" style={buttonStyle}>Salvar Alterações</button>
            <button type="button" onClick={() => setIsEditing(false)} style={{...buttonStyle, backgroundColor: '#757575'}}>Cancelar</button>
          </div>
        </form>
      ) : (
        <Fragment>
          {/* Exibição dos contadores de Conexão para M3.T9 */}
          <div style={{ ...sectionStyle, backgroundColor: '#383838' }}>
            <h3 style={{ marginTop: 0, color: '#80cbc4', borderBottom: '1px solid #4a4a4a', paddingBottom: '8px', marginBottom: '15px' }}>Estatísticas de Conexão (Debug M3)</h3>
            <p style={infoTextStyle}>
              Gestos de Conexão Aceitos: <strong style={{ color: '#a5d6a7' }}>{conexaoAcceptedCount}</strong>
            </p>
            <p style={infoTextStyle}>
              Gestos de Conexão Rejeitados: <strong style={{ color: '#ef9a9a' }}>{conexaoRejectedCount}</strong>
            </p>
          </div>


          <div style={sectionStyle}>
            <h2 style={titleStyle}>Suas Informações</h2>
            <p style={infoTextStyle}><strong>Email:</strong> {user.email}</p>
            <p style={infoTextStyle}><strong>Nome de Usuário:</strong> {user.username || 'Não definido'}</p>
            <p style={infoTextStyle}><strong>Bio:</strong> {user.bio || 'Não definida'}</p>
            <button onClick={() => setIsEditing(true)} style={buttonStyle}>Editar Perfil</button>
          </div>
        </Fragment>
      )}

      <div style={sectionStyle}>
        <h2 style={titleStyle}>Vínculo de Casal</h2>
        {user.linkedPartnerId ? (
          <p style={infoTextStyle}>Você está vinculado com um parceiro. <Link to="/link-couple" style={linkStyle}>Gerenciar Vínculo</Link></p>
        ) : (
          <p style={infoTextStyle}>Você não está vinculado. <Link to="/link-couple" style={linkStyle}>Vincular agora</Link></p>
        )}
      </div>

      <div style={{ ...sectionStyle, textAlign: 'center' }}>
        <button onClick={handleLogout} style={destructiveButtonStyle}>Logout</button>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link to="/cards" style={linkStyle}>&larr; Voltar para as Cartas</Link>
      </div>
    </div>
  );
}

export default ProfilePage;
