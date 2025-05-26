import React from 'react';
import styles from './CardBack.module.css'; // Importa os CSS Modules

function CardBack() {
  return (
    <div className={styles.cardBack}>
      {/* Fundo com linhas diagonais */}
      <div className={styles.diagonalLines}></div>

      {/* Texto diagonal */}
      <div className={styles.diagonalText}>
        Kink 🔗 Link
      </div>
    </div>
  );
}

export default CardBack;
