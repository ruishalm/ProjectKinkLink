// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\LinkCouplePage.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Restaurado Link
import { useAuth, type User } from '../contexts/AuthContext';
import CreateLink from '../components/CreateLink';
import AcceptLink from '../components/AcceptLink';
import { db } from '../firebase'; // Import db
import { doc, getDoc, writeBatch } from 'firebase/firestore'; // Import firestore functions, removido deleteDoc
import styles from './LinkCouplePage.module.css';
import { useTranslation } from 'react-i18next';

const LinkCouplePage: React.FC = () => {
  const { user, isLoading: authIsLoading, updateUser: updateAuthContextUser } = useAuth(); // Removido logout se não for mais usado
  const navigate = useNavigate();
  const [showCreateLinkUI, setShowCreateLinkUI] = useState(false);
  const [showAcceptLinkUI, setShowAcceptLinkUI] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ username?: string; email?: string | null } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (user && user.linkedPartnerId && !partnerInfo) {
      const fetchPartnerInfo = async () => {
        try {
          const partnerDocRef = doc(db, 'users', user.linkedPartnerId!);
          const partnerDocSnap = await getDoc(partnerDocRef);
          if (partnerDocSnap.exists()) {
            const partnerData = partnerDocSnap.data() as User;
            setPartnerInfo({ username: partnerData.username, email: partnerData.email });
          } else {
            console.warn(t('linkCouplePage.partnerNotFoundConsole'));
            setPartnerInfo({ username: t('linkCouplePage.partnerNotFoundUI') });
          }
        } catch (error) {
          console.error(t('linkCouplePage.errorFetchingPartnerConsole'), error);
          setPartnerInfo({ username: t('linkCouplePage.errorFetchingPartnerUI') });
        }
      };
      fetchPartnerInfo();
    } else if (user && !user.linkedPartnerId) {
      setPartnerInfo(null); // Limpa info do parceiro se desvinculado
    }
  }, [user, user?.linkedPartnerId, partnerInfo, t]);

  if (authIsLoading) {
    return <div className={styles.page}><p className={styles.loadingText}>{t('linkCouplePage.loadingUserInfo')}</p></div>;
  }

  if (!user) {
    return <div className={styles.page}><p className={styles.loadingText}>{t('linkCouplePage.loginToLink')}</p></div>;
  }

  const handleUnlink = async () => {
    if (!user || !user.id || !user.linkedPartnerId || !user.coupleId) {
      alert(t('linkCouplePage.unlinkErrorIdentification'));
      return;
    }

    if (window.confirm(t('linkCouplePage.unlinkConfirmMessage'))) {
      setIsUnlinking(true);
      try {
        const batch = writeBatch(db);
        const currentUserDocRef = doc(db, 'users', user.id);
        const coupleDocRef = doc(db, 'couples', user.coupleId);
        // 1. Atualiza o documento do usuário atual
        batch.update(currentUserDocRef, { linkedPartnerId: null, coupleId: null });

        // 2. Deleta o documento do casal
        // A regra de segurança permite que um membro delete o documento do casal.
        batch.delete(coupleDocRef);
        await batch.commit();
        await updateAuthContextUser({ linkedPartnerId: null, coupleId: null }); // Atualiza o AuthContext localmente
        alert(t('linkCouplePage.unlinkSuccessAlert'));
        // A página será re-renderizada devido à mudança no 'user' do AuthContext,
        // mostrando a UI para vincular novamente.
      } catch (error) {
        let errorMessage = t('linkCouplePage.unlinkErrorGeneric');
        if (error instanceof Error) {
          errorMessage += ` ${t('linkCouplePage.unlinkErrorDetails')} ${error.message}`;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage += ` ${t('linkCouplePage.unlinkErrorDetails')} ${(error as { message: string }).message}`;
        } else if (typeof error === 'object' && error !== null && 'code' in error) {
          errorMessage += ` ${t('linkCouplePage.unlinkErrorCode')} ${(error as { code: string }).code}`;
        }
        console.error(t('linkCouplePage.unlinkErrorConsole'), error); // Mantém o log completo do objeto de erro
        alert(errorMessage + ` ${t('linkCouplePage.unlinkErrorCheckConsole')}`);
        
      } finally {
        setIsUnlinking(false);
      }
    }
  };

  if (user.linkedPartnerId) {
    return (
      <div className={styles.page}>
        <main className={`${styles.mainContent} klnkl-themed-panel`}> {/* Envolve o conteúdo principal */}
          <h1 className={styles.title}>{t('linkCouplePage.alreadyLinkedTitle')}</h1>
          <p className={styles.partnerInfoText}>
            {t('linkCouplePage.alreadyLinkedPartnerInfo', { partnerName: partnerInfo?.username || partnerInfo?.email || user.linkedPartnerId.substring(0, 8) + "..." })}
          </p>
          <p className={styles.subText}>{t('linkCouplePage.alreadyLinkedSubText')}</p>
          <button 
            onClick={() => {
              navigate('/cards');
            }} 
            className={`${styles.button} genericButton`} style={{ marginTop: '20px' }}>
            {t('buttons.goToCards')}
          </button>
          <button onClick={handleUnlink} className={`${styles.destructiveButton} genericButton genericButtonDestructive`} disabled={isUnlinking}>{isUnlinking ? t('linkCouplePage.unlinkingButton') : t('linkCouplePage.unlinkButton')}</button>
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
        <h1 className={styles.title}>{t('linkCouplePage.title')}</h1>
        <p className={styles.subText}>
          {t('linkCouplePage.subText')}
        </p>

        {!showCreateLinkUI && !showAcceptLinkUI && (
          <Fragment>
            <div className={styles.optionsContainer}>
              <button
                onClick={() => { setShowCreateLinkUI(true); setShowAcceptLinkUI(false); }}
                className={`${styles.actionButton} genericButton`}
              >
                {t('linkCouplePage.generateCodeButton')}
              </button>
              <p className={styles.orText}>{t('linkCouplePage.orText')}</p>
              <button
                onClick={() => { setShowAcceptLinkUI(true); setShowCreateLinkUI(false); }}
                className={`${styles.actionButton} genericButton`}
              >
                {t('linkCouplePage.haveCodeButton')}
              </button>
            </div>
            <div className={styles.backLinkContainer}>
              {/* Restaurado para Link para /profile */}
              <Link to="/profile" className={`${styles.secondaryButton} ${styles.backLink} genericButton`}>
                {t('buttons.backToProfile')}
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
              {t('linkCouplePage.cancelButton')} 
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LinkCouplePage;
