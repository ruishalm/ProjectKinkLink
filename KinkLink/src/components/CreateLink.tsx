// CreateLink.tsx
import React, { useState } from 'react';
import { createLink as apiCreateLink } from '../services/linkService';
import { useAuth } from '../contexts/AuthContext';
import styles from './CreateLink.module.css';

interface CreateLinkProps {
  onLinkCreated: (code: string) => void;
  onCancel: () => void;
}

const CreateLink: React.FC<CreateLinkProps> = ({ onLinkCreated, onCancel }) => {
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const { user } = useAuth();

  // O AuthContext.onSnapshot detectará automaticamente quando o parceiro aceitar o link
  // Não precisamos mais de um listener aqui - simplificação do fluxo!

  const getBaseUrl = () => window.location.origin;

  const handleCreateLink = async () => {
    if (!user) {
      setError("Você precisa estar logado para criar um link.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const code = await apiCreateLink();
      setLinkCode(code);
      onLinkCreated(code);
    } catch (err: unknown) {
      console.error("Erro ao criar link:", err);
      let errorMessage = "Falha ao gerar o código. Tente novamente.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCodeToClipboard = () => {
    if (linkCode) {
      navigator.clipboard.writeText(linkCode)
        .then(() => {
          setIsCodeCopied(true);
          setTimeout(() => setIsCodeCopied(false), 2500); // Feedback dura 2.5 segundos
        })
        .catch(err => {
          console.error('Falha ao copiar código: ', err);
          alert('Não foi possível copiar o código. Por favor, tente manualmente.');
        });
    }
  };

  // Constrói a URL de convite quando linkCode estiver disponível
  const inviteUrl = linkCode ? `${getBaseUrl()}/link-couple?inviteCode=${linkCode}` : null;

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => alert('Link de convite completo copiado!')) // Mensagem um pouco mais clara
        .catch(err => console.error('Erro ao copiar o link: ', err));
    }
  };

  // Lógica de Renderização e JSX
  return (
    <div className={`${styles.section} klnkl-themed-panel`}> {/* Adicionado klnkl-themed-panel */}
      <h2 className={styles.title}>Gerar Código de Vínculo</h2>
      {!linkCode ? (
        <button onClick={handleCreateLink} disabled={isLoading} className={`${styles.primaryButton} genericButton`}>
          {isLoading ? 'Gerando...' : 'Gerar Meu Código'}
        </button>
      ) : (
        <>
          {/* Seção do código com botão de copiar */}
          <div className={styles.codeSection}>
            <p className={styles.infoText}>Compartilhe este código com seu parceiro(a):</p>
            <div className={styles.codeAndCopyContainer}>
              <span className={styles.codeDisplay}>{linkCode}</span>
              <button onClick={handleCopyCodeToClipboard} className={`${styles.copyCodeButton} genericButton`} disabled={isCodeCopied}>
                {isCodeCopied ? 'Copiado!' : 'Copiar Código'}
              </button>
            </div>
          </div>

          {/* Seção do link de convite completo */}
          {inviteUrl && (
            <div className={styles.inviteLinkContainer}>
              <p className={styles.infoText}>Ou envie este link direto:</p>
              <input type="text" readOnly value={inviteUrl} className={styles.linkDisplayInput} onClick={(e) => e.currentTarget.select()} />
              <button onClick={handleCopyLink} className={`${styles.secondaryButton} ${styles.copyLinkButton} genericButton`}>Copiar Link</button> {/* Added genericButton */}
            </div>
          )}
        </>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
      {/* Botão para chamar onCancel */}
      <button onClick={onCancel} className={`${styles.secondaryButton} genericButton`}>
        {linkCode ? 'Concluído / Voltar' : 'Cancelar'}
      </button>
    </div>
  );
};
export default CreateLink;
