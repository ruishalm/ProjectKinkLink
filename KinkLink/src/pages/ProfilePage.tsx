// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\ProfilePage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { user, logout, updateUser, isLoading: authIsLoading, resetUserTestData } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [initialBio, setInitialBio] = useState('');
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true); // Começa aberto

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      // Define os valores iniciais também para a verificação de 'hasProfileChanged'
      setInitialUsername(user.username || '');
      setInitialBio(user.bio || '');
    } else if (!authIsLoading) {
      navigate('/login');
    }
  }, [user, authIsLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      // A navegação será tratada pelo ProtectedRoute ou lógica similar no App.tsx
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (user) {
      try {
        await updateUser({ username, bio });
        setInitialUsername(username); // Atualiza os valores iniciais após salvar
        setInitialBio(bio);
        setIsEditing(false);
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        // Adicionar feedback de erro para o usuário aqui, se desejar
      }
    }
  };

  const handleEditClick = () => {
    // Os valores de username e bio já devem estar atualizados pelo useEffect ou pelo último save.
    // Os valores iniciais são usados para comparação.
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setUsername(initialUsername); // Restaura para os valores antes da edição
    setBio(initialBio);
    setIsEditing(false);
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

  const displayName = user.username || (user.email ? user.email.split('@')[0] : 'Usuário KinkLink');
  const hasProfileChanged = username !== initialUsername || bio !== initialBio;

  return (
    <div className={styles.page}>
      <h1 className={`${styles.title} ${styles.textCenter}`} style={{borderBottom: 'none', color: '#64b5f6', marginBottom: '30px'}}>Meu Perfil</h1>

      {/* SEÇÃO DE DADOS PESSOAIS (EXPANSÍVEL/RECOLHÍVEL) */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} onClick={() => setIsPersonalInfoOpen(!isPersonalInfoOpen)}>
          <h2 className={styles.sectionTitleInHeader}>
            {isEditing ? 'Editar Dados Pessoais' : 'Seus Dados Pessoais'}
          </h2>
          <span className={isPersonalInfoOpen ? styles.toggleIcon : styles.toggleIconClosed}>
            {isPersonalInfoOpen ? '▼' : '▶'}
          </span>
        </div>

        <div className={`${styles.sectionContent} ${!isPersonalInfoOpen ? styles.sectionContentCollapsed : ''}`}>
          {isEditing ? (
            <form onSubmit={handleProfileUpdate}>
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
                <button type="button" onClick={handleCancelEdit} className={styles.buttonCancel}>Cancelar</button>
              </div>
            </form>
          ) : (
            <div>
              <p className={styles.infoText}><strong>Email:</strong> {user.email}</p>
              <p className={styles.infoText}><strong>Nome de Usuário:</strong> {displayName}</p>
              <p className={styles.infoText}><strong>Bio:</strong> {user.bio || 'Não definida'}</p>
              <button onClick={handleEditClick} className={styles.button} style={{ marginTop: '10px' }}>Editar Perfil</button>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO DE VÍNCULO */}
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

      {/* Seção de Teste/Debug */}
      <div className={`${styles.textCenter} ${styles.marginTop50} ${styles.paddingTop20} ${styles.borderTopSolid444}`}>
        <a 
          onClick={handleResetTestData} 
          className={styles.smallLink}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleResetTestData();}}
          aria-label="Resetar dados de teste para desenvolvimento"
        >Resetar Dados de Teste (Dev)</a>
        <p className={styles.warningText}>Atenção: Para correta sincronização, esta opção deve ser usada pelos dois usuários do casal simultaneamente.</p>
      </div>
    </div>
  );
}

export default ProfilePage;
