// src/pages/AdminUsersPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase'; // Ajuste o caminho se necessário
import { type User } from '../contexts/AuthContext'; // Ajuste o caminho se necessário
import styles from './AdminUsersPage.module.css';

// Interface para erros do Firebase que possuem um código
interface FirebaseError extends Error {
  code?: string;
}

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersQuery = query(collection(db, 'users'), orderBy('username')); // Ordena por username
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

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      (user.username?.toLowerCase().includes(lowerSearchTerm)) ||
      (user.email?.toLowerCase().includes(lowerSearchTerm))
    );
  }, [users, searchTerm]);

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
      {filteredUsers.length === 0 && !loading && <p>Nenhum usuário encontrado com os critérios da busca.</p>}
      <table className={styles.usersTable}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Apoiador?</th>
            <th>Data Cadastro</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(u => (
            <tr key={u.id}>
              <td>{u.username || 'N/A'}</td>
              <td>{u.email}</td>
              <td>{u.isSupporter ? 'Sim ✅' : 'Não ❌'}</td>
              <td>{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
              <td>
                <button
                  onClick={() => handleToggleSupporter(u.id, u.isSupporter)}
                  className={`${styles.actionButton} genericButton`} // Adicionei genericButton para consistência
                >
                  {u.isSupporter ? 'Remover Apoiador' : 'Tornar Apoiador'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsersPage;