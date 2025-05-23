// d:\Projetos\Github\app\KinkLink\KinkLink\src\pages\LinkCouplePage.tsx
import React, { useState, useEffect, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleLinking, type LinkRequest } from '../hooks/useCoupleLinking';

// Estilos (mantidos do seu código original, com pequenas adaptações se necessário)
const pageStyle: CSSProperties = {
  maxWidth: '600px',
  margin: '40px auto',
  padding: '30px',
  backgroundColor: '#2c2c2c',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
  color: '#e0e0e0',
  fontFamily: '"Trebuchet MS", sans-serif',
};

const sectionStyle: CSSProperties = {
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: '#353535',
  borderRadius: '8px',
  border: '1px solid #444',
};

const inputStyle: CSSProperties = {
  padding: '12px',
  marginRight: '10px',
  marginBottom: '10px',
  border: '1px solid #555',
  borderRadius: '6px',
  backgroundColor: '#404040',
  color: '#e0e0e0',
  fontSize: '1em',
  width: 'calc(100% - 26px)',
  boxSizing: 'border-box',
};

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
};

const destructiveButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#f44336',
};

const messageStyle: CSSProperties = {
  padding: '15px',
  margin: '20px 0',
  borderRadius: '6px',
  textAlign: 'center',
  fontWeight: 'bold',
};

const successMessageStyle: CSSProperties = {
  ...messageStyle,
  backgroundColor: '#4CAF50',
  color: 'white',
};

const errorMessageStyle: CSSProperties = {
  ...messageStyle,
  backgroundColor: '#f44336',
  color: 'white',
};

const infoMessageStyle: CSSProperties = {
  ...messageStyle,
  backgroundColor: '#2196F3',
  color: 'white',
};

const requestItemStyle: CSSProperties = {
    padding: '10px',
    borderBottom: '1px solid #444',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
};

const requestActionsStyle: CSSProperties = {
    display: 'flex',
    gap: '10px',
};


function LinkCouplePage() {
  const { user, isLoading: authIsLoading } = useAuth();
  const {
    isLinked,
    // userLinkCode, // Agora pegamos de user.linkCode diretamente
    requestLinkWithCode,
    unlinkPartner,
    incomingRequests,
    acceptLinkRequest,
    rejectLinkRequest,
    sentRequestStatus,
    sentRequestTargetEmail,
    cancelSentRequest,
  } = useCoupleLinking();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);
  const [operationInProgress, setOperationInProgress] = useState(false);

  // Log para verificar o estado do usuário nesta página
  useEffect(() => {
    console.log('[LinkCouplePage] User state:', JSON.stringify(user));
    console.log('[LinkCouplePage] isLinked:', isLinked);
    console.log('[LinkCouplePage] user.linkCode (fixo):', user?.linkCode);
    console.log('[LinkCouplePage] Incoming Requests:', incomingRequests);
    console.log('[LinkCouplePage] Sent Request Status:', sentRequestStatus, 'To:', sentRequestTargetEmail);
  }, [user, isLinked, incomingRequests, sentRequestStatus, sentRequestTargetEmail]);

  // Efeito para navegar APÓS a vinculação ser confirmada no estado
  useEffect(() => {
    if (isLinked && (message === 'Vínculo aceito com sucesso!' || message === 'Vinculado com sucesso!')) {
      console.log('[LinkCouplePage] useEffect: isLinked is true and message is success, navigating to /cards');
      const timer = setTimeout(() => navigate('/cards'), 100); // Pequeno delay para UI
      return () => clearTimeout(timer);
    }
  }, [isLinked, message, navigate]);


  const handleRequestLink = async () => {
    if (!inputCode.trim()) {
      setMessage('Por favor, insira um código.');
      setMessageType('info');
      return;
    }
    setOperationInProgress(true);
    setMessage('Enviando solicitação...'); setMessageType('info');
    const success = await requestLinkWithCode(inputCode.trim());
    setOperationInProgress(false);
    if (success) {
      // A mensagem de sucesso/pendente será gerenciada pelo estado sentRequestStatus/sentRequestTargetEmail
      // setMessage(`Solicitação de vínculo enviada. Aguardando aprovação.`);
      // setMessageType('success');
      setInputCode(''); // Limpa o input após enviar
    } else {
      setMessage('Falha ao enviar solicitação. Verifique o código ou se o usuário já está vinculado.');
      setMessageType('error');
    }
  };

  const handleUnlink = async () => {
    setOperationInProgress(true);
    setMessage('Desvinculando...'); setMessageType('info');
    await unlinkPartner();
    setOperationInProgress(false);
    setMessage('Vínculo removido.');
    setMessageType('info');
  };

  const handleAcceptRequest = async (request: LinkRequest) => {
    setOperationInProgress(true);
    setMessage(`Aceitando vínculo com ${request.requesterEmail || 'usuário'}...`); setMessageType('info');
    const success = await acceptLinkRequest(request);
    setOperationInProgress(false);
    if (success) {
      setMessage('Vínculo aceito com sucesso!');
      setMessageType('success');
    } else {
      setMessage('Falha ao aceitar vínculo.');
      setMessageType('error');
    }
  };

  const handleRejectRequest = async (request: LinkRequest) => {
    setOperationInProgress(true);
    setMessage(`Rejeitando vínculo com ${request.requesterEmail || 'usuário'}...`); setMessageType('info');
    await rejectLinkRequest(request.id);
    setOperationInProgress(false);
    setMessage('Solicitação de vínculo rejeitada.');
    setMessageType('info');
  };

  const handleCancelSentRequest = async () => {
    setOperationInProgress(true);
    setMessage('Cancelando solicitação...'); setMessageType('info');
    const success = await cancelSentRequest();
    setOperationInProgress(false);
    if (success) {
        setMessage('Solicitação enviada cancelada.');
        setMessageType('info');
    } else {
        setMessage('Não foi possível cancelar a solicitação (pode já ter sido processada).');
        setMessageType('error');
    }
  };

  const getMessageSpecificStyle = () => {
    if (messageType === 'success') return successMessageStyle;
    if (messageType === 'error') return errorMessageStyle;
    if (messageType === 'info') return infoMessageStyle;
    return {};
  };

  if (authIsLoading) {
    return <div style={pageStyle}><p style={{textAlign: 'center'}}>Carregando informações do usuário...</p></div>;
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ textAlign: 'center', color: '#64b5f6', marginBottom: '30px' }}>Vincular Casal</h1>

      {message && (
        <div style={{...messageStyle, ...getMessageSpecificStyle()}}>
          {message}
        </div>
      )}
      {isLinked ? (
        <>
          <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#81c784', marginBottom: '20px' }}>
            🎉 Vocês estão vinculados! 🎉
          </p>
          <p style={{ textAlign: 'center', marginBottom: '30px' }}>
            Parceiro(a): {user?.linkedPartnerId ? `ID ${user.linkedPartnerId.substring(0,8)}...` : 'Desconhecido'}
          </p>
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleUnlink} style={destructiveButtonStyle} disabled={operationInProgress}>
              {operationInProgress ? 'Processando...' : 'Desvincular'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0, textAlign: 'center', color: '#64b5f6' }}>Seu Código de Vínculo</h2>
            {user?.linkCode ? (
              <div style={{ textAlign: 'center' }}>
                <p>Compartilhe este código com seu parceiro(a):</p>
                <strong style={{ fontSize: '1.8em', color: '#81c784', display: 'block', margin: '10px 0', letterSpacing: '2px' }}>
                  {user.linkCode}
                </strong>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#aaa' }}>Seu código de vínculo ainda não está disponível. Tente recarregar.</p>
            )}
          </div>

          {incomingRequests.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={{ marginTop: 0, textAlign: 'center', color: '#ffb74d' }}>Solicitações de Vínculo Recebidas</h2>
              {incomingRequests.map(req => (
                <div key={req.id} style={requestItemStyle}>
                  <span>Solicitação de: {req.requesterEmail || req.requesterId.substring(0,10)+'...'}</span>
                  <div style={requestActionsStyle}>
                    <button onClick={() => handleAcceptRequest(req)} style={{...buttonStyle, backgroundColor: '#4CAF50'}} disabled={operationInProgress}>Aceitar</button>
                    <button onClick={() => handleRejectRequest(req)} style={{...buttonStyle, backgroundColor: '#f44336'}} disabled={operationInProgress}>Rejeitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0, textAlign: 'center', color: '#64b5f6' }}>Enviar Solicitação de Vínculo</h2>
            {sentRequestStatus === 'pending' && sentRequestTargetEmail ? (
                <div style={{textAlign: 'center'}}>
                    <p style={{color: '#ffb74d', fontSize: '1em'}}>
                        Solicitação enviada para {sentRequestTargetEmail}. Aguardando aprovação.
                    </p>
                    <button onClick={handleCancelSentRequest} style={{...buttonStyle, backgroundColor: '#757575'}} disabled={operationInProgress}>
                        {operationInProgress ? 'Cancelando...' : 'Cancelar Solicitação'}
                    </button>
                </div>
            ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <label htmlFor="link-code-input" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '1.1em' }}>
                    Código recebido do parceiro(a):
                </label>
                <input
                    type="text"
                    id="link-code-input"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Digite o código aqui"
                    style={{...inputStyle, width: '250px', textAlign: 'center', fontSize: '1.2em' }}
                    disabled={operationInProgress || isLinked}
                />
                <button
                    onClick={handleRequestLink}
                    disabled={!inputCode.trim() || inputCode.trim().length < 6 || operationInProgress || isLinked}
                    style={buttonStyle}
                >
                    {operationInProgress ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
                </div>
            )}
          </div>
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link to="/profile" style={{ color: '#64b5f6', textDecoration: 'none', fontSize: '1.1em' }}>&larr; Voltar para o Perfil</Link>
      </div>
    </div>
  );
}

export default LinkCouplePage;
