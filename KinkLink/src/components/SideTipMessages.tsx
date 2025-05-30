// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\SideTipMessages.tsx
import React from 'react';
import styles from './SideTipMessages.module.css';

interface SideTipMessagesProps {
  leftMessage: string | null;
  rightMessage: string | null;
  animateIn: boolean;
  cardWidth: number; // Largura da carta atual para cálculo de posicionamento
}

const SideTipMessages: React.FC<SideTipMessagesProps> = ({
  leftMessage,
  rightMessage,
  animateIn,
  cardWidth,
}) => {
  const animationClass = animateIn ? styles.animateIn : '';

  // Max width of the tip container from CSS (e.g., 160px)
  const tipContainerMaxWidth = 160; 
  const tipContainerHalfWidth = tipContainerMaxWidth / 2;

  // Calculate the position for the card's edge relative to its centered position
  // within its parent (cardStackContainer, which is 100% width of its own parent).
  // This is the distance from the side of the cardStackContainer to the edge of the card.
  const cardEdgeFromParentSide = `calc(50% - ${cardWidth / 2}px)`;

  const leftContainerStyle: React.CSSProperties = {
    // Position the left edge of the tip container tipContainerHalfWidth to the left of the card's left edge
    left: `calc(${cardEdgeFromParentSide} - ${tipContainerHalfWidth}px)`,
  };
  const rightContainerStyle: React.CSSProperties = {
    // Position the right edge of the tip container tipContainerHalfWidth to the right of the card's right edge
    right: `calc(${cardEdgeFromParentSide} - ${tipContainerHalfWidth}px)`,
  };

  return (
    <>
      {leftMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.left} ${animationClass}`} style={leftContainerStyle}>
          <div className={styles.tipMessage}>
            {leftMessage}
          </div>
        </div>
      )}
      {rightMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.right} ${animationClass}`} style={rightContainerStyle}>
          <div className={styles.tipMessage}>
            {rightMessage}
          </div>
        </div>
      )}
    </>
  );
};
export default SideTipMessages;