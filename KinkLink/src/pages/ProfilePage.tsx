// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\ProfilePage.tsx
import React, { useState, useEffect, type FormEvent, type CSSProperties, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Estilos
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
  width: 'calc(100% - 22px)',
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

const disabledButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#757575', // Cinza para desabilitado
  cursor: 'not-allowed',
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

const actionButtonStyle: React.CSSProperties = { // Novo estilo para o botão de vínculo
  display: 'inline-block',
  padding: '12px 25px',
  backgroundColor: '#64b5f6', // Azul claro
  color: 'white',
  textDecoration: 'none',
  borderRadius: '8px',
  textAlign: 'center',
  cursor: 'pointer',
  border: '2px solid #4a90e2', // Borda um pouco mais escura que o fundo do botão
  fontSize: '1em',
  fontWeight: 'bold',
  marginTop: '15px',
  transition: 'background-color 0.2s ease, border-color 0.2s ease',
};

const smallLinkStyle: CSSProperties = {
  color: '#aaa',
  textDecoration: 'underline',
  fontSize: '0.8em',
  cursor: 'pointer',
  display: 'inline-block', // Para permitir margin
};

const warningTextStyle: CSSProperties = {
  fontSize: '0.8em',
  color: '#ffcc80', // Laranja/amarelo para aviso
  marginTop: '5px',
};

function ProfilePage() {
  const { user, logout, updateUser, isLoading: authIsLoading, resetUserTestData } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialUsername, setInitialUsername] = useState(''); // Para rastrear o valor inicial
  const [initialBio, setInitialBio] = useState(''); // Para rastrear o valor inicial

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
    } else if (!authIsLoading) {
      navigate('/login');
    }
  }, [user, authIsLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (user) {
      try {
        await updateUser({ username, bio });
        setIsEditing(false);
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
      }
    }
  };

  const handleEditClick = () => {
    setInitialUsername(user?.username || ''); // Guarda os valores atuais antes de editar
    setInitialBio(user?.bio || '');
    setUsername(user?.username || ''); // Garante que os campos de edição comecem com os valores atuais
    setBio(user?.bio || '');
    setIsEditing(true);
  };
  const handleResetTestData = async () => {
    if (window.confirm("Tem certeza que deseja resetar TODOS os dados de teste (cartas vistas, interações e matches)? Esta ação é para fins de desenvolvimento.")) {
      try {
        await resetUserTestData();
        alert("Dados de teste (cartas vistas, interações, matches) resetados com sucesso!");
      } catch (error) {
        alert("Falha ao resetar os dados de teste. Verifique o console.");
        console.error("Erro ao resetar dados de teste:", error);
      }
    }
  };

  if (authIsLoading || !user) {
    return <div style={pageStyle}><p>Carregando perfil...</p></div>;
  }

  // Lógica para nome de usuário padrão
  const displayName = user.username || (user.email ? user.email.split('@')[0] : 'Usuário KinkLink');

  // Verifica se houve alguma mudança nos campos para habilitar o botão Salvar
  const hasProfileChanged = username !== initialUsername || bio !== initialBio;

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
            <button 
              type="submit" 
              style={!hasProfileChanged ? disabledButtonStyle : buttonStyle} 
              disabled={!hasProfileChanged}
            >Salvar Alterações</button>
            <button type="button" onClick={() => setIsEditing(false)} style={{...buttonStyle, backgroundColor: '#757575'}}>Cancelar</button>
          </div>
        </form>
      ) : (
        <Fragment>
          {/* SEÇÃO DE INFORMAÇÕES DO USUÁRIO (NOME/EMAIL PRIMEIRO) */}
          <div style={sectionStyle}>
            <h2 style={titleStyle}>Suas Informações</h2>
            <p style={infoTextStyle}><strong>Email:</strong> {user.email}</p>
            <p style={infoTextStyle}><strong>Nome de Usuário:</strong> {displayName}</p>
            <p style={infoTextStyle}><strong>Bio:</strong> {user.bio || 'Não definida'}</p>
            <button onClick={handleEditClick} style={buttonStyle}>Editar Perfil</button>
          </div>
        </Fragment>
      )}

      {/* SEÇÃO DE VÍNCULO (AGORA MAIS ACIMA E COM BOTÃO) */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>Vínculo de Casal</h2>
        {user.linkedPartnerId ? (
          <>
            <p style={infoTextStyle}>Você está vinculado! Explore os Links e converse com seu par.</p>
            <button 
              onClick={() => navigate('/link-couple')} 
              style={actionButtonStyle}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#4a90e2'; e.currentTarget.style.borderColor = '#357ABD'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#64b5f6'; e.currentTarget.style.borderColor = '#4a90e2'; }}
            >
              Gerenciar Vínculo
            </button>
          </>
        ) : (
          <>
            <p style={infoTextStyle}>Você ainda não está vinculado. Conecte-se com seu parceiro para começar a diversão!</p>
            <button 
              onClick={() => navigate('/link-couple')} 
              style={actionButtonStyle}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#4a90e2'; e.currentTarget.style.borderColor = '#357ABD'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#64b5f6'; e.currentTarget.style.borderColor = '#4a90e2'; }}
            >
              Vincular Agora
            </button>
          </>
        )}
      </div>
      
      <div style={{ ...sectionStyle, textAlign: 'center', marginTop: '30px' }}>
        <button onClick={handleLogout} style={destructiveButtonStyle}>Logout</button>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link to="/cards" style={linkStyle}>&larr; Voltar para as Cartas</Link>
      </div>

      {/* Seção de Teste/Debug - Movida para o final e minimizada */}
      <div style={{ textAlign: 'center', marginTop: '50px', paddingTop: '20px', borderTop: '1px solid #444' }}>
        <a 
          onClick={handleResetTestData} 
          style={smallLinkStyle}
          role="button" // Para acessibilidade, já que não é um link de navegação
          tabIndex={0} // Para ser focável
          onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleResetTestData();}} // Para ativação com teclado
        >Resetar Dados de Teste (Dev)</a>
        <p style={warningTextStyle}>Atenção: Para correta sincronização, esta opção deve ser usada pelos dois usuários do casal simultaneamente.</p>
      </div>
    </div>
  );
}

export default ProfilePage;
