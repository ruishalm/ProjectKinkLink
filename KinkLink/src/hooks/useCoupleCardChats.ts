// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useCoupleCardChats.ts
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export interface CardChatData {
  id: string; // cardId
  lastMessageSenderId?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageTextSnippet?: string;
  // Outros campos que você possa ter no documento cardChats
}

export interface CoupleCardChats {
  [cardId: string]: CardChatData;
}

export function useCoupleCardChats(coupleId: string | null | undefined) {
  const [cardChatsData, setCardChatsData] = useState<CoupleCardChats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!coupleId) {
      setCardChatsData({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(t('hooks.useCoupleCardChats.setupListenerLog', { coupleId }));

    const cardChatsColPath = `couples/${coupleId}/cardChats`;
    const q = query(collection(db, cardChatsColPath));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chats: CoupleCardChats = {};
      querySnapshot.forEach((doc) => {
        chats[doc.id] = { id: doc.id, ...doc.data() } as CardChatData;
      });
      setCardChatsData(chats);
      setIsLoading(false);
    }, (err) => {
      console.error(t('hooks.useCoupleCardChats.fetchErrorLog', { coupleId }), err);
      setError(t('hooks.useCoupleCardChats.loadErrorUserMessage'));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [coupleId, t]);

  return { cardChatsData, isLoading, error };
}