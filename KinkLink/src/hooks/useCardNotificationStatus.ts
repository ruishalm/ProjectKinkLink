// useCardNotificationStatus.ts
/**
 * Hook customizado para determinar o status de notificação de uma carta
 * 
 * Este hook centraliza a lógica de detecção de:
 * - Novos matches (cartas recém-linkadas que o usuário ainda não viu)
 * - Novas mensagens (mensagens no chat que o usuário ainda não viu)
 * 
 * A lógica utiliza dois mecanismos:
 * 1. Timestamp de última visita à página de matches (Firestore: user.lastVisitedMatchesPage)
 * 2. Timestamp de última visualização por carta (localStorage via chatNotificationStore)
 * 
 * @example
 * const { getCardNotificationStatus } = useCardNotificationStatus(user, cardChatsData);
 * const { isNewMatch, hasNewMessage } = getCardNotificationStatus(card);
 */

import { useCallback, useMemo } from 'react';
import { type MatchedCard, type User } from '../contexts/AuthContext';
import { type CoupleCardChats } from './useCoupleCardChats';
import { getLastSeenTimestampForCard } from '../utils/chatNotificationStore';

export interface CardNotificationStatus {
  isNewMatch: boolean;
  hasNewMessage: boolean;
}

export function useCardNotificationStatus(
  user: User | null,
  cardChatsData: CoupleCardChats
) {
  // Memoiza a data de última visita para evitar conversões repetidas
  const lastVisited = useMemo(
    () => user?.lastVisitedMatchesPage?.toDate(),
    [user?.lastVisitedMatchesPage]
  );

  // Função estável que determina o status de notificação de uma carta
  const getCardNotificationStatus = useCallback(
    (card: MatchedCard): CardNotificationStatus => {
      const matchCreatedAt = card.createdAt?.toDate();
      const chatLastMessageTimestamp = cardChatsData[card.id]?.lastMessageTimestamp?.toDate();
      const lastMessageSenderId = cardChatsData[card.id]?.lastMessageSenderId;

      let isNewMatch = false;
      let hasNewMessage = false;

      // Recupera o timestamp de última visualização do localStorage
      const lastSeenByClientISO = getLastSeenTimestampForCard(card.id);

      // Verifica se é um match novo
      if (lastVisited && matchCreatedAt) {
        // Um match é novo se:
        // 1. Foi criado DEPOIS da última visita à página de matches
        // 2. E ainda não foi visto pelo cliente (localStorage)
        const lastSeenByClient = lastSeenByClientISO ? new Date(lastSeenByClientISO) : null;
        
        if (matchCreatedAt > lastVisited) {
          if (!lastSeenByClient || lastSeenByClient < matchCreatedAt) {
            isNewMatch = true;
          }
        }
      }

      // Verifica se há novas mensagens
      if (chatLastMessageTimestamp) {
        const lastSeenByClient = lastSeenByClientISO ? new Date(lastSeenByClientISO) : null;
        
        // Há nova mensagem se:
        // 1. A última mensagem é mais recente que a última visualização
        // 2. E a mensagem não foi enviada pelo próprio usuário
        if (!lastSeenByClient || lastSeenByClient < chatLastMessageTimestamp) {
          if (lastMessageSenderId !== user?.id) {
            hasNewMessage = true;
          }
        }
      }

      return { isNewMatch, hasNewMessage };
    },
    [lastVisited, cardChatsData, user?.id]
  );

  return { getCardNotificationStatus };
}
