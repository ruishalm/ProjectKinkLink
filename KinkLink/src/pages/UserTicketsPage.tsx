import React, { useState } from 'react';
import { useAuth, type UserFeedback } from '../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import styles from './UserTicketsPage.module.css';
import { Link } from 'react-router-dom';

function UserTicketsPage() {
  const { user } = useAuth();
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

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

  if (!user) {
    return (
      <div className={`${styles.pageContainer} ${styles.loadingOrEmpty}`}>
        <p>Você precisa estar logado para ver seus tickets.</p>
        <Link to="/login" className="genericButton">Ir para Login</Link>
      </div>
    );
  }

  const tickets = user.feedbackTickets || [];

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Meus Chamados de Suporte</h1>
      <Link to="/profile" className={`${styles.backButton} genericButton`}>Voltar ao Perfil</Link>

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
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserTicketsPage;