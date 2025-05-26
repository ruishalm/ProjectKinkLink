// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\LinkCouplePage.tsx
import React, { useState, useEffect, type CSSProperties, Fragment } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import { useAuth, type User } from '../contexts/AuthContext';
import CreateLink from '../components/CreateLink';
import AcceptLink from '../components/AcceptLink';
import { db } from '../firebase'; // Import db
import { doc, getDoc, writeBatch } from 'firebase/firestore'; // Import firestore functions, removido deleteDoc

// Estilos (mantidos e adaptados do seu código original)
const pageStyle: CSSProperties = {
  maxWidth: '600px',
  margin: '40px auto',
  padding: '30px',
  backgroundColor: '#2c2c2c',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
  color: '#e0e0e0',
  fontFamily: '"Trebuchet MS", sans-serif',
  textAlign: 'center',
};

// sectionStyle não é mais diretamente usado pelos componentes CreateLink/AcceptLink,
// mas pode ser útil se você adicionar mais seções a esta página.
// const sectionStyle: CSSProperties = {
//   marginBottom: '30px',
//   padding: '20px',
//   backgroundColor: '#353535',
//   borderRadius: '8px',
//   border: '1px solid #444',
//   textAlign: 'left',
// };

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#64b5f6',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
  margin: '5px',
};

const destructiveButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#f44336', // Vermelho para ações destrutivas
  marginTop: '15px',
};

const LinkCouplePage: React.FC = () => {
  const { user, isLoading: authIsLoading, updateUser: updateAuthContextUser } = useAuth();
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
    return <div style={pageStyle}><p>Carregando informações do usuário...</p></div>;
  }

  if (!user) {
    // O useEffect acima não será chamado se user for null, então está ok.
    // Se houvesse um useEffect que dependesse de algo que só existe após o login,
    // ele precisaria de uma guarda interna ou ser movido para após esta verificação.
    // Neste caso, o useEffect para partnerInfo já verifica 'user'.
    return <div style={pageStyle}><p>Por favor, faça login para vincular sua conta.</p></div>;
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

        // Nota: O documento do parceiro(a) ficará com coupleId e linkedPartnerId "órfãos".
        // A lógica no app do parceiro(a) precisará lidar com isso (ex: se coupleId não existe, considerar desvinculado).
        // Uma solução mais robusta envolveria Cloud Functions para garantir consistência.

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
      <div style={pageStyle}>
        <h1>Você já está Vinculado!</h1>
        <p>Seu parceiro(a) é: {partnerInfo?.username || partnerInfo?.email || user.linkedPartnerId.substring(0, 8) + "..."}</p>
        <p>Agora vocês podem começar a usar o KinkLink juntos!</p>
        <button onClick={() => navigate('/cards')} style={{ ...buttonStyle, marginTop: '20px' }}>Ir para as Cartas</button>
        <button onClick={handleUnlink} style={destructiveButtonStyle} disabled={isUnlinking}>{isUnlinking ? "Desfazendo..." : "Desfazer Vínculo"}</button>
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
    // O AuthContext (via listener no App.tsx ou no próprio AuthContext)
    // deve atualizar o estado 'user.linkedPartnerId'.
    // Quando isso acontecer, este componente será re-renderizado e mostrará a mensagem "Você já está Vinculado!".
    setShowCreateLinkUI(false);
    setShowAcceptLinkUI(false);
    // Opcional: redirecionar ou mostrar mensagem de sucesso mais proeminente.
    // navigate('/'); // Poderia redirecionar para a home ou para /cards
  };

  const handleCancelAction = () => {
    setShowCreateLinkUI(false);
    setShowAcceptLinkUI(false);
  };

  return (
    <div style={pageStyle}>
      <h1 style={{ color: '#64b5f6', marginBottom: '20px' }}>Vincular Casal</h1>
      <p style={{ marginBottom: '30px', fontSize: '1.1em', color: '#b0b0b0' }}>
        Para usar o KinkLink e compartilhar experiências com seu parceiro(a),
        vocês precisam vincular suas contas.
      </p>

      {!showCreateLinkUI && !showAcceptLinkUI && (
        <Fragment>
          <div style={{ margin: '30px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => { setShowCreateLinkUI(true); setShowAcceptLinkUI(false); }}
              style={{ ...buttonStyle, padding: '15px 25px', fontSize: '1.1em', width: '250px' }}
            >
              Quero Gerar um Código
            </button>
            <p style={{ color: '#888' }}>OU</p>
            <button
              onClick={() => { setShowAcceptLinkUI(true); setShowCreateLinkUI(false); }}
              style={{ ...buttonStyle, padding: '15px 25px', fontSize: '1.1em', width: '250px' }}
            >
              Tenho um Código para Inserir
            </button>
          </div>
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <Link to="/profile" style={{ color: '#64b5f6', textDecoration: 'none', fontSize: '1em' }}>
              &larr; Voltar para o Perfil
            </Link>
          </div>
        </Fragment>
      )}

      {showCreateLinkUI && <CreateLink onLinkCreated={handleLinkCreated} onCancel={handleCancelAction} />}
      {showAcceptLinkUI && <AcceptLink onLinkAccepted={handleLinkAccepted} onCancel={handleCancelAction} />}

      {(showCreateLinkUI || showAcceptLinkUI) && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={handleCancelAction} // Usa a nova função
            style={{ ...buttonStyle, backgroundColor: '#757575', padding: '10px 20px' }}
          >
            Voltar / Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkCouplePage;
