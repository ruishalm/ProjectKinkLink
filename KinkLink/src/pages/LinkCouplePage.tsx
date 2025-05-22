import React, { useState, useEffect, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCoupleLinking } from '../hooks/useCoupleLinking'; // Importa o novo hook

const REDIRECT_DELAY_MS = 2000;

// Estilos (mantidos do seu código original)
const pageStyle: CSSProperties = {
  maxWidth: '600px',
  margin: '40px auto',
  padding: '30px',
  backgroundColor: '#2c2c2c', // Um pouco mais escuro que o fundo geral
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
  marginBottom: '10px', // Adicionado para responsividade em telas menores
  border: '1px solid #555',
  borderRadius: '6px',
  backgroundColor: '#404040',
  color: '#e0e0e0',
  fontSize: '1em',
  width: 'calc(100% - 26px)', // Ajuste para padding
  boxSizing: 'border-box',
};

const buttonStyle: CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#64b5f6', // Azul claro
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
  backgroundColor: '#f44336', // Vermelho para desvincular
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
  backgroundColor: '#4CAF50', // Verde
  color: 'white',
};

const errorMessageStyle: CSSProperties = {
  ...messageStyle,
  backgroundColor: '#f44336', // Vermelho
  color: 'white',
};

const infoMessageStyle: CSSProperties = {
  ...messageStyle,
  backgroundColor: '#2196F3', // Azul informativo
  color: 'white',
};


function LinkCouplePage() {
  useAuth(); // Chama useAuth para garantir que o contexto está disponível para useCoupleLinking, mas não desestrutura 'user'
  const { isLinked, userLinkCode, generateLinkCode, attemptLinkWithCode, unlinkPartner } = useCoupleLinking(); // Usa o novo hook
  const navigate = useNavigate();

  const [generatedCodeDisplay, setGeneratedCodeDisplay] = useState<string | null>(null); // Estado local para exibição do código gerado
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null);


  useEffect(() => {
    // Atualiza o display do código gerado quando userLinkCode do hook mudar
    setGeneratedCodeDisplay(userLinkCode || null);
  }, [userLinkCode]);


  const handleGenerateCode = () => {
    const code = generateLinkCode();
    if (code) {
        setGeneratedCodeDisplay(code); // Atualiza o display local imediatamente
        setMessage('Código gerado! Compartilhe com seu parceiro(a).');
        setMessageType('success');
    } else {
        setMessage('Não foi possível gerar o código. Tente novamente.');
        setMessageType('error');
    }
    setInputCode(''); // Limpa o campo de input
  };

  const handleLinkWithCode = () => {
    setMessage(null);
    setMessageType(null);
    if (attemptLinkWithCode(inputCode.trim())) {
      setMessage('Vinculado com sucesso! Redirecionando...');
      setMessageType('success');
      setTimeout(() => navigate('/cards'), REDIRECT_DELAY_MS);
    } else {
      setMessage('Falha ao vincular. Verifique o código ou se seu parceiro(a) já gerou um novo.');
      setMessageType('error');
    }
  };

  const handleUnlink = () => {
    unlinkPartner();
    setMessage('Vínculo removido.');
    setMessageType('info');
    setGeneratedCodeDisplay(null); // Limpa o código exibido
  };

  const getMessageStyle = () => {
    if (messageType === 'success') return successMessageStyle;
    if (messageType === 'error') return errorMessageStyle;
    if (messageType === 'info') return infoMessageStyle;
    return {};
  }

  return (
    <div style={pageStyle}>
      <h1 style={{ textAlign: 'center', color: '#64b5f6', marginBottom: '30px' }}>Vincular Casal</h1>

      {message && (
        <div style={getMessageStyle()}>
          {message}
        </div>
      )}
      {isLinked ? (
        <>
          <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#81c784', marginBottom: '20px' }}>
            🎉 Vocês estão vinculados! 🎉
          </p>
          <p style={{ textAlign: 'center', marginBottom: '30px' }}>
            Agora vocês podem ver os matches e interagir com as cartas juntos.
          </p>
          <div style={{ textAlign: 'center' }}>
            <button onClick={handleUnlink} style={destructiveButtonStyle}>Desvincular</button>
          </div>
        </>
      ) : (
        <>
          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0, textAlign: 'center', color: '#64b5f6' }}>Gerar Código de Vínculo</h2>
            <div style={{ textAlign: 'center' }}>
              {generatedCodeDisplay ? (
                <>
                  <p>Seu código para compartilhar:</p>
                  <strong style={{ fontSize: '1.8em', color: '#81c784', display: 'block', margin: '10px 0', letterSpacing: '2px' }}>{generatedCodeDisplay}</strong>
                  <p style={{ fontSize: '0.9em', color: '#aaa' }}>Este código é válido até você gerar um novo ou se vincular.</p>
                  <button onClick={handleGenerateCode} style={{...buttonStyle, backgroundColor: '#ffb74d', marginTop: '10px' }}>Gerar Novo Código</button>
                </>
              ) : (
                <button onClick={handleGenerateCode} style={buttonStyle}>Gerar Meu Código</button>
              )}
            </div>
          </div>

          <div style={sectionStyle}>
            <h2 style={{ marginTop: 0, textAlign: 'center', color: '#64b5f6' }}>Inserir Código de Vínculo</h2>
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
              />
              <button
                onClick={handleLinkWithCode}
                disabled={!inputCode.trim() || inputCode.trim().length < 6}
                style={buttonStyle}
              >Vincular com Código</button>
            </div>
          </div>
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link to="/cards" style={{ color: '#64b5f6', textDecoration: 'none', fontSize: '1.1em' }}>&larr; Voltar para as Cartas</Link>
      </div>
    </div>
  );
}

export default LinkCouplePage;
