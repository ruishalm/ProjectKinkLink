// MatchCardItem.tsx
import React from 'react';
import PlayingCard, { type CardData as PlayingCardDataType } from './PlayingCard';
import styles from './MatchCardItem.module.css'; // Usará seu próprio CSS module

export interface MatchCardItemProps { // Exportar a interface
  card: PlayingCardDataType;
  onClick: () => void;
  isHot?: boolean; // Se é um Top Link
  isNewMatch?: boolean; // Se o match é recém-formado
  hasNewMessage?: boolean; // Se há novas mensagens no chat
  onToggleHot?: (cardId: string, event: React.MouseEvent) => void;
  lastMessageSnippet?: string; // Trecho da última mensagem se houver
  isCompletedCard?: boolean; // Nova prop para indicar se é uma carta da seção "Realizadas"
}

const MatchCardItem: React.FC<MatchCardItemProps> = ({
  card,
  onClick,
  isHot, // Se é um Top Link
  isNewMatch, // Se o match é recém-formado
  hasNewMessage, // Se há novas mensagens no chat
  onToggleHot,
  lastMessageSnippet, // Trecho da última mensagem se houver
  isCompletedCard // Se é uma carta da seção "Realizadas"
}) => {
  // A escala agora considera se é uma carta completada para não aplicar o "hot" visual
  const scaleFactor = isHot && !isCompletedCard ? 0.55 : 0.5;
  const cardWidth = 250 * scaleFactor;
  const cardHeight = 350 * scaleFactor;

  return (
    <div
      className={`${styles.cardItemWrapper} ${isNewMatch || hasNewMessage ? styles.unreadMatch : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''} // Remove a transformação inline ao sair
      role="button"
      tabIndex={0}
      // O aria-label agora reflete se a carta é nova OU tem mensagens não lidas
      aria-label={`Link: ${card.text.substring(0,30)}... ${isNewMatch ? ' (Novo Link!)' : ''} ${hasNewMessage ? ' (Nova Mensagem!)' : ''}`}
    >
      {/* Indicador de "Novo" ou "Não Lido" */}
      {(isNewMatch || hasNewMessage) && <div className={styles.unreadIndicator}></div>}
      <PlayingCard
        data={card}
        targetWidth={cardWidth}
        targetHeight={cardHeight}
        isFlipped={false}
        // Não passa onToggleHot se for carta completada
        onToggleHot={!isCompletedCard ? onToggleHot : undefined}
      />
      {hasNewMessage && lastMessageSnippet && (
        <div className={styles.matchCardSnippet}>
          <span>✉️ {lastMessageSnippet}</span>
        </div>
      )}
    </div>
  );
};

export default MatchCardItem;
