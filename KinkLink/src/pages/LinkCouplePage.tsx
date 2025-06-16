// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\LinkCouplePage.tsx
import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Restaurado Link
import { useAuth, type User } from '../contexts/AuthContext';
import CreateLink from '../components/CreateLink';
import AcceptLink from '../components/AcceptLink';
import { db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore'; // writeBatch não é mais usado aqui diretamente
import styles from './LinkCouplePage.module.css';

const LinkCouplePage: React.FC = () => {
  const { user, isLoading: authIsLoading, unlinkCouple: authUnlinkCouple } = useAuth(); // Adicionado unlinkCouple e removido updateUser se não for usado
  const navigate = useNavigate();
  const [showCreateLinkUI, setShowCreateLinkUI] = useState(false);
  const [showAcceptLinkUI, setShowAcceptLinkUI] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ username?: string; email?: string | null } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    if (user && user.partnerId && !partnerInfo) { // MODIFICADO: user.linkedPartnerId para user.partnerId
      const fetchPartnerInfo = async () => {
        try {
          const partnerDocRef = doc(db, 'users', user.partnerId!); // MODIFICADO: user.linkedPartnerId para user.partnerId
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
    } else if (user && !user.partnerId) { // MODIFICADO: user.linkedPartnerId para user.partnerId
      setPartnerInfo(null); // Limpa info do parceiro se desvinculado
    }
  }, [user, user?.partnerId, partnerInfo]); // MODIFICADO: user.linkedPartnerId para user.partnerId

  if (authIsLoading) {
    return <div className={styles.page}><p className={styles.loadingText}>Carregando informações do usuário...</p></div>;
  }

  if (!user) {
    return <div className={styles.page}><p className={styles.loadingText}>Por favor, faça login para vincular sua conta.</p></div>;
  }

  const handleUnlink = async () => {
    if (window.confirm("Tem certeza que deseja desfazer o vínculo com seu parceiro(a)?")) {
      setIsUnlinking(true);
      try {
        // Chama a função unlinkCouple do AuthContext
        // A verificação de user, user.id, user.partnerId, user.coupleId já é feita dentro de authUnlinkCouple
        await authUnlinkCouple();
        alert("Vínculo desfeito com sucesso!");
        // A página será re-renderizada devido à mudança no 'user' do AuthContext,
        // mostrando a UI para vincular novamente.
      } catch (error) {
        let errorMessage = "Ocorreu um erro ao tentar desfazer o vínculo.";
        if (error instanceof Error) {
          errorMessage += ` Detalhes: ${error.message || 'Erro desconhecido.'}`;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage += ` Detalhes: ${(error as { message: string }).message}`;
        }
        console.error("Erro ao desfazer vínculo:", error); // Mantém o log completo do objeto de erro
        alert(errorMessage);
      } finally {
        setIsUnlinking(false);
      }
    }
  };

  if (user.partnerId) { // MODIFICADO: user.linkedPartnerId para user.partnerId
    return (
      <div className={styles.page}>
        <main className={`${styles.mainContent} klnkl-themed-panel`}> {/* Envolve o conteúdo principal */}
          <h1 className={styles.title}>Você já está Vinculado!</h1>
          <p className={styles.partnerInfoText}>Seu parceiro(a) é: {partnerInfo?.username || partnerInfo?.email || user.partnerId.substring(0, 8) + "..."}</p> {/* MODIFICADO: user.linkedPartnerId para user.partnerId */}
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
