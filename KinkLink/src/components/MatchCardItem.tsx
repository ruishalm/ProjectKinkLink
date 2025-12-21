// MatchCardItem.tsx
/**
 * Componente que representa uma carta no grid de matches
 * 
 * Exibe badges visuais para diferentes estados:
 * - 🔴 Badge vermelho (unreadIndicator): Novo match OU nova mensagem não lida
 * - ✉️ Snippet: Prévia da última mensagem (apenas se hasNewMessage = true)
 * - 🔥 Indicador hot: Aparece em cartas completadas que são favoritas
 * - 🔥 Botão toggle: Aparece em cartas ativas (não completadas) para favoritar/desfavoritar
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import PlayingCard, { type CardData as PlayingCardDataType } from './PlayingCard';
import styles from './MatchCardItem.module.css'; // Usará seu próprio CSS module

export interface MatchCardItemProps { // Exportar a interface
  card: PlayingCardDataType;
  onClick: () => void;
  isHot?: boolean; // Se é um Top Link (favorito)
  isNewMatch?: boolean; // Se o match é recém-formado (não visto ainda)
  hasNewMessage?: boolean; // Se há mensagens não lidas no chat
  onToggleHot?: (cardId: string, event: React.MouseEvent) => void;
  lastMessageSnippet?: string; // Trecho da última mensagem se houver
  isCompletedCard?: boolean; // Se é uma carta da seção "Realizadas" (desabilita toggle e badges de notificação)
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
  const { t } = useTranslation(['translation', 'cards']);
  // A escala agora considera se é uma carta completada para não aplicar o "hot" visual
  const scaleFactor = isHot && !isCompletedCard ? 0.55 : 0.5;
  const cardWidth = 250 * scaleFactor;
  const cardHeight = 350 * scaleFactor;

  // Traduz o texto para o aria-label
  const displayText = t(card.id, { ns: 'cards', defaultValue: card.text });

  // Garante que a carta sempre tenha uma categoria para evitar crashes
  const safeCardData = {
    ...card,
    category: card.category || 'geral', // Se a categoria for undefined, usa 'geral'
  };

  return (
    <div
      className={`${styles.cardItemWrapper} ${isNewMatch || hasNewMessage ? styles.unreadMatch : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''} // Remove a transformação inline ao sair
      role="button"
      tabIndex={0}
      // O aria-label agora reflete se a carta é nova OU tem mensagens não lidas
      aria-label={`${t('match_card_item_aria_label_prefix')} ${(displayText || t('match_card_item_text_unavailable')).substring(0,30)}... ${isNewMatch ? t('match_card_item_new_link') : ''} ${hasNewMessage ? t('match_card_item_new_message') : ''}`}
    >
      {/* Indicador de "Novo" ou "Não Lido" */}
      {(isNewMatch || hasNewMessage) && <div className={styles.unreadIndicator}></div>}
      
      {/* Indicador de "Hot" para cartas completadas */}
      {isCompletedCard && isHot && <div className={styles.completedHotIndicator}>🔥</div>}
      
      <PlayingCard
        data={safeCardData}
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
