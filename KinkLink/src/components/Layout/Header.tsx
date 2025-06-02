import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

// Supondo que o logo esteja em public/kinklogo.png ou um caminho acessível
const logoSrc = '/kinklogo.png'; // Ajuste o caminho se o logo estiver em outro lugar (ex: /assets/images/kinklogo.png)

const Header: React.FC = () => {
  return (
    <header className={styles.appHeader}>
      <div className={styles.logoContainer}>
        <Link to="/" className={styles.logoLink}> {/* Link para a HomePage ou Dashboard */}
          <img src={logoSrc} alt="KinkLink Logo" className={styles.logoImage} />
        </Link>
      </div>
      <div className={styles.supportContainer}>
        {/* Adicionada a classe global ck-theme-button para aplicar o estilo do tema */}
        <Link
          to="/suporte"
          className={`${styles.supportButton} ck-theme-button genericButton`}>
          Suporte e Contato
        </Link>
      </div>
    </header>
  );
};

export default Header;