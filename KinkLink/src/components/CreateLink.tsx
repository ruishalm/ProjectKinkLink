// CreateLink.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createLink as apiCreateLink } from '../services/linkService';
import { useAuth } from '../contexts/AuthContext';
import styles from './CreateLink.module.css';

interface CreateLinkProps {
  onLinkCreated: (code: string) => void;
  onCancel: () => void;
}

const CreateLink: React.FC<CreateLinkProps> = ({ onLinkCreated, onCancel }) => {
  const { t } = useTranslation();
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
      setError(t('create_link_error_not_logged_in'));
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
      let errorMessage = t('create_link_error_generation_failed');
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
          alert(t('create_link_error_copy_failed'));
        });
    }
  };

  // Constrói a URL de convite quando linkCode estiver disponível
  const inviteUrl = linkCode ? `${getBaseUrl()}/link-couple?inviteCode=${linkCode}` : null;

  const handleCopyLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => alert(t('create_link_success_copy_link'))) // Mensagem um pouco mais clara
        .catch(err => console.error('Erro ao copiar o link: ', err));
    }
  };

  // Lógica de Renderização e JSX
  return (
    <div className={`${styles.section} klnkl-themed-panel`}> {/* Adicionado klnkl-themed-panel */}
      <h2 className={styles.title}>{t('create_link_title')}</h2>
      {!linkCode ? (
        <button onClick={handleCreateLink} disabled={isLoading} className={`${styles.primaryButton} genericButton`}>
          {isLoading ? t('create_link_generating_button') : t('create_link_generate_button')}
        </button>
      ) : (
        <>
          {/* Seção do código com botão de copiar */}
          <div className={styles.codeSection}>
            <p className={styles.infoText}>{t('create_link_share_instruction')}</p>
            <div className={styles.codeAndCopyContainer}>
              <span className={styles.codeDisplay}>{linkCode}</span>
              <button onClick={handleCopyCodeToClipboard} className={`${styles.copyCodeButton} genericButton`} disabled={isCodeCopied}>
                {isCodeCopied ? t('create_link_copied_button') : t('create_link_copy_code_button')}
              </button>
            </div>
          </div>

          {/* Seção do link de convite completo */}
          {inviteUrl && (
            <div className={styles.inviteLinkContainer}>
              <p className={styles.infoText}>{t('create_link_share_link_instruction')}</p>
              <input type="text" readOnly value={inviteUrl} className={styles.linkDisplayInput} onClick={(e) => e.currentTarget.select()} />
              <button onClick={handleCopyLink} className={`${styles.secondaryButton} ${styles.copyLinkButton} genericButton`}>{t('create_link_copy_link_button')}</button> {/* Added genericButton */}
            </div>
          )}
        </>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
      {/* Botão para chamar onCancel */}
      <button onClick={onCancel} className={`${styles.secondaryButton} genericButton`}>
        {linkCode ? t('create_link_done_button') : t('create_link_cancel_button')}
      </button>
    </div>
  );
};
export default CreateLink;
