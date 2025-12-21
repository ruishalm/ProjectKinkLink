// src/pages/AdminUsersPage.tsx
import React, { useEffect, useState, useMemo, Fragment } from 'react';
import { useTranslation } from 'react-i18next'; // Adicionado useTranslation // Adicionado Fragment e useCallback
import { collection, getDocs, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore'; // Adicionado Timestamp
import { db } from '../firebase'; // Ajuste o caminho se necessário
import { type User, type UserFeedback } from '../contexts/AuthContext'; // Ajuste o caminho e adicione UserFeedback
import styles from './AdminUsersPage.module.css';

// Interface para erros do Firebase que possuem um código
interface FirebaseError extends Error {
  code?: string;
}

// Tipos para a funcionalidade de ordenação
type SortableKeys = keyof User | 'newTickets' | 'resolvedTickets';
type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: SortableKeys;
  direction: SortDirection;
}

function AdminUsersPage() {
  const { t } = useTranslation(); // Usa o namespace padrão (translation.json)
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminResponses, setAdminResponses] = useState<Record<string, string>>({}); // Para guardar o texto da resposta do admin por ticketId
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Função auxiliar para formatar Timestamp do Firestore de forma segura
  const formatFirestoreTimestamp = (timestamp: unknown): string => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleDateString();
    }
    // Verifica se é um objeto com a propriedade 'seconds' (estrutura comum de Timestamps não instanciados)
    if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp && typeof (timestamp as { seconds: number }).seconds === 'number') {
      return new Date((timestamp as { seconds: number }).seconds * 1000).toLocaleDateString();
    }
    return t('admin_na');
  };


  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('username'));
        const querySnapshot = await getDocs(usersQuery);
        const usersList = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as User));

        setUsers(usersList);
      } catch (error: unknown) {
        console.error("Erro ao buscar usuários:", error);
        let specificError = t('admin_error_loading_users_generic');
        if (error instanceof Error) {
          const firebaseError = error as FirebaseError; // Usamos nossa interface
          if (firebaseError.code === 'permission-denied') {
            specificError = t('admin_error_loading_users_permission_denied');
          }
          // Poderíamos adicionar mais tratamentos de código de erro aqui se necessário
        }
        setError(specificError);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleToggleSupporter = async (userIdToUpdate: string, currentStatus: boolean | undefined) => {
    try {
      const userDocRef = doc(db, 'users', userIdToUpdate);
      await updateDoc(userDocRef, {
        isSupporter: !currentStatus
      });
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === userIdToUpdate ? { ...u, isSupporter: !currentStatus } : u
        )
      );
      // alert(`Status de apoiador para ${userIdToUpdate} atualizado!`); // Opcional
    } catch (error: unknown) {
      console.error("Erro ao atualizar status de apoiador:", error);
      // Você pode adicionar uma mensagem de erro mais específica se desejar
      // if (error instanceof Error) {
      //   const firebaseError = error as FirebaseError;
      // }
      alert(t('admin_error_updating_supporter_status'));
    }
  };

  const handleAdminResponseChange = (ticketId: string, responseText: string) => {
    setAdminResponses(prev => ({ ...prev, [ticketId]: responseText }));
  };

  const handleSendAdminResponse = async (userId: string, ticketId: string) => {
    const responseText = adminResponses[ticketId];
    if (!responseText || responseText.trim() === "") {
      alert(t('admin_response_cannot_be_empty'));
      return;
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      alert(t('admin_error_user_not_found'));
      return;
    }

    const targetUser = users[userIndex];
    const ticketIndex = targetUser.feedbackTickets?.findIndex(t => t.id === ticketId);

    if (!targetUser.feedbackTickets || ticketIndex === undefined || ticketIndex === -1) {
      alert(t('admin_error_ticket_not_found'));
      return;
    }

    const updatedTickets = targetUser.feedbackTickets.map((ticket, index) =>
      index === ticketIndex
        ? { ...ticket, adminResponse: responseText, respondedAt: Timestamp.now(), status: 'admin_replied' as UserFeedback['status'] }
        : ticket
    );

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { feedbackTickets: updatedTickets });
      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === userId ? { ...u, feedbackTickets: updatedTickets } : u))
      );
      setAdminResponses(prev => ({ ...prev, [ticketId]: '' })); // Limpa o campo de resposta
      alert(t('admin_response_sent_successfully'));
    } catch (error) {
      console.error("Erro ao enviar resposta do admin:", error);
      alert(t('admin_error_sending_response'));
    }
  };

  const toggleExpandRow = (userId: string) => {
    setExpandedRows(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleUpdateTicketStatus = async (userId: string, ticketId: string, newStatus: UserFeedback['status']) => {
    // console.log(`Admin: Tentando atualizar ticket - UserID=${userId}, TicketID=${ticketId}, NovoStatus=${newStatus}`);

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      console.error("Usuário não encontrado no estado local para atualizar ticket.");
      alert(t('admin_error_user_not_found_for_ticket_update'));
      return;
    }

    const targetUser = users[userIndex];
    const ticketIndex = targetUser.feedbackTickets?.findIndex(t => t.id === ticketId);

    if (!targetUser.feedbackTickets || ticketIndex === undefined || ticketIndex === -1) {
      console.error("Ticket não encontrado para o usuário no estado local.");
      alert(t('admin_error_ticket_not_found_for_update'));
      return;
    }

    // Cria uma cópia atualizada dos tickets
    const updatedTickets = targetUser.feedbackTickets.map((ticket, index) =>
      index === ticketIndex ? { ...ticket, status: newStatus } : ticket
    );

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { feedbackTickets: updatedTickets });

      // Atualiza o estado local para refletir a mudança imediatamente
      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === userId ? { ...u, feedbackTickets: updatedTickets } : u))
      );
      // alert(`Status do ticket atualizado para "${newStatus}" para o usuário ${targetUser.username || targetUser.email}.`); // Feedback para o admin
    } catch (error) {
      console.error("Erro ao atualizar status do ticket no Firestore:", error);
      alert(t('admin_error_updating_ticket_status'));
    }
  };

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredUsers = useMemo(() => {
    let sortableUsers = [...users];

    // 1. Filtragem
    const lowerSearchTerm = searchTerm.toLowerCase();
    if (lowerSearchTerm) {
      sortableUsers = sortableUsers.filter(user =>
        (user.username?.toLowerCase().includes(lowerSearchTerm)) ||
        (user.email?.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // 2. Ordenação
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
        let aValue: unknown;
        let bValue: unknown;

        // Lógica para chaves customizadas
        if (sortConfig.key === 'newTickets') {
          aValue = a.feedbackTickets?.filter(t => t.status === 'new').length || 0;
          bValue = b.feedbackTickets?.filter(t => t.status === 'new').length || 0;
        } else if (sortConfig.key === 'resolvedTickets') {
          aValue = a.feedbackTickets?.filter(t => t.status === 'resolved').length || 0;
          bValue = b.feedbackTickets?.filter(t => t.status === 'resolved').length || 0;
        } else {
          aValue = a[sortConfig.key as keyof User];
          bValue = b[sortConfig.key as keyof User];
        }

        // Tratamento para Timestamps
        if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
          aValue = aValue.seconds;
          bValue = bValue.seconds;
        }

        // Compara os valores de forma segura
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortConfig.direction === 'ascending' ? (aValue === bValue ? 0 : aValue ? -1 : 1) : (aValue === bValue ? 0 : aValue ? 1 : -1);
        }

        // Fallback para valores nulos ou indefinidos, tratando-os como menores
        if (aValue == null && bValue != null) return -1;
        if (aValue != null && bValue == null) return 1;
        if (aValue == null && bValue == null) return 0;

        // Se os tipos ainda forem desconhecidos, não ordena
        return 0;
      });
    }

    return sortableUsers;
  }, [users, searchTerm, sortConfig]);

  const getSortIndicator = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  if (loading) return <div className={styles.container}><p>{t('admin_loading_users')}</p></div>;
  if (error) return <div className={styles.container}><p className={styles.errorText}>{error}</p></div>;

  return (
    <div className={styles.container}>
      <h1>{t('admin_manage_users')}</h1>
      <input
        type="text"
        placeholder={t('admin_search_users_placeholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      {sortedAndFilteredUsers.length === 0 && !loading && <p>{t('admin_no_users_found')}</p>}
      <div className={styles.tableWrapper}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th className={styles.truncateCell} onClick={() => requestSort('username')}>{t('admin_username')}{getSortIndicator('username')}</th>
              <th className={styles.truncateCell} onClick={() => requestSort('email')}>{t('admin_email')}{getSortIndicator('email')}</th>
              <th onClick={() => requestSort('isSupporter')}>{t('admin_is_supporter')}{getSortIndicator('isSupporter')}</th>
              <th onClick={() => requestSort('newTickets')}>{t('admin_new_tickets')}{getSortIndicator('newTickets')}</th>
              <th onClick={() => requestSort('resolvedTickets')}>{t('admin_resolved_tickets')}{getSortIndicator('resolvedTickets')}</th>
              <th onClick={() => requestSort('createdAt')}>{t('admin_registration_date')}{getSortIndicator('createdAt')}</th>
              <th>{t('admin_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredUsers.map(u => (
              <Fragment key={u.id}>
                <tr>
                  <td className={styles.truncateCell} title={u.username || t('admin_na')}>{u.username || t('admin_na')}</td>
                  <td className={styles.truncateCell} title={u.email ?? ''}>{u.email}</td>
                  <td>{u.isSupporter ? t('admin_yes') : t('admin_no')}</td>
                  <td>
                    {u.feedbackTickets?.filter(t => t.status === 'new').length || 0}
                  </td>
                  <td>
                    {u.feedbackTickets?.filter(t => t.status === 'resolved').length || 0}
                  </td>
                  <td>{formatFirestoreTimestamp(u.createdAt)}</td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={() => handleToggleSupporter(u.id, u.isSupporter)}
                      className={`${styles.actionButton} genericButton`}
                    >
                      {u.isSupporter ? t('admin_remove_supporter') : t('admin_make_supporter')}
                    </button>
                    <button
                      onClick={() => toggleExpandRow(u.id)}
                      className={`${styles.actionButton} genericButton`}
                    >
                      {expandedRows[u.id] ? t('admin_hide_tickets') : t('admin_view_tickets')}
                    </button>
                  </td>
                </tr>
                {expandedRows[u.id] && (
                  <tr className={styles.expandedTicketsRow}>
                    <td colSpan={7}> {/* Colspan atualizado para 7 colunas */}
                      <div className={styles.ticketsDetailContainer}>
                        <h3>{t('admin_tickets_for')} {u.username || u.email}:</h3>
                        {u.feedbackTickets && u.feedbackTickets.length > 0 ? (
                          <ul className={styles.ticketList}>
                            {u.feedbackTickets.map(ticket => (
                              <li key={ticket.id} className={styles.ticketItem}>
                                <p><strong>{t('admin_id')}</strong> <span className={styles.ticketIdText}>{ticket.id.substring(0, 8)}...</span></p>
                                <p><strong>{t('admin_text')}</strong> {ticket.text}</p>
                                <p><strong>{t('admin_date')}</strong> {ticket.createdAt instanceof Timestamp ? ticket.createdAt.toDate().toLocaleString() : t('admin_invalid_date')}</p>
                                {ticket.adminResponse && (
                                  <p><strong>{t('admin_admin_response')}</strong> {ticket.adminResponse}</p>
                                )}
                                {ticket.respondedAt && (
                                  <p><strong>{t('admin_responded_at')}</strong> {formatFirestoreTimestamp(ticket.respondedAt)}</p>
                                )}
                                  {!ticket.adminResponse && ticket.status !== 'resolved' && ( // Só mostra se não houver resposta e não estiver resolvido
                                    <div className={styles.adminResponseArea}>
                                      <textarea
                                        placeholder={t('admin_type_your_response_here')}
                                        value={adminResponses[ticket.id] || ''}
                                        onChange={(e) => handleAdminResponseChange(ticket.id, e.target.value)}
                                        className={styles.adminResponseTextarea}
                                      />
                                      <button
                                        onClick={() => handleSendAdminResponse(u.id, ticket.id)}
                                        className={`${styles.actionButton} ${styles.sendResponseButton} genericButton`}
                                      > {t('admin_send_response')} </button>
                                    </div>
                                  )}
                                <p><strong>{t('admin_status')}</strong> <span className={`${styles.ticketStatus} ${styles[`ticketStatus-${ticket.status}`]}`}>{ticket.status}</span></p>
                                <div className={styles.ticketActions}>
                                  {ticket.status === 'new' && (
                                    <button onClick={() => handleUpdateTicketStatus(u.id, ticket.id, 'seen')} className={`${styles.actionButton} ${styles.markSeenButton} genericButton`}>
                                      {t('admin_mark_as_seen')}
                                    </button>
                                  )}
                                  {ticket.status !== 'resolved' && (
                                    <button onClick={() => handleUpdateTicketStatus(u.id, ticket.id, 'resolved')} className={`${styles.actionButton} ${styles.markResolvedButton} genericButton`}>
                                      {t('admin_mark_as_resolved')}
                                    </button>
                                  )}
                                  {ticket.status === 'resolved' && (
                                    <button onClick={() => handleUpdateTicketStatus(u.id, ticket.id, 'new')} className={`${styles.actionButton} ${styles.markSeenButton} genericButton`}> {/* Reutilizando markSeenButton para estilo ou crie um novo */}
                                      {t('admin_reopen_ticket')}
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>{t('admin_no_feedback_tickets_for_this_user')}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;