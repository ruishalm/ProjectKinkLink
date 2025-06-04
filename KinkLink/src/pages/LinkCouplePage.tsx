// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\LinkCouplePage.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Restaurado Link
import { useAuth, type User } from '../contexts/AuthContext';
import CreateLink from '../components/CreateLink';
import AcceptLink from '../components/AcceptLink';
import { db } from '../firebase'; // Import db
import { doc, getDoc, writeBatch } from 'firebase/firestore'; // Import firestore functions, removido deleteDoc
import styles from './LinkCouplePage.module.css';

const LinkCouplePage: React.FC = () => {
  const { user, isLoading: authIsLoading, updateUser: updateAuthContextUser } = useAuth(); // Removido logout se não for mais usado
  const navigate = useNavigate();
  const [showCreateLinkUI, setShowCreateLinkUI] = useState(false);
  const [showAcceptLinkUI, setShowAcceptLinkUI] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ username?: string; email?: string | null } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

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
            console.warn("Documento do parceiro não encontrado.");
            setPartnerInfo({ username: "Parceiro(a) não encontrado(a)" });
          }
        } catch (error) {
          console.error("Erro ao buscar informações do parceiro:", error);
          setPartnerInfo({ username: "Erro ao buscar parceiro(a)" });
        }
      };
      fetchPartnerInfo();
    } else if (user && !user.linkedPartnerId) {
      setPartnerInfo(null); // Limpa info do parceiro se desvinculado
    }
  }, [user, user?.linkedPartnerId, partnerInfo]);

  if (authIsLoading) {
    return <div className={styles.page}><p className={styles.loadingText}>Carregando informações do usuário...</p></div>;
  }

  if (!user) {
    return <div className={styles.page}><p className={styles.loadingText}>Por favor, faça login para vincular sua conta.</p></div>;
  }

  const handleUnlink = async () => {
    if (!user || !user.id || !user.linkedPartnerId || !user.coupleId) {
      alert("Não foi possível identificar os dados do vínculo para desfazer.");
      return;
    }

    if (window.confirm("Tem certeza que deseja desfazer o vínculo com seu parceiro(a)?")) {
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
        alert("Vínculo desfeito com sucesso!");
        // A página será re-renderizada devido à mudança no 'user' do AuthContext,
        // mostrando a UI para vincular novamente.
      } catch (error) {
        let errorMessage = "Ocorreu um erro ao tentar desfazer o vínculo.";
        if (error instanceof Error) {
          errorMessage += ` Detalhes: ${error.message}`;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage += ` Detalhes: ${(error as { message: string }).message}`;
        } else if (typeof error === 'object' && error !== null && 'code' in error) {
          errorMessage += ` Código: ${(error as { code: string }).code}`;
        }
        console.error("Erro ao desfazer vínculo:", error); // Mantém o log completo do objeto de erro
        alert(errorMessage + " Verifique o console para mais informações.");

      } finally {
        setIsUnlinking(false);
      }
    }
  };

  if (user.linkedPartnerId) {
    return (
      <div className={styles.page}>
        <main className={`${styles.mainContent} klnkl-themed-panel`}> {/* Envolve o conteúdo principal */}
          <h1 className={styles.title}>Você já está Vinculado!</h1>
          <p className={styles.partnerInfoText}>Seu parceiro(a) é: {partnerInfo?.username || partnerInfo?.email || user.linkedPartnerId.substring(0, 8) + "..."}</p>
          <p className={styles.subText}>Agora vocês podem começar a usar o KinkLink juntos!</p>
          <button 
            onClick={() => {
              console.log('Botão "Ir para as Cartas" clicado. Navegando para /cards...');
              navigate('/cards');
            }} 
            className={`${styles.button} genericButton`} style={{ marginTop: '20px' }}>Ir para as Cartas</button>
          <button onClick={handleUnlink} className={`${styles.destructiveButton} genericButton genericButtonDestructive`} disabled={isUnlinking}>{isUnlinking ? "Desfazendo..." : "Desfazer Vínculo"}</button>
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
        <h1 className={styles.title}>Vincular Casal</h1>
        <p className={styles.subText}>
          Para usar o KinkLink e compartilhar experiências com seu parceiro(a),
          vocês precisam vincular suas contas.
        </p>

        {!showCreateLinkUI && !showAcceptLinkUI && (
          <Fragment>
            <div className={styles.optionsContainer}>
              <button
                onClick={() => { setShowCreateLinkUI(true); setShowAcceptLinkUI(false); }}
                className={`${styles.actionButton} genericButton`}
              >
                Quero Gerar um Código
              </button>
              <p className={styles.orText}>OU</p>
              <button
                onClick={() => { setShowAcceptLinkUI(true); setShowCreateLinkUI(false); }}
                className={`${styles.actionButton} genericButton`}
              >
                Tenho um Código para Inserir
              </button>
            </div>
            <div className={styles.backLinkContainer}>
              {/* Restaurado para Link para /profile */}
              <Link to="/profile" className={`${styles.secondaryButton} ${styles.backLink} genericButton`}>
                &larr; Voltar para o Perfil
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
              Voltar / Cancelar
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default LinkCouplePage;
