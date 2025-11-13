// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\Layout\Header.tsx
import React from 'react';
import { Link } from 'react-router-dom'; // useNavigate não é mais necessário aqui para os tickets
import { useAuth, type UserFeedback } from '../../contexts/AuthContext'; // Adicionado para verificar autenticação e UserFeedback
import styles from './Header.module.css';

// Supondo que o logo esteja em public/kinklogo.png ou um caminho acessível
const logoSrc = '/kinklogo.png'; // Ajuste o caminho se o logo estiver em outro lugar (ex: /assets/images/kinklogo.png)

interface HeaderProps {
  showInstallButton: boolean;
  onInstallClick: () => void;
  onOpenFeedbackModal: () => void; // Nova prop para abrir o modal de feedback
  onOpenUserTicketsModal: () => void; // <<< NOVA PROP
}

const Header: React.FC<HeaderProps> = ({ showInstallButton, onInstallClick, onOpenFeedbackModal, onOpenUserTicketsModal }) => {
  const { isAuthenticated, user, userSymbol } = useAuth(); // Obter o estado de autenticação, o usuário e o SÍMBOLO

  // Verifica se há tickets com respostas do admin não lidas (status 'admin_replied')
  const hasUnreadTicketResponses = isAuthenticated && user?.feedbackTickets?.some(
    (ticket: UserFeedback) => ticket.status === 'admin_replied'
  );

  // const { t } = useTranslation(); // Removido
  return (
    <header className={`${styles.appHeader} klnkl-themed-panel`}>
      <div className={styles.logoContainer}>
        <Link to="/cards" className={styles.logoLink}>
          <img src={logoSrc} alt="KinkLink Logo" className={styles.logoImage} />
          <span className={styles.betaText}>BETA</span>
        </Link>
      </div>
      {/* NOVO: Indicador de Símbolo */}
      <div className={styles.userSymbolContainer}>
        {userSymbol && (
          <div className={styles.userSymbolIndicator}>
            Você é {userSymbol}
          </div>
        )}
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
        {isAuthenticated && ( // Mostrar apenas se o usuário estiver autenticado
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenUserTicketsModal(); // <<< CHAMA A FUNÇÃO PARA ABRIR O MODAL
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onOpenUserTicketsModal(); // <<< CHAMA A FUNÇÃO PARA ABRIR O MODAL
              }
            }}
            role="button" // Define o papel semântico
            tabIndex={0}  // Torna o div focável
            className={`${styles.myTicketsButton} ${styles.iconButton} ck-theme-button genericButton ${hasUnreadTicketResponses ? styles.shakeAnimation : ''}`}
            title="Meus Chamados"
          >
            ✉️
            {hasUnreadTicketResponses && <span className={styles.notificationBadge}>!</span>}
          </div>
        )}
        {/* Adicionada a classe global ck-theme-button para aplicar o estilo do tema */}
        <button
          onClick={onOpenFeedbackModal} // Chama a função para abrir o modal
          className={`${styles.feedbackButton} ck-theme-button genericButton`} // Pode renomear a classe se quiser
        >
          Reportar erro
        </button>
      </div>
    </header>
  );
};
export default Header;
