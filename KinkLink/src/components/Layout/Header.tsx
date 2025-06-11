// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\Layout\Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
// import { useTranslation } from 'react-i18next'; // Removido
import styles from './Header.module.css';

// Supondo que o logo esteja em public/kinklogo.png ou um caminho acessível
const logoSrc = '/kinklogo.png'; // Ajuste o caminho se o logo estiver em outro lugar (ex: /assets/images/kinklogo.png)

interface HeaderProps {
  showInstallButton: boolean;
  onInstallClick: () => void;
  onOpenFeedbackModal: () => void; // Nova prop para abrir o modal de feedback
}

const Header: React.FC<HeaderProps> = ({ showInstallButton, onInstallClick, onOpenFeedbackModal }) => {
  // const { t } = useTranslation(); // Removido
  return (
    <header className={`${styles.appHeader} klnkl-themed-panel`}>
      <div className={styles.logoContainer}>
        <Link to="/cards" className={styles.logoLink}> {/* Link para a página de cartas */}
          <img src={logoSrc} alt="KinkLink Logo" className={styles.logoImage} />
        </Link>
      </div>
      <div className={styles.actionsContainer}> {/* Renomeado para acomodar mais botões */}
        {showInstallButton && (
          <button
            onClick={onInstallClick}
            className={`${styles.installButton} ck-theme-button genericButton`}
            title="Adicionar KinkLink à sua tela inicial"
          >
            Instalar App
            {/* Você pode adicionar um ícone aqui depois, quando tiver os ícones prontos */}
            {/* <img src="/icons/install-icon.svg" alt="" className={styles.buttonIcon} /> */}
          </button>
        )}
        {/* Adicionada a classe global ck-theme-button para aplicar o estilo do tema */}
        <button
          onClick={onOpenFeedbackModal} // Chama a função para abrir o modal
          className={`${styles.feedbackButton} ck-theme-button genericButton`} // Pode renomear a classe se quiser
        >
          Feedback {/* String fixa */}
        </button>
      </div>
    </header>
  );
};
export default Header;
