import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Para ler query params
import { useTranslation } from 'react-i18next';
import { acceptLink } from '../services/linkService'; // Ajuste o caminho se necessário
import { requestNotificationPermission } from '../services/notificationService'; // Importa o novo serviço
import styles from './AcceptLink.module.css'; // Importa os CSS Modules

interface AcceptLinkProps {
  onLinkAccepted: (coupleId: string, partnerId: string) => void;
  onCancel: () => void; // Nova prop para cancelar/voltar
}

const AcceptLink: React.FC<AcceptLinkProps> = ({ onLinkAccepted, onCancel }) => {
  const { t } = useTranslation();
  // Hooks e Estados
  const [linkCode, setLinkCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const location = useLocation(); // Hook para obter informações da URL atual

  // Funções Manipuladoras

  useEffect(() => {
    // Este efeito será executado quando o componente montar ou location.search mudar
    const queryParams = new URLSearchParams(location.search);
    const codeFromUrl = queryParams.get('inviteCode'); // 'inviteCode' é o nome do parâmetro que definimos em CreateLink.tsx
    if (codeFromUrl) {
      setLinkCode(codeFromUrl.toUpperCase()); // Preenche o estado com o código da URL, em maiúsculas
      // Opcional: você poderia até tentar submeter o formulário automaticamente aqui se desejado,
      // mas preencher o campo já é uma grande melhoria de UX.

      // Solicita permissão de notificação assim que a página carrega com um código
      // Isso é opcional, mas pode ser uma boa UX
      requestNotificationPermission().catch(console.error);

    }
  }, [location.search]); // Dependência: location.search

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkCode.trim()) {
      setError(t('accept_link_error_empty'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Os códigos são gerados em maiúsculas, então convertemos para garantir a correspondência
      const result = await acceptLink(linkCode.trim().toUpperCase());

      // Após o vínculo bem-sucedido, solicita permissão e salva o token
      await requestNotificationPermission();

      setSuccessMessage(t('accept_link_success'));
      onLinkAccepted(result.coupleId, result.partnerId);
      // Opcional: Limpar o campo de código ou desabilitar o formulário após o sucesso
      // setLinkCode(''); 
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('accept_link_error_generic'));
      }
      console.error("Erro em handleSubmit (AcceptLink):", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Renderização e JSX
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>{t('accept_link_title')}</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="linkCodeInput" className={styles.label}>{t('accept_link_label')}</label>
          <input
            type="text"
            id="linkCodeInput" // Mudado para evitar conflito com possível id 'linkCode' em outro lugar
            value={linkCode}
            onChange={(e) => setLinkCode(e.target.value)}
            placeholder="ABCDEF"
            disabled={isLoading || !!successMessage}
            maxLength={6} // Ou o tamanho do seu código gerado
            className={styles.input}
          />
          <button type="submit" disabled={isLoading || !!successMessage} className={`${styles.primaryButton} genericButton`}>
            {isLoading ? t('accept_link_connecting_button') : t('accept_link_connect_button')}
          </button>
        </div>
      </form>
      {error && <p className={styles.errorText}>{t('accept_link_error_prefix')} {error}</p>}
      {successMessage && <p className={styles.successText}>{successMessage}</p>}
      {/* Botão para chamar onCancel */}
      {!successMessage && (
        <button onClick={onCancel} className={`${styles.secondaryButton} genericButton`} disabled={isLoading}>
          {t('accept_link_cancel_button')}
        </button>
      )}
    </div>
  );
};
export default AcceptLink;