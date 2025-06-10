// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\ProfilePage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './ProfilePage.module.css';
import { useTranslation } from 'react-i18next';

function ProfilePage() {
  const { user, logout, updateUser, isLoading: authIsLoading, resetUserTestData } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [gender, setGender] = useState(''); // Novo estado para gênero
  const [initialGender, setInitialGender] = useState(''); // Novo estado para gênero inicial
  const [initialBio, setInitialBio] = useState('');
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(true); // Começa aberto
  const { t } = useTranslation();

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

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true }); // Redireciona para login após logout
    } catch (error) {
      console.error(t('profilePage.errorLogout'), error);
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
        alert(t('profilePage.updateSuccessAlert'));
      } catch (error) {
        console.error(t('profilePage.errorUpdate'), error);
        alert(t('profilePage.updateErrorAlert'));
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

  const handleResetTestData = async () => {
    if (window.confirm(t('profilePage.resetSection.confirmMessage'))) {
      try {
        await resetUserTestData();
        alert(t('profilePage.resetSection.successAlert'));
        // Opcional: forçar recarregamento da página ou do estado do usuário
        // window.location.reload(); // Ou uma forma mais suave de atualizar o estado
      } catch (error) {
        alert(t('profilePage.resetSection.errorAlert'));
        console.error(t('profilePage.errorResetTestData'), error);
      }
    }
  };

  // Funções auxiliares para formatação
  const formatBirthDate = (dateString?: string): string => {
    if (!dateString) return t('profilePage.notInformed');
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

  if (authIsLoading || !user) {
    // Mostra uma mensagem de carregamento mais genérica que cobre ambos os casos
    return (
      <div className={styles.page}>
        <p className={styles.infoText}>{t('profilePage.loadingProfile')}</p>
      </div>
    );
  }

  const displayName = user.username || (user.email ? user.email.split('@')[0] : 'Usuário KinkLink');
  const hasProfileChanged = username !== initialUsername || bio !== initialBio || gender !== initialGender;

  return (
    <div className={styles.page}>
      <main className={styles.mainContent}> {/* Envolve o conteúdo principal */}
        <div className={styles.pageHeader}>
          <h1 className={`${styles.title}`} style={{borderBottom: 'none', marginBottom: '0px', marginRight: 'auto'}}>
            {t('profilePage.title')}
          </h1>
          <button
            onClick={() => navigate('/cards')}
            className={`${styles.actionButton} ${styles.headerButton} genericButton`}
            aria-label={t('profilePage.goToCardsButton')}
          >
            {t('profilePage.goToCardsButton')}
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
              {isEditing ? t('profilePage.editTitle') : t('profilePage.personalDataSectionTitle')}
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
                  <label htmlFor="username" className={styles.formLabel}>{t('profilePage.usernameLabel')}</label>
                  <input
                    type="text"
                    id="username"
                    className={styles.input}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('profilePage.usernamePlaceholder')}
                  />
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label htmlFor="bio" className={styles.formLabel}>{t('profilePage.bioLabel')}</label>
                  <textarea
                    id="bio"
                    className={styles.textarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t('profilePage.bioPlaceholder')}
                    rows={4}
                  />
                </div>
                <div style={{ marginTop: '15px' }}>
                  <label htmlFor="gender" className={styles.formLabel}>{t('profilePage.genderLabel')}</label>
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={styles.select} // Reutiliza o estilo do select da SignupPage
                    // required // Pode ser opcional dependendo da sua lógica
                  >
                    <option value="">{t('gender.select')}</option>
                    <option value="homem_cis">{t('gender.homem_cis')}</option>
                    <option value="mulher_cis">{t('gender.mulher_cis')}</option>
                    <option value="homem_trans">{t('gender.homem_trans')}</option>
                    <option value="mulher_trans">{t('gender.mulher_trans')}</option>
                    <option value="nao_binario">{t('gender.nao_binario')}</option>
                    <option value="outro_genero">{t('gender.outro_genero')}</option>
                    <option value="naoinformar_genero">{t('gender.naoinformar_genero')}</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={`${!hasProfileChanged ? styles.buttonDisabled : styles.button} genericButton`}
                    disabled={!hasProfileChanged}
                  >
                    {t('profilePage.saveButton')}
                  </button>
                  <button type="button" onClick={handleCancelEdit} className={`${styles.buttonCancel} genericButton`}> {/* Utiliza a chave global */}
                    {t('buttons.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className={styles.infoText}><strong>Email:</strong> {user.email}</p>
                <p className={styles.infoText}><strong>{t('profilePage.usernameLabel')}</strong> {displayName}</p>
                <p className={styles.infoText}><strong>{t('profilePage.bioLabel')}</strong> {user.bio || t('profilePage.notSet')}</p>
                <p className={styles.infoText}><strong>{t('profilePage.birthDateLabel')}</strong> {formatBirthDate(user.birthDate)}</p>
                <p className={styles.infoText}><strong>{t('profilePage.genderLabel')}</strong> {user.gender ? t(`gender.${user.gender}`) : t('profilePage.notInformed')}</p>
                <button onClick={handleEditClick} className={`${styles.button} genericButton`} style={{ marginTop: '20px' }}>
                  {t('profilePage.editButton')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO DE VÍNCULO */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>{t('profilePage.linkSectionTitle')}</h2>
          {user.linkedPartnerId ? (
            <>
              <p className={styles.infoText}>{t('profilePage.linkedMessage')}</p>
              <button onClick={() => navigate('/link-couple')} className={`${styles.actionButton} genericButton`}>
                {t('buttons.manageLink')}
              </button>
            </>
          ) : (
            <>
              <p className={styles.infoText}>{t('profilePage.notLinkedMessage')}</p>
              <button onClick={() => navigate('/link-couple')} className={`${styles.actionButton} genericButton`}>
                {t('buttons.linkNow')}
              </button>
            </>
          )}
        </div>

        {/* SEÇÃO DE SKINS */}
        <div className={`${styles.section} klnkl-themed-panel`}>
          <h2 className={styles.sectionTitleInHeader} style={{borderBottom: 'none', marginBottom: '15px'}}>{t('profilePage.customizationSectionTitle')}</h2>
          <Link to="/skins" className={`${styles.actionButton} genericButton`}>
            {t('profilePage.mySkinsButton')}
          </Link>
        </div>

        {/* SEÇÃO DE LOGOUT */}
        <div className={`${styles.section} ${styles.textCenter} klnkl-themed-panel`}>
          <button onClick={handleLogout} className={`${styles.buttonDestructive} genericButton`}>{t('buttons.logout')}</button>
        </div>

        {/* SEÇÃO DE RESET (DEV) */}
        <div className={`${styles.section} ${styles.textCenter} ${styles.marginTop50} ${styles.paddingTop20} ${styles.borderTopSolid} klnkl-themed-panel`}>
          <button
            onClick={handleResetTestData}
            className={`${styles.buttonDestructive} genericButton`} // Aplicando estilo de botão destrutivo
            aria-label={t('profilePage.resetSection.resetButton')}
          >
            {t('profilePage.resetSection.resetButton')}
          </button>
          <p className={styles.warningText}>
            {t('profilePage.resetSection.warningText')}
          </p>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
