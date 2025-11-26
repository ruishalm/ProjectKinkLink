// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\SideTipMessages.tsx
import React from 'react';
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
  const animationClass = animateIn ? styles.animateIn : '';

  return (
    <>
      {leftMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.left} ${animationClass}`}>
          <div className={styles.tipMessage}>
            {leftMessage}
            <span className={styles.bubble1}></span>
          </div>
        </div>
      )}
      {rightMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.right} ${animationClass}`}>
          <div className={styles.tipMessage}>
            {rightMessage}
            <span className={styles.bubble1}></span>
          </div>
        </div>
      )}
    </>
  );
};
export default SideTipMessages;