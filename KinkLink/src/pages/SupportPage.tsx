import React from 'react';
import { Link } from 'react-router-dom';
import styles from './SupportPage.module.css'; // Certifique-se que este arquivo CSS existe

const SupportPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      <main className={styles.mainContent}>
        <h1 className={styles.title}>Suporte e Contato</h1>
        <p className={styles.text}>
          Se precisar de ajuda ou tiver alguma dúvida, entre em contato conosco através do e-mail:
        </p>
        <a href="mailto:ruishalm2@gmail.com" className={styles.emailLink}>
          ruishalm2@gmail.com
        </a>
        <p className={styles.text} style={{ marginTop: '30px' }}>
          Você também pode encontrar respostas para perguntas frequentes em nossa seção de FAQ (em breve).
        </p>
        <Link to="/" className={`${styles.backLink} genericButton`}>
          &larr; Voltar para a Página Inicial
        </Link>
      </main>
    </div>
  );
};

export default SupportPage;
