// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\MatchCardItem.tsx
import React from 'react';
import PlayingCard, { type CardData as PlayingCardDataType } from './PlayingCard';
import styles from './MatchCardItem.module.css'; // Usará seu próprio CSS module
import { useTranslation } from 'react-i18next';

export interface MatchCardItemProps { // Exportar a interface
  card: PlayingCardDataType;
  onClick: () => void;
  isHot: boolean;
  isUnread: boolean;
  onToggleHot?: (cardId: string, event: React.MouseEvent) => void;
  lastMessageSnippet?: string;
}

const MatchCardItem: React.FC<MatchCardItemProps> = ({
  card,
  onClick,
  isHot,
  isUnread,
  onToggleHot,
  lastMessageSnippet,
}) => {
  const { t } = useTranslation();
  const scaleFactor = isHot ? 0.55 : 0.5;
  const cardWidth = 250 * scaleFactor;
  const cardHeight = 350 * scaleFactor;

  return (
    <div
      className={`${styles.cardItemWrapper} ${isUnread ? styles.unreadMatch : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      role="button"
      tabIndex={0}
      aria-label={`${t('matchesPage.matchCardAriaLabel', { cardText: card.text.substring(0,30) })} ${isUnread ? t('matchesPage.unreadIndicatorText') : ''}`}
    >
      {isUnread && <div className={styles.unreadIndicator}></div>}
      <PlayingCard
        data={card}
        targetWidth={cardWidth}
        targetHeight={cardHeight}
        isFlipped={false}
        onToggleHot={onToggleHot}
      />
      {isUnread && lastMessageSnippet && (
        <div className={styles.matchCardSnippet}>
          <span>✉️ {lastMessageSnippet}</span>
        </div>
      )}
    </div>
  );
};

export default MatchCardItem;