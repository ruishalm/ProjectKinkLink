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
      setInitialUsername(user.username || '');
      setInitialBio(user.bio || '');
    } else if (!authIsLoading) {
      // Se não está carregando e não tem usuário, redireciona para login
      // Isso pode ser redundante se você tiver ProtectedRoute/LinkedRoute no App.tsx
      // mas é uma boa salvaguarda.
      navigate('/login', { replace: true });
    }
  }, [user, authIsLoading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true }); // Redireciona para login após logout
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Adicionar feedback para o usuário aqui, se necessário
    }
  };

  const handleProfileUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (user && (username !== initialUsername || bio !== initialBio)) {
      try {
        await updateUser({ username, bio });
        setInitialUsername(username); // Atualiza os valores iniciais após salvar
        setInitialBio(bio);
        setIsEditing(false);
        // Adicionar feedback de sucesso para o usuário aqui, se desejar
      } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        // Adicionar feedback de erro para o usuário aqui, se desejar
      }
    } else {
      // Se nada mudou, apenas fecha o modo de edição
      setIsEditing(false);
    }
  };

  const handleEditClick = () => {
    // Ao clicar em editar, os campos já devem estar preenchidos com os valores atuais do usuário
    // (seja do estado inicial ou do último save).
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setUsername(initialUsername); // Restaura para os valores antes da edição atual
    setBio(initialBio);
    setIsEditing(false);
  };

  const handleResetTestData = async () => {
    if (window.confirm("Tem certeza que deseja resetar TODOS os dados de teste (cartas vistas, interações, matches e skins desbloqueadas)? Esta ação é para fins de desenvolvimento e deve ser feita em conjunto com seu par para correta sincronização.")) {
      try {
        await resetUserTestData();
        alert("Dados de teste resetados com sucesso!");
        // Opcional: forçar recarregamento da página ou do estado do usuário
        // window.location.reload(); // Ou uma forma mais suave de atualizar o estado
      } catch (error) {
        alert("Falha ao resetar os dados de teste. Verifique o console.");
        console.error("Erro ao resetar dados de teste:", error);
      }
    }
  };

  // Funções auxiliares para formatação
  const formatBirthDate = (dateString?: string): string => {
    if (!dateString) return 'Não informada';
    try {
      const [year, month, day] = dateString.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateString; 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return dateString; // Em caso de erro, retorna o original
    }
  };

  const getSexLabel = (sexValue?: string): string => {
    if (!sexValue) return 'Não informado';
    const labels: Record<string, string> = {
      'masculino': 'Masculino',
      'feminino': 'Feminino',
      'naoinformar_sexo': 'Prefiro não informar',
    };
    return labels[sexValue] || sexValue;
  };

  const getGenderLabel = (genderValue?: string): string => {
    if (!genderValue) return 'Não informada';
    const labels: Record<string, string> = {
      'homem_cis': 'Homem Cisgênero',
      'mulher_cis': 'Mulher Cisgênero',
      'homem_trans': 'Homem Transgênero',
      'mulher_trans': 'Mulher Transgênero',
      'nao_binario': 'Não-binário',
      'outro_genero': 'Outro',
      'naoinformar_genero': 'Prefiro não informar',
    };
    return labels[genderValue] || genderValue;
  };

  if (authIsLoading || !user) {
    // Mostra uma mensagem de carregamento mais genérica que cobre ambos os casos
    return <div className={styles.page}><p className={styles.infoText}>Carregando perfil...</p></div>;
  }

  const displayName = user.username || (user.email ? user.email.split('@')[0] : 'Usuário KinkLink');
  const hasProfileChanged = username !== initialUsername || bio !== initialBio;

  return (
    <div className={styles.page}>
      <main className={styles.mainContent}> {/* Envolve o conteúdo principal */}
        {/* Removido o estilo inline de cor, será controlado pelo CSS Module e variáveis */}
        <h1 className={`${styles.title} ${styles.textCenter}`} style={{borderBottom: 'none', marginBottom: '30px'}}>
          Meu Perfil
        </h1>

        {/* SEÇÃO DE DADOS PESSOAIS (EXPANSÍVEL/RECOLHÍVEL) */}
        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => setIsPersonalInfoOpen(!isPersonalInfoOpen)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && setIsPersonalInfoOpen(!isPersonalInfoOpen)}
            aria-expanded={isPersonalInfoOpen}
            aria-controls="personal-info-content"
          >
            <h2 className={styles.sectionTitleInHeader}>
              {isEditing ? 'Editar Dados Pessoais' : 'Seus Dados Pessoais'}
            </h2>
            <span className={`${styles.toggleIcon} ${!isPersonalInfoOpen ? styles.toggleIconClosed : ''}`}>
              ▼
            </span>
          </div>

          <div
            id="personal-info-content"
            className={`${styles.sectionContent} ${!isPersonalInfoOpen ? styles.sectionContentCollapsed : ''}`}
          >
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
                    placeholder="Como você quer ser chamado(a)?"
                  />
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label htmlFor="bio" className={styles.formLabel}>Bio:</label>
                  <textarea
                    id="bio"
                    className={styles.textarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    rows={4}
                  />
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={!hasProfileChanged ? styles.buttonDisabled : styles.button}
                    disabled={!hasProfileChanged}
                  >
                    Salvar Alterações
                  </button>
                  <button type="button" onClick={handleCancelEdit} className={styles.buttonCancel}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className={styles.infoText}><strong>Email:</strong> {user.email}</p>
                <p className={styles.infoText}><strong>Nome de Usuário:</strong> {displayName}</p>
                <p className={styles.infoText}><strong>Bio:</strong> {user.bio || 'Não definida'}</p>
                <p className={styles.infoText}><strong>Data de Nascimento:</strong> {formatBirthDate(user.birthDate)}</p>
                <p className={styles.infoText}><strong>Sexo Atribuído ao Nascer:</strong> {getSexLabel(user.sex)}</p>
                <p className={styles.infoText}><strong>Identidade de Gênero:</strong> {getGenderLabel(user.gender)}</p>
                <button onClick={handleEditClick} className={styles.button} style={{ marginTop: '20px' }}>
                  Editar Perfil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO DE VÍNCULO */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>Vínculo de Casal</h2>
          {user.linkedPartnerId ? (
            <>
              <p className={styles.infoText}>Você está vinculado! Explore os Links e converse com seu par.</p>
              <button onClick={() => navigate('/link-couple')} className={styles.actionButton}>
                Gerenciar Vínculo
              </button>
            </>
          ) : (
            <>
              <p className={styles.infoText}>Você ainda não está vinculado. Conecte-se com seu parceiro(a) para começar a diversão!</p>
              <button onClick={() => navigate('/link-couple')} className={styles.actionButton}>
                Vincular Agora
              </button>
            </>
          )}
        </div>
        
        {/* SEÇÃO DE SKINS */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>Personalização</h2>
          <Link to="/skins" className={styles.actionButton}>
            Minhas Skins
          </Link>
        </div>

        {/* SEÇÃO DE LOGOUT */}
        <div className={`${styles.section} ${styles.textCenter}`}>
          <button onClick={handleLogout} className={styles.buttonDestructive}>Logout</button>
        </div>

        {/* LINK DE VOLTAR */}
        <div className={`${styles.textCenter} ${styles.marginTop30}`}>
          <Link to="/cards" className={styles.link}>&larr; Voltar para as Cartas</Link>
        </div>

        {/* SEÇÃO DE RESET (DEV) */}
        <div className={`${styles.section} ${styles.textCenter} ${styles.marginTop50} ${styles.paddingTop20} ${styles.borderTopSolid}`}>
          <button
            onClick={handleResetTestData}
            className={styles.smallLink}
            aria-label="Resetar dados de teste para desenvolvimento"
          >
            Resetar Dados de Teste (Dev)
          </button>
          <p className={styles.warningText}>
            Atenção: Para correta sincronização, esta opção deve ser usada pelos dois usuários do casal simultaneamente.
          </p>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
