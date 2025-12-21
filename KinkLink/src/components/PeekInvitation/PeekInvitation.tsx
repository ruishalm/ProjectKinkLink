import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PeekInvitation.module.css';

interface PeekInvitationProps {
  onAccept: () => void;
  onReject: () => void;
}

const PeekInvitation: React.FC<PeekInvitationProps> = ({ onAccept, onReject }) => {
  const { t } = useTranslation();
  return (
    <div className={styles.overlay}>
      <div className={`${styles.modalContent} klnkl-themed-panel`}>
        <h2 className={styles.title}>{t('peek_invitation_title')}</h2>
        <p className={styles.message}>
          {t('peek_invitation_message')}
        </p>
        <div className={styles.buttonContainer}>
          <button onClick={onAccept} className={`${styles.acceptButton} genericButton`}>
            {t('peek_invitation_accept')}
          </button>
          <button onClick={onReject} className={`${styles.rejectButton} genericButton`}>
            {t('peek_invitation_reject')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PeekInvitation;