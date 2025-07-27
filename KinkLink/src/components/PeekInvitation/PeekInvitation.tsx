import React from 'react';
import styles from './PeekInvitation.module.css';

interface PeekInvitationProps {
  onAccept: () => void;
  onReject: () => void;
}

const PeekInvitation: React.FC<PeekInvitationProps> = ({ onAccept, onReject }) => {
  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContent} klnkl-themed-panel`}>
        <h2 className={styles.title}>Opa! 👀</h2>
        <p className={styles.message}>
          Seu parceiro(a) é um(a) safadinho(a)! Gostaria de dar uma espiada no que chamou a atenção dele(a)?
        </p>
        <div className={styles.buttonContainer}>
          <button onClick={onAccept} className={`${styles.acceptButton} genericButton`}>
            Estou curioso(a)
          </button>
          <button onClick={onReject} className={`${styles.rejectButton} genericButton`}>
            Vou me manter nos meus limites
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeekInvitation;