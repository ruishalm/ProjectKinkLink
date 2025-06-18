import React, { useState, useEffect, useRef } from 'react'; // Adicionado useEffect, useRef
import { useAuth, type UserFeedback } from '../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import styles from './UserTicketsModal.module.css'; // Caminho do CSS atualizado
// Link não é mais necessário aqui, pois não haverá navegação interna no modal para login/profile

interface UserTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function UserTicketsModal({ isOpen, onClose }: UserTicketsModalProps) {
  console.log('[UserTicketsPage] Componente montado.'); // Novo log
  const { user, deleteUserFeedbackTicket } = useAuth(); // <<< ADICIONA deleteUserFeedbackTicket
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Para feedback de loading no botão


  const formatFirestoreTimestamp = (timestamp: unknown): string => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString();
    }
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp && typeof (timestamp as { seconds: number }).seconds === 'number') {
      return new Date((timestamp as { seconds: number }).seconds * 1000).toLocaleString();
    }
    return 'N/A';
  };

  const toggleTicketExpansion = (ticketId: string) => {
    setExpandedTicketId(prevId => (prevId === ticketId ? null : ticketId));
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm("Tem certeza que deseja deletar este chamado? Esta ação não pode ser desfeita.")) {
      setIsDeleting(ticketId);
      try {
        await deleteUserFeedbackTicket(ticketId);
        // O estado do usuário no AuthContext será atualizado, e o modal re-renderizará
        // Opcional: mostrar uma mensagem de sucesso
      } catch (error) {
        console.error("Erro ao deletar ticket:", error);
        alert("Falha ao deletar o chamado. Tente novamente.");
      } finally {
        setIsDeleting(null);
      }
    }
  };


  if (!isOpen || !user) return null; // Não renderiza se não estiver aberto ou se não houver usuário

  const tickets = user.feedbackTickets || [];

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="user-tickets-title">
      <div className={`${styles.modalContent} klnkl-themed-panel`} ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeButtonTop} aria-label="Fechar">&times;</button>
        <h2 id="user-tickets-title" className={styles.modalTitle}>Meus Chamados de Suporte</h2>

        {tickets.length === 0 ? (
          <p className={styles.loadingOrEmpty}>Você ainda não enviou nenhum chamado.</p>
        ) : (
        <ul className={styles.ticketList}>
          {tickets.slice().sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((ticket: UserFeedback) => (
            <li key={ticket.id} className={`${styles.ticketItem} ${ticket.status === 'admin_replied' ? styles.adminReplied : ''}`}>
              <div className={styles.ticketHeader} onClick={() => toggleTicketExpansion(ticket.id)}>
                <span className={styles.ticketDate}>
                  Enviado em: {formatFirestoreTimestamp(ticket.createdAt)}
                </span>
                <span className={`${styles.ticketStatus} ${styles[`status-${ticket.status}`]}`}>
                  {ticket.status === 'new' && 'Novo'}
                  {ticket.status === 'seen' && 'Visto pelo Admin'}
                  {ticket.status === 'admin_replied' && 'Respondido'}
                  {ticket.status === 'resolved' && 'Resolvido'}
                </span>
                <span className={styles.ticketToggleIcon}>
                  {expandedTicketId === ticket.id ? '▲' : '▼'}
                </span>
              </div>
              <p className={styles.ticketTextPreview}>
                <strong>Sua Mensagem:</strong> {ticket.text.substring(0, 100)}{ticket.text.length > 100 ? '...' : ''}
              </p>

              {expandedTicketId === ticket.id && (
                <div className={styles.ticketDetails}>
                  <p><strong>Sua Mensagem Completa:</strong></p>
                  <p className={styles.fullText}>{ticket.text}</p>
                  {ticket.adminResponse && (
                    <div className={styles.adminResponseSection}>
                      <p><strong>Resposta do Suporte KinkLink:</strong></p>
                      <p className={styles.adminResponseText}>{ticket.adminResponse}</p>
                      <p className={styles.responseDate}>
                        Respondido em: {formatFirestoreTimestamp(ticket.respondedAt)}
                      </p>
                    </div>
                  )}
                  {/* Botão de Deletar */}
                  <button
                    onClick={() => handleDeleteTicket(ticket.id)}
                    className={`${styles.deleteButton} genericButton genericButtonDestructive`} // Adicione estilos para deleteButton
                    disabled={isDeleting === ticket.id}
                    aria-label={`Deletar chamado: ${ticket.text.substring(0, 30)}...`}
                  >
                    {isDeleting === ticket.id ? 'Deletando...' : 'Deletar Chamado'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        )}
      </div>
    </div>
  );
}

export default UserTicketsModal;