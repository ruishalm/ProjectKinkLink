// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\ProfilePage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation,  } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import styles from './ProfilePage.module.css';
import IntensitySelector from '../components/IntensitySelector/IntensitySelector';
import TutorialModal from '../components/TutorialModal'; // Importa o novo modal

// Interface para a carta serializada, onde Timestamps são convertidos para string.
// Isso evita o uso de 'any' e fornece um tipo claro para o array.
interface ExtractedUserCard {
  id: string;
  text: string;
  category: string; // Usando string genérico para simplicidade
  intensity?: number;
  createdBy?: string;
  coupleId?: string;
  createdAt?: string; // Timestamps são convertidos para string
  isCreatorSuggestion?: boolean;
}

function ProfilePage() {
  const { t } = useTranslation();
  const { user, userSymbol, logout, updateUser, isLoading: authIsLoading, resetNonMatchedSeenCards } = useAuth(); // Adicionado userSymbol do contexto
  const { appNotificationStatus, isNotificationProcessing, enableNotifications } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [gender, setGender] = useState(''); // Novo estado para gênero
  const [initialGender, setInitialGender] = useState(''); // Novo estado para gênero inicial
  const [initialBio, setInitialBio] = useState('');
  const [partnerInfo, setPartnerInfo] = useState<{ username?: string; email?: string | null } | null>(null);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);

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

  // Abre o tutorial se o estado de navegação indicar
  useEffect(() => {
    if (location.state?.showTutorial) {
      setIsTutorialModalOpen(true);
      // Limpa o estado da localização para não reabrir o modal em um refresh da página
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  useEffect(() => {
    // Nova arquitetura: busca partner do couple document
    if (user && user.coupleId) {
      const fetchPartnerInfo = async () => {
        try {
          // Buscar couple para pegar o partnerId
          const coupleDocRef = doc(db, 'couples', user.coupleId!);
          const coupleDocSnap = await getDoc(coupleDocRef);
          
          if (coupleDocSnap.exists()) {
            const coupleData = coupleDocSnap.data();
            const partnerId = coupleData.members.find((id: string) => id !== user.id);
            
            if (partnerId) {
              const partnerDocRef = doc(db, 'users', partnerId);
              const partnerDocSnap = await getDoc(partnerDocRef);
              if (partnerDocSnap.exists()) {
                const partnerData = partnerDocSnap.data() as { username?: string; email?: string | null };
                setPartnerInfo({ username: partnerData.username, email: partnerData.email });
              } else {
                console.warn('ProfilePage: Documento do parceiro não encontrado.');
                setPartnerInfo({ username: t('profile_partner_not_found') });
              }
            }
          } else {
            console.warn('ProfilePage: Documento do couple não encontrado.');
            setPartnerInfo({ username: t('profile_partner_not_found') });
          }
        } catch (error) {
          console.error('ProfilePage: Erro ao buscar informações do parceiro:', error);
          setPartnerInfo({ username: t('profile_error_fetching_partner') });
        }
      };
      fetchPartnerInfo();
    } else if (user && !user.coupleId) {
      setPartnerInfo(null); // Limpa info do parceiro se desvinculado
    }
  }, [user, user?.coupleId, t]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true }); // Redireciona para login após logout
    } catch (error) {
      console.error(t('profile_error_logout'), error);
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
        console.error(t('profile_error_update'), error);
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

  const handleResetDisliked = async () => {
    if (window.confirm(t('profile_reset_disliked_confirm'))) {
      try {
        await resetNonMatchedSeenCards();
        alert(t('profile_reset_disliked_success'));
      } catch (error) {
        alert(t('profile_reset_disliked_fail'));
        console.error("Erro ao reavaliar cartas descartadas:", error);
      }
    }
  };

  const handleIntensityChange = async (newLevel: number) => {
    if (user?.id) {
      try {
        // Usa a função updateUser do AuthContext para garantir que o estado local e o firestore estejam em sincronia
        await updateUser({ maxIntensity: newLevel });
        // Opcional: Adicionar um toast/feedback de sucesso
        console.log(`[ProfilePage] Intensidade atualizada para o nível ${newLevel}`);
      } catch (error) {
        console.error("Erro ao atualizar a intensidade:", error);
        // Opcional: Adicionar um toast/feedback de erro
      }
    }
  };

  const handleExtractUserCards = async () => {
    // Trava de segurança para garantir que apenas admins executem esta função
    if (!user?.isAdmin) {
      console.error("Acesso negado: Apenas administradores podem extrair userCards.");
      alert(t('profile_admin_extract_user_cards_denied'));
      return;
    }
    alert(t('profile_admin_extract_user_cards_start'));
    try {
      const userCardsQuery = collection(db, 'userCards');
      const querySnapshot = await getDocs(userCardsQuery);

      if (querySnapshot.empty) {
        alert(t('profile_admin_extract_user_cards_not_found'));
        return;
      }

      const allUserCards: ExtractedUserCard[] = [];
      querySnapshot.forEach((doc) => {
        // Converte Timestamps para strings ISO para melhor serialização
        const data = doc.data();
        const serializableData = { ...data };
        if (data.createdAt && data.createdAt.toDate) {
          serializableData.createdAt = data.createdAt.toDate().toISOString();
        }

        allUserCards.push({
          id: doc.id,
          ...serializableData,
        } as ExtractedUserCard);
      });

      // Cria um blob com o JSON
      const jsonString = JSON.stringify(allUserCards, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Cria um link para download e simula o clique
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'userCards_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro ao extrair cartas de usuário:", error);
      alert(t('profile_admin_extract_error'));
    }
  };

  const handleExtractMainCards = async () => {
    alert(t('profile_admin_extract_main_cards_start'));
    try {
      const cardsQuery = collection(db, 'cards');
      const querySnapshot = await getDocs(cardsQuery);

      if (querySnapshot.empty) {
        alert(t('profile_admin_extract_main_cards_not_found'));
        return;
      }

      const allMainCards: ExtractedUserCard[] = []; // Reutilizando a interface
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const serializableData = { ...data };
        if (data.createdAt && data.createdAt.toDate) {
          serializableData.createdAt = data.createdAt.toDate().toISOString();
        }

        allMainCards.push({
          id: doc.id,
          ...serializableData,
        } as ExtractedUserCard);
      });

      const jsonString = JSON.stringify(allMainCards, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'main_cards_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao extrair cartas principais:", error);
      alert(t('profile_admin_extract_error'));
    }
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
    if (!dateString) return t('profile_data_not_informed');
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
    if (!genderValue) return t('profile_data_not_informed');
    const labels: Record<string, string> = {
      'homem_cis': t('profile_gender_male_cis'),
      'mulher_cis': t('profile_gender_female_cis'),
      'homem_trans': t('profile_gender_male_trans'),
      'mulher_trans': t('profile_gender_female_trans'),
      'nao_binario': t('profile_gender_non_binary'),
      'outro_genero': t('profile_gender_other'),
      'naoinformar_genero': t('profile_gender_prefer_not_to_say'),
    };
    return labels[genderValue] || genderValue;
  };

  if (authIsLoading || !user) {
    // Mostra uma mensagem de carregamento mais genérica que cobre ambos os casos
    return <div className={styles.page}><p className={styles.infoText}>{t('profile_loading')}</p></div>;
  }

  const displayName = user.username || (user.email ? user.email.split('@')[0] : t('profile_default_username'));
  const hasProfileChanged = username !== initialUsername || bio !== initialBio || gender !== initialGender;

  return (
    <div className={styles.page}>
      <main className={styles.mainContent}> {/* Envolve o conteúdo principal */}
        <div className={styles.pageHeader}>
          <div className={styles.titleContainer}>
            <h1 className={`${styles.title}`} style={{borderBottom: 'none', marginBottom: '0px', marginRight: 'auto'}}>
              {t('profile_title')}
            </h1>
            {userSymbol && (
              <div className={styles.userSymbolIndicator}>{t('profile_you_are_symbol', { userSymbol })}</div>
            )}
          </div>
          <button
            onClick={() => navigate('/cards')}
            className={`${styles.actionButton} ${styles.headerButton} genericButton`}
            aria-label={t('profile_go_to_cards_button')}
          >
            {t('profile_go_to_cards_button')}
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
              {isEditing ? t('profile_edit_personal_data_title') : t('profile_personal_data_title')}
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
                    placeholder={t('profile_username_placeholder')}
                  />
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label htmlFor="bio" className={styles.formLabel}>Bio:</label>
                  <textarea
                    id="bio"
                    className={styles.textarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('profile_bio_placeholder')}
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
                    <option value="">{t('profile_gender_select_placeholder')}</option>
                    <option value="homem_cis">{t('profile_gender_male_cis')}</option>
                    <option value="mulher_cis">{t('profile_gender_female_cis')}</option>
                    <option value="homem_trans">{t('profile_gender_male_trans')}</option>
                    <option value="mulher_trans">{t('profile_gender_female_trans')}</option>
                    <option value="nao_binario">{t('profile_gender_non_binary')}</option>
                    <option value="outro_genero">{t('profile_gender_other')}</option>
                    <option value="naoinformar_genero">{t('profile_gender_prefer_not_to_say')}</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={`${!hasProfileChanged ? styles.buttonDisabled : styles.button} genericButton`}
                    disabled={!hasProfileChanged}
                  >
                    {t('profile_save_changes_button')}
                  </button>
                  <button type="button" onClick={handleCancelEdit} className={`${styles.buttonCancel} genericButton`}>
                    {t('profile_cancel_button')}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className={styles.infoText}><strong>{t('profile_email_label')}</strong> {user.email}</p>
                <p className={styles.infoText}><strong>{t('profile_username_label')}</strong> {displayName}</p>
                <p className={styles.infoText}><strong>{t('profile_bio_label')}</strong> {user.bio || t('profile_bio_not_defined')}</p>
                <p className={styles.infoText}><strong>{t('profile_birthdate_label')}</strong> {formatBirthDate(user.birthDate)}</p>
                <p className={styles.infoText}><strong>{t('profile_gender_identity_label')}</strong> {getGenderLabel(user.gender)}</p>
                <button onClick={handleEditClick} className={`${styles.button} genericButton`} style={{ marginTop: '20px' }}>
                  {t('profile_edit_button')}
                </button>
              </div>
            )}
            {/* Seção de Notificação (Lógica Simplificada) */}
            {!isEditing && (
              <>
                <hr className={styles.separator} />
                <div className={styles.profileActionsContainer}>
                  <div className={styles.actionItem}>
                    <div className={styles.actionItemHeader}>
                      <label className={styles.formLabel}>{t('profile_notifications_title')}</label>
                      <button
                        onClick={enableNotifications}
                        disabled={appNotificationStatus === 'enabled' || appNotificationStatus === 'denied' || isNotificationProcessing}
                        className={`${styles.button} ${styles.smallButton} genericButton`}
                      >
                        {isNotificationProcessing ? t('profile_notifications_waiting') : appNotificationStatus === 'enabled' ? t('profile_notifications_enabled') : appNotificationStatus === 'denied' ? t('profile_notifications_denied') : t('profile_notifications_activate_button')}
                      </button>
                    </div>
                    <p className={styles.actionItemDescription}>{t('profile_notifications_description')}</p>
                  </div>
                  <div className={styles.actionItem}>
                    <div className={styles.actionItemHeader}>
                      <label className={styles.formLabel}>{t('profile_quick_guide_title')}</label>
                      <button onClick={() => setIsTutorialModalOpen(true)} className={`${styles.button} ${styles.smallButton} genericButton`}>{t('profile_show_tutorial_button')}</button>
                    </div>
                    <p className={styles.actionItemDescription}>{t('profile_quick_guide_description')}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <TutorialModal
          isOpen={isTutorialModalOpen}
          onClose={() => setIsTutorialModalOpen(false)}
        />

        {/* SEÇÃO DE VÍNCULO */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>{t('profile_couple_link_section_title')}</h2>
          {user.coupleId ? (
            <>              
              <p className={styles.infoText}>
                {t('profile_couple_linked_with')}{' '}
                <strong>
                  {partnerInfo?.username || partnerInfo?.email || '...'} ({userSymbol === '★' ? '▲' : '★'})
                </strong>
              </p>
              <p className={styles.infoText}>
                {t('profile_playing_as')} <strong>{userSymbol}</strong>
              </p>
              
              <p className={styles.infoText} style={{fontSize: '0.9em', opacity: 0.8, marginTop: '-5px', marginBottom: '15px'}}>
                {t('profile_explore_links_and_chat')}
              </p>
              <button onClick={() => navigate('/link-couple')} className={`${styles.actionButton} genericButton`}>
                {t('profile_manage_link_button')}
              </button>
            </>
          ) : (
            <>
              <p className={styles.infoText}>{t('profile_not_linked_message')}</p>
              <button onClick={() => navigate('/link-couple')} className={`${styles.actionButton} genericButton`}>
                {t('profile_link_now_button')}
              </button>
            </>
          )}
        </div>

        {/* SEÇÃO DE SKINS */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>{t('profile_personalization_section_title')}</h2>
          <Link to="/skins" className={`${styles.actionButton} genericButton`}>
            {t('profile_my_skins_button')}
          </Link>
        </div>

        {/* SEÇÃO DE FILTRO DE INTENSIDADE */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>{t('profile_intensity_filter_section_title')}</h2>
          <IntensitySelector
            currentLevel={user?.maxIntensity ?? 8} // Usa 8 (mostrar tudo) como padrão se não definido
            onLevelChange={handleIntensityChange}
          />
        </div>

        {/* SEÇÃO DE REAVALIAR CARTAS */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>{t('profile_game_options_section_title')}</h2>
          <button onClick={handleResetDisliked} className={`${styles.actionButton} genericButton`}>
            {t('profile_reassess_discarded_cards_button')}
          </button>
        </div>

        {/* SEÇÃO DE LOGOUT */}
        <div className={`${styles.section} ${styles.textCenter} klnkl-themed-panel`}>
          <button onClick={handleLogout} className={`${styles.buttonDestructive} genericButton`}>{t('profile_logout_button')}</button>
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
        {/* SEÇÃO DE FERRAMENTAS DE DESENVOLVEDOR (APENAS PARA ADMINS) */}
        {user?.isAdmin && (
          <div className={`${styles.section} ${styles.textCenter} klnkl-themed-panel`}>
            <h2 className={styles.sectionTitleInHeader} style={{ borderBottom: 'none', marginBottom: '15px' }}>{t('profile_developer_tools_section_title')}</h2>
            <Link to="/admin/users" className={`${styles.actionButton} genericButton`}>
              {t('profile_manage_users_button')}
            </Link>
            <button onClick={handleExtractUserCards} className={`${styles.actionButton} genericButton`}>
              {t('profile_extract_usercards_json_button')}
            </button>
            <button onClick={handleExtractMainCards} className={`${styles.actionButton} genericButton`} style={{marginTop: '10px'}}>
              {t('profile_extract_maincards_json_button')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;
