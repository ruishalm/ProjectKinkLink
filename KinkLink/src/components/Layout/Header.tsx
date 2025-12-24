// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\Layout\Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // useNavigate não é mais necessário aqui para os tickets
import { useAuth, type UserFeedback } from '../../contexts/AuthContext'; // Adicionado para verificar autenticação e UserFeedback
import { useTranslation } from 'react-i18next';
import SymbolExplainerModal from '../SymbolExplainerModal';
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
  const { t } = useTranslation();
  const [isSymbolModalOpen, setIsSymbolModalOpen] = useState(false);

  // Verifica se há tickets com respostas do admin não lidas (status 'admin_replied')
  const hasUnreadTicketResponses = isAuthenticated && user?.feedbackTickets?.some(
    (ticket: UserFeedback) => ticket.status === 'admin_replied'
  );

  return (
    <header className={`${styles.appHeader} klnkl-themed-panel`}>
      <div className={styles.logoContainer}>
        <Link to="/cards" className={styles.logoLink}>
          <img src={logoSrc} alt={t('header_logo_alt')} className={styles.logoImage} />
          <img src="/Natal.png" alt="Christmas Hat" className={styles.christmasHat} />
          <span className={styles.betaText}>ALPHA</span>
        </Link>
      </div>
      {/* NOVO: Indicador de Símbolo */}
      <div className={styles.userSymbolContainer}>
        {userSymbol && (
          <button 
            className={styles.userSymbolIndicator}
            onClick={() => setIsSymbolModalOpen(true)}
            title={t('header_symbol_explainer_title')}
          >
            <span className={styles.symbolLabel}>{t('header_you')}</span>
            <span className={styles.symbolIcon}>{userSymbol}</span>
          </button>
        )}
      </div>
      
      {/* Modal Explicador de Símbolos */}
      <SymbolExplainerModal 
        isOpen={isSymbolModalOpen} 
        onClose={() => setIsSymbolModalOpen(false)} 
      />
      <div className={styles.actionsContainer}> {/* Renomeado para acomodar mais botões */}
        {showInstallButton && (
          <button
            onClick={onInstallClick}
            className={`${styles.installButton} ck-theme-button genericButton`}
            title={t('header_install_title')}
          >
            <span className={styles.installIcon}>📱</span>
            <span className={styles.installText}>{t('header_install_button')}</span>
          </button>
        )}
        {isAuthenticated && ( // Mostrar apenas se o usuário estiver autenticado
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenUserTicketsModal(); // <<< CHAMA A FUNÇÃO PARA ABRIR O MODAL
            }}
            className={`${styles.myTicketsButton} ck-theme-button genericButton ${hasUnreadTicketResponses ? styles.shakeAnimation : ''}`}
            title={t('header_my_tickets_title')}
          >
            <span className={styles.ticketIcon}>✉️</span>
            {hasUnreadTicketResponses && <span className={styles.notificationBadge}>!</span>}
          </button>
        )}
        {/* Adicionada a classe global ck-theme-button para aplicar o estilo do tema */}
        <button
          onClick={onOpenFeedbackModal} // Chama a função para abrir o modal
          className={`${styles.feedbackButton} ck-theme-button genericButton`} // Pode renomear a classe se quiser
          title={t('header_report_bug_title')}
        >
          <span className={styles.feedbackIcon}>🐛</span>
          <span className={styles.feedbackText}>{t('header_report_button')}</span>
        </button>
      </div>
    </header>
  );
};
export default Header;
