// DemoCard.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DemoCardData } from './demoCardData';
import styles from './InteractiveDemo.module.css';

interface DemoCardProps {
  card: DemoCardData;
  dragVisuals?: { x: number; active: boolean; dir: number };
  exitDirection?: 'left' | 'right' | null;
  onAnimationComplete?: () => void;
}

const DemoCard: React.FC<DemoCardProps> = ({ card, dragVisuals, exitDirection, onAnimationComplete }) => {
  const { t } = useTranslation();

  if (!card) {
    return <div className={styles.demoCard}>{t('demo_card_loading')}</div>;
  }

  const categoryClassName = card.category ? styles[`cardCategory_${card.category.toLowerCase().replace(/\s+/g, '')}`] : styles.cardCategory_outros;
  const displayIntensity = typeof card.intensity === 'number' && !isNaN(card.intensity) ? card.intensity : '-';
  const displayCategoryName = card.category ? t(`category_${card.category.toLowerCase()}`) : "N/A";

  let cardDynamicClassName = styles.demoCard;

  const getCardDynamicStyle = (): React.CSSProperties => {
    if (dragVisuals && dragVisuals.active) {
      return {
        transform: `translateX(${dragVisuals.x}px) rotateZ(${dragVisuals.x / 20}deg)`,
        transition: 'none', // Remove transição durante o drag
      };
    } else if (exitDirection) {
      cardDynamicClassName = `${styles.demoCard} ${styles.exiting}`; // A classe ainda precisa ser ajustada
      return {
        transform: `translateX(${exitDirection === 'right' ? '200%' : '-200%'}) rotateZ(${exitDirection === 'right' ? 15 : -15}deg)`,
        opacity: 0,
        transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
      };
    }
    // Estilo padrão quando não está arrastando nem saindo
    return {
      transform: 'translateX(0px) rotateZ(0deg)',
      opacity: 1,
      transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    };
  };
  const cardDynamicStyle = getCardDynamicStyle();

  return (
    <div 
      className={`${cardDynamicClassName} ${categoryClassName}`} 
      style={cardDynamicStyle}
      onTransitionEnd={() => {
        if (exitDirection && onAnimationComplete) onAnimationComplete();
      }}
    >
      <div className={`${styles.demoCardHeader} ${styles.topLeft}`}>
        <span className={styles.demoCardIntensity}>{displayIntensity}</span>
        <span className={styles.demoCardCategory}>{displayCategoryName}</span>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.demoCardText}>
          <p>{t(card.text)}</p>
        </div>
      </div>

      <div className={`${styles.demoCardHeader} ${styles.bottomRight}`}>
        <span className={styles.demoCardIntensity}>{displayIntensity}</span>
        <span className={styles.demoCardCategory}>{displayCategoryName}</span>
      </div>
    </div>
  );
};

export default DemoCard;
