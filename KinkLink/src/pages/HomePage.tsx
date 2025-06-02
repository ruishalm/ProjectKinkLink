import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect } from 'react'; // Removido CSSProperties
import styles from './HomePage.module.css'; // Importa os CSS Modules

function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // console.log('[HomePage] isLoading:', isLoading, 'User:', user); // Comentado para limpeza

  useEffect(() => {
    // Se o usuário está carregando, não faz nada ainda
    if (isLoading) {
      return;
    }
    if (user) { // Usuário está logado
      // Se o usuário está logado, sempre redireciona para o perfil primeiro.
      navigate('/profile', { replace: true });
    }
    // Se !user (não logado), permanece na HomePage, que é o comportamento desejado.
  }, [user, isLoading, navigate]);

  return (
    <div className={styles.pageContainer}>
      {/* Envolve o conteúdo principal para melhor organização e estilização se o header for sticky */}
      <main className={styles.mainContent}>
        <h1 className={styles.title}>Bem-vindo(a) ao KinkLink!</h1>
        <p className={styles.subTitle}>
          Descubra, explore e conecte-se com seu parceiro(a) de uma maneira totalmente nova.
        </p>
        <div className={styles.buttonContainer}>
          <Link to="/login" className={styles.primaryButton}>Login</Link>
          <Link to="/signup" className={styles.secondaryButton}>Cadastre-se</Link>
        </div>
      </main>
    </div>
  );
}
export default HomePage;
