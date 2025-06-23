// MatchCardItem.tsx
import React from 'react';
import PlayingCard, { type CardData as PlayingCardDataType } from './PlayingCard';
import styles from './MatchCardItem.module.css'; // Usará seu próprio CSS module

export interface MatchCardItemProps { // Exportar a interface
  card: PlayingCardDataType;
  onClick: () => void;
  isHot: boolean;
  isUnread: boolean; // Para mensagens de chat não lidas
  isNewlyMatched: boolean; // Para cartas de match recém-descobertas
  onToggleHot?: (cardId: string, event: React.MouseEvent) => void;
  lastMessageSnippet?: string;
  isCompletedCard?: boolean; // Nova prop para indicar se é uma carta da seção "Realizadas"
}

const MatchCardItem: React.FC<MatchCardItemProps> = ({
  card,
  onClick,
  isHot,
  isUnread,
  isNewlyMatched, // Desestruturado aqui
  onToggleHot,
  lastMessageSnippet,
  isCompletedCard // Desestruturado aqui
}) => {
  // A escala agora considera se é uma carta completada para não aplicar o "hot" visual
  const scaleFactor = isHot && !isCompletedCard ? 0.55 : 0.5;
  const cardWidth = 250 * scaleFactor;
  const cardHeight = 350 * scaleFactor;

  return (
    <div
      className={`${styles.cardItemWrapper} ${isUnread ? styles.unreadMatch : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''} // Remove a transformação inline ao sair
      role="button"
      tabIndex={0}
      // O aria-label agora reflete se a carta é nova OU tem mensagens não lidas
      aria-label={`Link: ${card.text.substring(0,30)}... ${(isUnread || isNewlyMatched) ? ' (Novo ou não lido)' : ''}`}
    >
      {/* Mostra a bolinha se houver chat não lido OU for um match novo */}
      {(isUnread || isNewlyMatched) && <div className={styles.unreadIndicator}></div>}
      <PlayingCard
        data={card}
        targetWidth={cardWidth}
        targetHeight={cardHeight}
        isFlipped={false}
        // Não passa onToggleHot se for carta completada
        onToggleHot={!isCompletedCard ? onToggleHot : undefined}
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
