import React, { useState } from 'react';
import { acceptLink } from '../services/linkService'; // Ajuste o caminho se necessário
import styles from './AcceptLink.module.css'; // Importa os CSS Modules
import { useTranslation } from 'react-i18next';

interface AcceptLinkProps {
  onLinkAccepted: (coupleId: string, partnerId: string) => void;
  onCancel: () => void; // Nova prop para cancelar/voltar
}

const AcceptLink: React.FC<AcceptLinkProps> = ({ onLinkAccepted, onCancel }) => {
  // Hooks e Estados
  const [linkCode, setLinkCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { t } = useTranslation();
  // Funções Manipuladoras
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) {
      setError(t('acceptLinkComponent.errorEnterCode'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Os códigos são gerados em maiúsculas, então convertemos para garantir a correspondência
      const result = await acceptLink(linkCode.trim().toUpperCase());
      setSuccessMessage(t('acceptLinkComponent.success'));
      onLinkAccepted(result.coupleId, result.partnerId);
      // Opcional: Limpar o campo de código ou desabilitar o formulário após o sucesso
      // setLinkCode(''); 
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message); // Mantém a mensagem de erro específica do serviço se disponível
      } else {
        setError(t('acceptLinkComponent.errorAcceptingGeneric'));
      }
      console.error("Erro em handleSubmit (AcceptLink):", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Renderização e JSX
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>{t('acceptLinkComponent.title')}</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="linkCodeInput" className={styles.label}>{t('acceptLinkComponent.inputLabel')}</label>
          <input
            type="text"
            id="linkCodeInput" // Mudado para evitar conflito com possível id 'linkCode' em outro lugar
            value={linkCode}
            onChange={(e) => setLinkCode(e.target.value)}
            placeholder="ABCDEF"
            disabled={isLoading || !!successMessage}
            maxLength={6} 
            className={styles.input}
          />
          <button type="submit" disabled={isLoading || !!successMessage} className={`${styles.primaryButton} genericButton`}>
            {isLoading ? t('acceptLinkComponent.connectingButton') : t('acceptLinkComponent.connectButton')}
          </button>
        </div>
      </form>
      {error && <p className={styles.errorText}>{error}</p>} {/* O erro já virá traduzido ou será a msg do serviço */}
      {successMessage && <p className={styles.successText}>{successMessage}</p>}
      {/* Botão para chamar onCancel */}
      {!successMessage && (
        <button onClick={onCancel} className={`${styles.secondaryButton} genericButton`} disabled={isLoading}>
          {t('acceptLinkComponent.cancelButton')}
        </button>
      )}
    </div>
  );
};
export default AcceptLink;