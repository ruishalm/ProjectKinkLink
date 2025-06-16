// CreateLink.tsx
import React, { useState } from 'react';
import { createLink as apiCreateLink } from '../services/linkService'; // Renomeado para evitar conflito
import { useAuth } from '../contexts/AuthContext';
import styles from './CreateLink.module.css'; // Importa os CSS Modules

interface CreateLinkProps {
  onLinkCreated: (code: string) => void;
  onCancel: () => void; // Nova prop para cancelar/voltar
}

const CreateLink: React.FC<CreateLinkProps> = ({ onLinkCreated, onCancel }) => {
  // Hooks e Estados
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false); // Novo estado para feedback de cópia do código
  const { user } = useAuth();

  // Funções Manipuladoras
  // A URL base do seu aplicativo. Para um app Firebase hospedado, window.location.origin é uma boa opção.
  // Ou você pode hardcodar se preferir: const baseUrl = "https://kinklink-a4607.web.app";
  const getBaseUrl = () => window.location.origin;

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
    } catch (err: unknown) { // Changed 'any' to 'unknown' for better type safety
      console.error("Erro ao criar link:", err);
      let errorMessage = "Falha ao gerar o código. Tente novamente.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      // Se for um objeto de erro do Firebase com 'code', você pode querer tratar isso também, mas por agora, a mensagem de erro padrão é suficiente.
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
