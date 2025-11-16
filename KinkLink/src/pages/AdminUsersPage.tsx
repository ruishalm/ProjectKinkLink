// src/pages/AdminUsersPage.tsx
import React, { useEffect, useState, useMemo, Fragment } from 'react'; // Adicionado Fragment e useCallback
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
    return 'N/A';
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
        let specificError = "Falha ao carregar usuários. Verifique as regras de segurança do Firestore e a conexão.";
        if (error instanceof Error) {
          const firebaseError = error as FirebaseError; // Usamos nossa interface
          if (firebaseError.code === 'permission-denied') {
            specificError = "Permissão negada ao buscar usuários. Certifique-se de que você está logado como administrador e que as regras do Firestore estão corretas.";
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
      alert("Falha ao atualizar status de apoiador.");
    }
  };

  const handleAdminResponseChange = (ticketId: string, responseText: string) => {
    setAdminResponses(prev => ({ ...prev, [ticketId]: responseText }));
  };

  const handleSendAdminResponse = async (userId: string, ticketId: string) => {
    const responseText = adminResponses[ticketId];
    if (!responseText || responseText.trim() === "") {
      alert("A resposta não pode estar vazia.");
      return;
    }

    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      alert("Erro: Usuário não encontrado.");
      return;
    }

    const targetUser = users[userIndex];
    const ticketIndex = targetUser.feedbackTickets?.findIndex(t => t.id === ticketId);

    if (!targetUser.feedbackTickets || ticketIndex === undefined || ticketIndex === -1) {
      alert("Erro: Ticket não encontrado para este usuário.");
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
      alert("Resposta enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar resposta do admin:", error);
      alert("Falha ao enviar resposta. Verifique o console.");
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
      alert("Erro: Usuário não encontrado para atualizar o ticket.");
      return;
    }

    const targetUser = users[userIndex];
    const ticketIndex = targetUser.feedbackTickets?.findIndex(t => t.id === ticketId);

    if (!targetUser.feedbackTickets || ticketIndex === undefined || ticketIndex === -1) {
      console.error("Ticket não encontrado para o usuário no estado local.");
      alert("Erro: Ticket não encontrado para este usuário.");
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
      alert("Falha ao atualizar o status do ticket. Verifique o console para mais detalhes.");
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

  if (loading) return <div className={styles.container}><p>Carregando usuários...</p></div>;
  if (error) return <div className={styles.container}><p className={styles.errorText}>{error}</p></div>;

  return (
    <div className={styles.container}>
      <h1>Gerenciar Usuários</h1>
      <input
        type="text"
        placeholder="Pesquisar por nome de usuário ou email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      {sortedAndFilteredUsers.length === 0 && !loading && <p>Nenhum usuário encontrado com os critérios da busca.</p>}
      <div className={styles.tableWrapper}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th onClick={() => requestSort('username')}>Username{getSortIndicator('username')}</th>
              <th onClick={() => requestSort('email')}>Email{getSortIndicator('email')}</th>
              <th onClick={() => requestSort('isSupporter')}>Apoiador?{getSortIndicator('isSupporter')}</th>
              <th onClick={() => requestSort('newTickets')}>Tickets Novos{getSortIndicator('newTickets')}</th>
              <th onClick={() => requestSort('resolvedTickets')}>Tickets Resolvidos{getSortIndicator('resolvedTickets')}</th>
              <th onClick={() => requestSort('createdAt')}>Data Cadastro{getSortIndicator('createdAt')}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredUsers.map(u => (
              <Fragment key={u.id}>
                <tr>
                  <td>{u.username || 'N/A'}</td>
                  <td>{u.email}</td>
                  <td>{u.isSupporter ? 'Sim ✅' : 'Não ❌'}</td>
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
                      {u.isSupporter ? 'Remover Apoiador' : 'Tornar Apoiador'}
                    </button>
                    <button
                      onClick={() => toggleExpandRow(u.id)}
                      className={`${styles.actionButton} genericButton`}
                    >
                      {expandedRows[u.id] ? 'Ocultar Tickets' : `Ver Tickets`}
                    </button>
                  </td>
                </tr>
                {expandedRows[u.id] && (
                  <tr className={styles.expandedTicketsRow}>
                    <td colSpan={7}> {/* Colspan atualizado para 7 colunas */}
                      <div className={styles.ticketsDetailContainer}>
                        <h3>Tickets de {u.username || u.email}:</h3>
                        {u.feedbackTickets && u.feedbackTickets.length > 0 ? (
                          <ul className={styles.ticketList}>
                            {u.feedbackTickets.map(ticket => (
                              <li key={ticket.id} className={styles.ticketItem}>
                                <p><strong>ID:</strong> <span className={styles.ticketIdText}>{ticket.id.substring(0, 8)}...</span></p>
                                <p><strong>Texto:</strong> {ticket.text}</p>
                                <p><strong>Data:</strong> {ticket.createdAt instanceof Timestamp ? ticket.createdAt.toDate().toLocaleString() : 'Data inválida'}</p>
                                {ticket.adminResponse && (
                                  <p><strong>Resposta Admin:</strong> {ticket.adminResponse}</p>
                                )}
                                {ticket.respondedAt && (
                                  <p><strong>Respondido em:</strong> {formatFirestoreTimestamp(ticket.respondedAt)}</p>
                                )}
                                  {!ticket.adminResponse && ticket.status !== 'resolved' && ( // Só mostra se não houver resposta e não estiver resolvido
                                    <div className={styles.adminResponseArea}>
                                      <textarea
                                        placeholder="Digite sua resposta aqui..."
                                        value={adminResponses[ticket.id] || ''}
                                        onChange={(e) => handleAdminResponseChange(ticket.id, e.target.value)}
                                        className={styles.adminResponseTextarea}
                                      />
                                      <button
                                        onClick={() => handleSendAdminResponse(u.id, ticket.id)}
                                        className={`${styles.actionButton} ${styles.sendResponseButton} genericButton`}
                                      >Enviar Resposta</button>
                                    </div>
                                  )}
                                <p><strong>Status:</strong> <span className={`${styles.ticketStatus} ${styles[`ticketStatus-${ticket.status}`]}`}>{ticket.status}</span></p>
                                <div className={styles.ticketActions}>
                                  {ticket.status === 'new' && (
                                    <button onClick={() => handleUpdateTicketStatus(u.id, ticket.id, 'seen')} className={`${styles.actionButton} ${styles.markSeenButton} genericButton`}>
                                      Marcar como Visto
                                    </button>
                                  )}
                                  {ticket.status !== 'resolved' && (
                                    <button onClick={() => handleUpdateTicketStatus(u.id, ticket.id, 'resolved')} className={`${styles.actionButton} ${styles.markResolvedButton} genericButton`}>
                                      Marcar como Resolvido
                                    </button>
                                  )}
                                  {ticket.status === 'resolved' && (
                                    <button onClick={() => handleUpdateTicketStatus(u.id, ticket.id, 'new')} className={`${styles.actionButton} ${styles.markSeenButton} genericButton`}> {/* Reutilizando markSeenButton para estilo ou crie um novo */}
                                      Reabrir Ticket
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Nenhum ticket de feedback para este usuário.</p>
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