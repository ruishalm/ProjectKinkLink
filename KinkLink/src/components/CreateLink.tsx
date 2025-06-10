// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\CreateLink.tsx
import React, { useState } from 'react';
import { createLink as apiCreateLink } from '../services/linkService'; // Renomeado para evitar conflito
import { useAuth } from '../contexts/AuthContext';
import styles from './CreateLink.module.css'; // Importa os CSS Modules
import { useTranslation } from 'react-i18next';

interface CreateLinkProps {
  onLinkCreated: (code: string) => void;
  onCancel: () => void; // Nova prop para cancelar/voltar
}

const CreateLink: React.FC<CreateLinkProps> = ({ onLinkCreated, onCancel }) => {
  // Hooks e Estados
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useTranslation();
  // Funções Manipuladoras
  const handleCreateLink = async () => {
    if (!user) {
      setError(t('createLinkComponent.errorNotLoggedIn'));
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
      setError(t('createLinkComponent.errorGenerating'));
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Renderização e JSX
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{t('createLinkComponent.title')}</h2>
      {!linkCode ? (
        <button onClick={handleCreateLink} disabled={isLoading} className={`${styles.primaryButton} genericButton`}>
          {isLoading ? t('createLinkComponent.generatingButton') : t('createLinkComponent.generateButton')}
        </button>
      ) : (
        <div>
          <p className={styles.infoText}>{t('createLinkComponent.shareCodeInfo')}</p>
          <p className={styles.codeDisplay}>{linkCode}</p>
        </div>
      )}
      {error && <p className={styles.errorText}>{error}</p>}
      {/* Botão para chamar onCancel */}
      <button onClick={onCancel} className={`${styles.secondaryButton} genericButton`}>
        {linkCode ? t('createLinkComponent.doneButton') : t('buttons.cancel')}
      </button>
    </div>
  );
};
export default CreateLink;