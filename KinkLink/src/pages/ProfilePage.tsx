// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\ProfilePage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase'; // Import db
import { doc, getDoc } from 'firebase/firestore'; // Import firestore functions
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { user, logout, updateUser, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [gender, setGender] = useState(''); // Novo estado para gênero
  const [initialGender, setInitialGender] = useState(''); // Novo estado para gênero inicial
  const [initialBio, setInitialBio] = useState('');
  const [partnerInfo, setPartnerInfo] = useState<{ username?: string; email?: string | null } | null>(null);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true); // Começa aberto

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setGender(user.gender || ''); // Define o gênero
      setInitialGender(user.gender || ''); // Define o gênero inicial
      setInitialUsername(user.username || '');
      setInitialBio(user.bio || '');
    } else if (!authIsLoading) {
      // Se não está carregando e não tem usuário, redireciona para login
      // Isso pode ser redundante se você tiver ProtectedRoute/LinkedRoute no App.tsx
      // mas é uma boa salvaguarda.
      navigate('/login', { replace: true });
    }
  }, [user, authIsLoading, navigate]);

  useEffect(() => {
    if (user && user.linkedPartnerId && !partnerInfo) {
      const fetchPartnerInfo = async () => {
        try {
          const partnerDocRef = doc(db, 'users', user.linkedPartnerId!);
          const partnerDocSnap = await getDoc(partnerDocRef);
          if (partnerDocSnap.exists()) {
            const partnerData = partnerDocSnap.data() as { username?: string; email?: string | null }; // Simplificando o tipo User aqui
            setPartnerInfo({ username: partnerData.username, email: partnerData.email });
          } else {
            console.warn('ProfilePage: Documento do parceiro não encontrado.');
            setPartnerInfo({ username: 'Parceiro(a) não encontrado(a)' });
          }
        } catch (error) {
          console.error('ProfilePage: Erro ao buscar informações do parceiro:', error);
          setPartnerInfo({ username: 'Erro ao buscar parceiro(a)' });
        }
      };
      fetchPartnerInfo();
    } else if (user && !user.linkedPartnerId) {
      setPartnerInfo(null); // Limpa info do parceiro se desvinculado
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
    if (user && (username !== initialUsername || bio !== initialBio || gender !== initialGender)) {
      try {
        await updateUser({ username, bio, gender }); // Inclui gênero na atualização
        setInitialUsername(username); // Atualiza os valores iniciais após salvar
        setInitialGender(gender);
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
    setGender(initialGender); // Restaura gênero
    setIsEditing(false);
  };

  // Função comentada pois o botão que a utiliza está comentado
  // const handleResetTestData = async () => {
  //   if (window.confirm("Tem certeza que deseja resetar TODOS os dados de teste (cartas vistas, interações, matches e skins desbloqueadas)? Esta ação é para fins de desenvolvimento e deve ser feita em conjunto com seu par para correta sincronização.")) {
  //     try {
  //       await resetUserTestData();
  //       alert("Dados de teste resetados com sucesso!");
  //       // Opcional: forçar recarregamento da página ou do estado do usuário
  //       // window.location.reload(); // Ou uma forma mais suave de atualizar o estado
  //     } catch (error) {
  //       alert("Falha ao resetar os dados de teste. Verifique o console.");
  //       console.error("Erro ao resetar dados de teste:", error);
  //     }
  //   }
  // };

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
  const hasProfileChanged = username !== initialUsername || bio !== initialBio || gender !== initialGender;

  return (
    <div className={styles.page}>
      <main className={styles.mainContent}> {/* Envolve o conteúdo principal */}
        <div className={styles.pageHeader}>
          <h1 className={`${styles.title}`} style={{borderBottom: 'none', marginBottom: '0px', marginRight: 'auto'}}>
            Meu Perfil
          </h1>
          <button
            onClick={() => navigate('/cards')}
            className={`${styles.actionButton} ${styles.headerButton} genericButton`}
            aria-label="Ir para cartas"
          >
            Ir para cartas
          </button>
        </div>

        {/* SEÇÃO DE DADOS PESSOAIS (EXPANSÍVEL/RECOLHÍVEL) */}
        <div className={`${styles.section} klnkl-themed-panel`}>
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
                <div style={{ marginTop: '15px' }}>
                  <label htmlFor="gender" className={styles.formLabel}>Identidade de Gênero:</label>
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={styles.select} // Reutiliza o estilo do select da SignupPage
                    required // Pode ser opcional dependendo da sua lógica
                  >
                    <option value="">Selecione...</option>
                    <option value="homem_cis">Homem Cisgênero</option>
                    <option value="mulher_cis">Mulher Cisgênero</option>
                    <option value="homem_trans">Homem Transgênero</option>
                    <option value="mulher_trans">Mulher Transgênero</option>
                    <option value="nao_binario">Não-binário</option>
                    <option value="outro_genero">Outro</option>
                    <option value="naoinformar_genero">Prefiro não informar</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={`${!hasProfileChanged ? styles.buttonDisabled : styles.button} genericButton`}
                    disabled={!hasProfileChanged}
                  >
                    Salvar Alterações
                  </button>
                  <button type="button" onClick={handleCancelEdit} className={`${styles.buttonCancel} genericButton`}>
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
                <p className={styles.infoText}><strong>Identidade de Gênero:</strong> {getGenderLabel(user.gender)}</p>
                <button onClick={handleEditClick} className={`${styles.button} genericButton`} style={{ marginTop: '20px' }}>
                  Editar Perfil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO DE VÍNCULO */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>Vínculo de Casal</h2>
          {user.linkedPartnerId ? (
            <>
              <p className={styles.infoText}>
                Você está vinculado com: <strong>{partnerInfo?.username || partnerInfo?.email || user.linkedPartnerId.substring(0, 8) + "..."}</strong>
              </p>
              <p className={styles.infoText} style={{fontSize: '0.9em', opacity: 0.8, marginTop: '-5px', marginBottom: '15px'}}>
                Explore os Links e converse com seu par!
              </p>
              <button onClick={() => navigate('/link-couple')} className={`${styles.actionButton} genericButton`}>
                Gerenciar Vínculo
              </button>
            </>
          ) : (
            <>
              <p className={styles.infoText}>Você ainda não está vinculado. Conecte-se com seu parceiro(a) para começar a diversão!</p>
              <button onClick={() => navigate('/link-couple')} className={`${styles.actionButton} genericButton`}>
                Vincular Agora
              </button>
            </>
          )}
        </div>

        {/* SEÇÃO DE SKINS */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>Personalização</h2>
          <Link to="/skins" className={`${styles.actionButton} genericButton`}>
            Minhas Skins
          </Link>
        </div>

        {/* SEÇÃO DE LOGOUT */}
        <div className={`${styles.section} ${styles.textCenter} klnkl-themed-panel`}>
          <button onClick={handleLogout} className={`${styles.buttonDestructive} genericButton`}>Logout</button>
        </div>

        {/* SEÇÃO DE RESET (DEV) - TEMPORARIAMENTE OCULTADA */}
        {/*
        <div className={`${styles.section} ${styles.textCenter} ${styles.marginTop50} ${styles.paddingTop20} ${styles.borderTopSolid} klnkl-themed-panel`}>
          <button
            onClick={handleResetTestData}
            className={`${styles.buttonDestructive} genericButton`}
            aria-label="Recomeçar o jogo"
          >
            RECOMEÇAR
          </button>
          <p className={styles.warningText}>
            Zerar e recomeçar? Para sincronizar, apertem este botão juntos e iniciem uma nova exploração!
          </p>
        </div>
        */}
      </main>
    </div>
  );
}

export default ProfilePage;
