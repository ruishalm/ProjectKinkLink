// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\SideTipMessages.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SideTipMessages.module.css';

interface SideTipMessagesProps {
  leftMessage: string | null;
  rightMessage: string | null;
  animateIn: boolean;
}

const SideTipMessages: React.FC<SideTipMessagesProps> = ({
  leftMessage,
  rightMessage,
  animateIn,
}) => {
  const { t } = useTranslation();
  const animationClass = animateIn ? styles.animateIn : '';

  return (
    <div className={styles.wrapper}>
      {leftMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.left} ${animationClass}`} key={leftMessage}>
          <div className={styles.tipMessage}>
            {t(leftMessage)}
            <span className={styles.bubble1}></span>
          </div>
        </div>
      )}
      {rightMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.right} ${animationClass}`} key={rightMessage}>
          <div className={styles.tipMessage}>
            {t(rightMessage)}
            <span className={styles.bubble1}></span>
          </div>
        </div>
      )}
    </div>
  );
};
export default SideTipMessages;