// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\ProfilePage.tsx
import React, { useState, useEffect, type FormEvent, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ProfilePage.module.css'; // Importa os CSS Modules

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
    return <div className={styles.page}><p>Carregando perfil...</p></div>;
  }

  // Lógica para nome de usuário padrão
  const displayName = user.username || (user.email ? user.email.split('@')[0] : 'Usuário KinkLink');

  // Verifica se houve alguma mudança nos campos para habilitar o botão Salvar
  const hasProfileChanged = username !== initialUsername || bio !== initialBio;

  return (
    <div className={styles.page}>
      <h1 className={`${styles.title} ${styles.textCenter}`} style={{borderBottom: 'none', color: '#64b5f6', marginBottom: '30px'}}>Meu Perfil</h1>

      {isEditing ? (
        <form onSubmit={handleProfileUpdate} className={styles.section}>
          <h2 className={styles.title}>Editar Perfil</h2>
          <div>
            <label htmlFor="username" className={styles.formLabel}>Nome de Usuário:</label>
            <input
              type="text"
              id="username"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="bio" className={styles.formLabel}>Bio:</label>
            <textarea
              id="bio"
              className={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className={styles.formActions}>
            <button 
              type="submit" 
              className={!hasProfileChanged ? styles.buttonDisabled : styles.button}
              disabled={!hasProfileChanged}
            >Salvar Alterações</button>
            <button type="button" onClick={() => setIsEditing(false)} className={styles.buttonCancel}>Cancelar</button>
          </div>
        </form>
      ) : (
        <Fragment>
          {/* SEÇÃO DE INFORMAÇÕES DO USUÁRIO (NOME/EMAIL PRIMEIRO) */}
          <div className={styles.section}>
            <h2 className={styles.title}>Suas Informações</h2>
            <p className={styles.infoText}><strong>Email:</strong> {user.email}</p>
            <p className={styles.infoText}><strong>Nome de Usuário:</strong> {displayName}</p>
            <p className={styles.infoText}><strong>Bio:</strong> {user.bio || 'Não definida'}</p>
            <button onClick={handleEditClick} className={styles.button}>Editar Perfil</button>
          </div>
        </Fragment>
      )}

      {/* SEÇÃO DE VÍNCULO (AGORA MAIS ACIMA E COM BOTÃO) */}
      <div className={styles.section}>
        <h2 className={styles.title}>Vínculo de Casal</h2>
        {user.linkedPartnerId ? (
          <>
            <p className={styles.infoText}>Você está vinculado! Explore os Links e converse com seu par.</p>
            <button onClick={() => navigate('/link-couple')} className={styles.actionButton}>
              Gerenciar Vínculo
            </button>
          </>
        ) : (
          <>
            <p className={styles.infoText}>Você ainda não está vinculado. Conecte-se com seu parceiro para começar a diversão!</p>
            <button onClick={() => navigate('/link-couple')} className={styles.actionButton}>
              Vincular Agora
            </button>
          </>
        )}
      </div>
      
      <div className={`${styles.section} ${styles.textCenter} ${styles.marginTop30}`}>
        <button onClick={handleLogout} className={styles.buttonDestructive}>Logout</button>
      </div>

      <div className={`${styles.textCenter} ${styles.marginTop30}`}>
        <Link to="/cards" className={styles.link}>&larr; Voltar para as Cartas</Link>
      </div>

      {/* Seção de Teste/Debug - Movida para o final e minimizada */}
      <div className={`${styles.textCenter} ${styles.marginTop50} ${styles.paddingTop20} ${styles.borderTopSolid444}`}>
        <a 
          onClick={handleResetTestData} 
          className={styles.smallLink}
          role="button" // Para acessibilidade, já que não é um link de navegação
          tabIndex={0} // Para ser focável
          onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleResetTestData();}} // Para ativação com teclado
        >Resetar Dados de Teste (Dev)</a>
        <p className={styles.warningText}>Atenção: Para correta sincronização, esta opção deve ser usada pelos dois usuários do casal simultaneamente.</p>
      </div>
    </div>
  );
}

export default ProfilePage;
