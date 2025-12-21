// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\LinkCouplePage.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Restaurado Link
import { useTranslation } from 'react-i18next';
import { useAuth, type User } from '../contexts/AuthContext';
import CreateLink from '../components/CreateLink';
import AcceptLink from '../components/AcceptLink';
import { db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore'; // writeBatch não é mais usado aqui diretamente
import styles from './LinkCouplePage.module.css';

const LinkCouplePage: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading: authIsLoading, unlinkCouple: authUnlinkCouple } = useAuth(); // Adicionado unlinkCouple e removido updateUser se não for usado
  const navigate = useNavigate();
  const [showCreateLinkUI, setShowCreateLinkUI] = useState(false);
  const [showAcceptLinkUI, setShowAcceptLinkUI] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ username?: string; email?: string | null } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    if (user && user.coupleId && !partnerInfo) {
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
                const partnerData = partnerDocSnap.data() as User;
                setPartnerInfo({ username: partnerData.username, email: partnerData.email });
              } else {
                console.warn("Documento do parceiro não encontrado.");
                setPartnerInfo({ username: t('link_couple_partner_not_found') });
              }
            }
          } else {
            console.warn("Documento do couple não encontrado.");
            setPartnerInfo({ username: t('link_couple_partner_not_found') });
          }
        } catch (error) {
          console.error("Erro ao buscar informações do parceiro:", error);
          setPartnerInfo({ username: t('link_couple_error_fetching_partner') });
        }
      };
      fetchPartnerInfo();
    } else if (user && !user.coupleId) {
      setPartnerInfo(null); // Limpa info do parceiro se desvinculado
    }
  }, [user, user?.coupleId, partnerInfo]);

  if (authIsLoading) {
    return <div className={styles.page}><p className={styles.loadingText}>{t('link_couple_loading_user')}</p></div>;
  }

  if (!user) {
    return <div className={styles.page}><p className={styles.loadingText}>{t('link_couple_login_required')}</p></div>;
  }

  const handleUnlink = async () => {
    if (window.confirm(t('link_couple_unlink_confirm'))) {
      setIsUnlinking(true);
      try {
        // Chama a função unlinkCouple do AuthContext
        // A verificação de user, user.id, user.partnerId, user.coupleId já é feita dentro de authUnlinkCouple
        await authUnlinkCouple();
        alert(t('link_couple_unlink_success'));
        // A página será re-renderizada devido à mudança no 'user' do AuthContext,
        // mostrando a UI para vincular novamente.
      } catch (error) {
        let errorMessage = t('link_couple_unlink_error_generic');
        if (error instanceof Error) {
          errorMessage += ` ${t('link_couple_unlink_error_details')} ${error.message || t('link_couple_unlink_error_unknown')}`;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage += ` ${t('link_couple_unlink_error_details')} ${(error as { message: string }).message}`;
        }
        console.error(t('link_couple_unlink_error_console'), error); // Mantém o log completo do objeto de erro
        alert(errorMessage);
      } finally {
        setIsUnlinking(false);
      }
    }
  };

  if (user.coupleId) {
    return (
      <div className={styles.page}>
        <main className={`${styles.mainContent} klnkl-themed-panel`}> {/* Envolve o conteúdo principal */}
          <h1 className={styles.title}>{t('link_couple_already_linked_title')}</h1>
          <p className={styles.partnerInfoText}>{t('link_couple_partner_is')} {partnerInfo?.username || partnerInfo?.email || '...'}</p>
          <p className={styles.subText}>{t('link_couple_start_playing')}</p>
          <button 
            onClick={() => {
              console.log('Botão "Ir para as Cartas" clicado. Navegando para /cards...');
              navigate('/cards');
            }} 
            className={`${styles.button} genericButton`} style={{ marginTop: '20px' }}>{t('link_couple_go_to_cards_button')}</button>
          <button onClick={handleUnlink} className={`${styles.destructiveButton} genericButton genericButtonDestructive`} disabled={isUnlinking}>{isUnlinking ? t('link_couple_unlinking_button') : t('link_couple_unlink_button')}</button>
        </main>
      </div>
    );
  }

  const handleLinkCreated = (code: string) => {
    console.log(`LinkCouplePage: Código gerado: ${code}`);
    setShowCreateLinkUI(true);
    setShowAcceptLinkUI(false);
  };

  const handleLinkAccepted = (coupleId: string, partnerId: string) => {
    console.log(`LinkCouplePage: Link aceito! CoupleID: ${coupleId}, PartnerID: ${partnerId}`);
    setShowCreateLinkUI(false);
    setShowAcceptLinkUI(false);
  };

  const handleCancelAction = () => {
    setShowCreateLinkUI(false);
    setShowAcceptLinkUI(false);
  };

  return (
    <div className={styles.page}>
      <main className={`${styles.mainContent} klnkl-themed-panel`}> {/* Envolve o conteúdo principal */}
        <h1 className={styles.title}>{t('link_couple_page_title')}</h1>
        <p className={styles.subText}>
          {t('link_couple_intro_text')}
        </p>

        {!showCreateLinkUI && !showAcceptLinkUI && (
          <Fragment>
            <div className={styles.optionsContainer}>
              <button
                onClick={() => { setShowCreateLinkUI(true); setShowAcceptLinkUI(false); }}
                className={`${styles.actionButton} genericButton`}
              >
                {t('link_couple_generate_code_button')}
              </button>
              <p className={styles.orText}>{t('link_couple_or_separator')}</p>
              <button
                onClick={() => { setShowAcceptLinkUI(true); setShowCreateLinkUI(false); }}
                className={`${styles.actionButton} genericButton`}
              >
                {t('link_couple_enter_code_button')}
              </button>
            </div>
            <div className={styles.backLinkContainer}>
              {/* Restaurado para Link para /profile */}
              <Link to="/profile" className={`${styles.secondaryButton} ${styles.backLink} genericButton`}>
                {t('link_couple_back_to_profile_button')}
              </Link>
            </div>
          </Fragment>
        )}

        {showCreateLinkUI && <CreateLink onLinkCreated={handleLinkCreated} onCancel={handleCancelAction} />}
        {showAcceptLinkUI && <AcceptLink onLinkAccepted={handleLinkAccepted} onCancel={handleCancelAction} />}

        {(showCreateLinkUI || showAcceptLinkUI) && (
          <div className={styles.backLinkContainer}>
            <button
              onClick={handleCancelAction} // Usa a nova função
              className={`${styles.secondaryButton} genericButton`}
            >
              {t('link_couple_back_cancel_button')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LinkCouplePage;
