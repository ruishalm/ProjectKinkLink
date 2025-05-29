// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useCoupleCardChats.ts
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';

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

  useEffect(() => {
    if (!coupleId) {
      setCardChatsData({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`[useCoupleCardChats] Setting up listener for cardChats in couple ${coupleId}`);

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
      console.error(`[useCoupleCardChats] Error fetching cardChats for couple ${coupleId}:`, err);
      setError("Failed to load chat data.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [coupleId]);

  return { cardChatsData, isLoading, error };
}