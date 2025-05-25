// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\CreateLink.tsx
import React, { useState, type CSSProperties } from 'react';
import { createLink as apiCreateLink } from '../services/linkService'; // Renomeado para evitar conflito
import { useAuth } from '../contexts/AuthContext';

interface CreateLinkProps {
  onLinkCreated: (code: string) => void;
  onCancel: () => void; // Nova prop para cancelar/voltar
}

// Estilos básicos para o componente (podem ser ajustados conforme necessário)
const sectionStyle: CSSProperties = {
  marginTop: '20px',
  padding: '25px',
  backgroundColor: '#383838', // Um pouco mais claro que o fundo da LinkCouplePage
  borderRadius: '8px',
  border: '1px solid #4a4a4a',
  textAlign: 'left', // Mantém o alinhamento interno
};

const buttonStyleBase: CSSProperties = { // Estilo base dos botões da LinkCouplePage
  padding: '12px 20px',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1em',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
  marginRight: '10px', // Espaço entre botões se houver mais de um
};

const primaryButtonStyle: CSSProperties = { ...buttonStyleBase, backgroundColor: '#64b5f6' };
const secondaryButtonStyle: CSSProperties = { ...buttonStyleBase, backgroundColor: '#757575', marginTop: '15px' }; // Para o botão de cancelar/voltar

const codeDisplayStyle: CSSProperties = {
  fontSize: '1.8em',
  fontWeight: 'bold',
  color: '#81c784', // Verde para o código
  padding: '15px',
  backgroundColor: '#2a2a2a',
  borderRadius: '6px',
  display: 'inline-block',
  marginTop: '15px',
  marginBottom: '25px',
  letterSpacing: '2px',
  border: '1px dashed #81c784',
};

const CreateLink: React.FC<CreateLinkProps> = ({ onLinkCreated, onCancel }) => {
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleCreateLink = async () => {
    if (!user) {
      setError("Você precisa estar logado para criar um link.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Ajuste para o erro TS(2554): Se apiCreateLink não espera argumentos, chame sem.
      // VERIFIQUE: Se apiCreateLink em linkService.ts DEVERIA receber user.id,
      // então a definição da função em linkService.ts precisa ser alterada para aceitar um argumento.
      const code = await apiCreateLink();
      setLinkCode(code);
      onLinkCreated(code); // Notifica o pai que o código foi criado
    } catch (err) {
      console.error("Erro ao criar link:", err);
      setError("Falha ao gerar o código. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={sectionStyle}>
      <h2 style={{ marginTop: 0, color: '#64b5f6', marginBottom: '20px' }}>Gerar Código de Vínculo</h2>
      {!linkCode ? (
        <button onClick={handleCreateLink} disabled={isLoading} style={primaryButtonStyle}>
          {isLoading ? 'Gerando...' : 'Gerar Meu Código'}
        </button>
      ) : (
        <div>
          <p style={{ fontSize: '1.1em', color: '#c0c0c0' }}>Compartilhe este código com seu parceiro(a):</p>
          <p style={codeDisplayStyle}>{linkCode}</p>
        </div>
      )}
      {error && <p style={{ color: '#ef9a9a', marginTop: '10px' }}>{error}</p>}
      {/* Botão para chamar onCancel */}
      <button onClick={onCancel} style={secondaryButtonStyle}>
        {linkCode ? 'Concluído / Voltar' : 'Cancelar'}
      </button>
    </div>
  );
};

export default CreateLink;