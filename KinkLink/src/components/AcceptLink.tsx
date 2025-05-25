import React, { useState } from 'react';
import { acceptLink } from '../services/linkService'; // Ajuste o caminho se necessário

interface AcceptLinkProps {
  onLinkAccepted: (coupleId: string, partnerId: string) => void;
  onCancel: () => void; // Nova prop para cancelar/voltar
}

// Estilos (baseados nos de CreateLink para consistência)
const buttonStyleBase: React.CSSProperties = {
  padding: '12px 20px', color: 'white', border: 'none', borderRadius: '6px',
  cursor: 'pointer', fontSize: '1em', fontWeight: 'bold',
  transition: 'background-color 0.2s ease, transform 0.1s ease', marginRight: '10px',
};
const primaryButtonStyle: React.CSSProperties = { ...buttonStyleBase, backgroundColor: '#64b5f6' };
const secondaryButtonStyle: React.CSSProperties = { ...buttonStyleBase, backgroundColor: '#757575', marginTop: '15px' };

const AcceptLink: React.FC<AcceptLinkProps> = ({ onLinkAccepted, onCancel }) => {
  const [linkCode, setLinkCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) {
      setError("Por favor, insira um código de vínculo.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Os códigos são gerados em maiúsculas, então convertemos para garantir a correspondência
      const result = await acceptLink(linkCode.trim().toUpperCase());
      setSuccessMessage(`Vínculo realizado com sucesso!`);
      onLinkAccepted(result.coupleId, result.partnerId);
      // Opcional: Limpar o campo de código ou desabilitar o formulário após o sucesso
      // setLinkCode(''); 
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao aceitar o código de vínculo. Ocorreu um erro desconhecido.");
      }
      console.error("Erro em handleSubmit (AcceptLink):", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '25px', backgroundColor: '#383838', borderRadius: '8px', border: '1px solid #4a4a4a', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0, color: '#64b5f6' }}>Conectar com Parceiro(a)</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="linkCodeInput" style={{ display: 'block', marginBottom: '5px' }}>Insira o Código de Vínculo:</label>
          <input
            type="text"
            id="linkCodeInput" // Mudado para evitar conflito com possível id 'linkCode' em outro lugar
            value={linkCode}
            onChange={(e) => setLinkCode(e.target.value)}
            placeholder="ABCDEF"
            disabled={isLoading || !!successMessage}
            maxLength={6} // Ou o tamanho do seu código gerado
            style={{ padding: '10px', marginRight: '10px', width: '150px', borderRadius: '4px', border: '1px solid #555' }}
          />
          <button type="submit" disabled={isLoading || !!successMessage} style={{...primaryButtonStyle, padding: '10px 15px', marginRight: 0 /* Remove margin for last button in group */ }}>
            {isLoading ? 'Conectando...' : 'Conectar'}
          </button>
        </div>
      </form>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>Erro: {error}</p>}
      {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
      {/* Botão para chamar onCancel */}
      {!successMessage && ( // Só mostra o botão de cancelar se ainda não houve sucesso
        <button onClick={onCancel} style={{...secondaryButtonStyle, marginRight: 0 /* Remove margin */}} disabled={isLoading}>
          Cancelar
        </button>
      )}
    </div>
  );
};

export default AcceptLink;