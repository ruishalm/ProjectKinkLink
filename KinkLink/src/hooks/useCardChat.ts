// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useCardChat.ts
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase'; // Importa a instância do Firestore
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp, // Para timestamps do Firestore
  doc,       // Para referenciar o documento do chat
  writeBatch,// Para operações atômicas
  // setDoc, // Alternativa ao updateDoc se usarmos set com merge
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export interface ChatMessage {
  id: string; // ID do documento Firestore
  userId: string; // ID do usuário que enviou
  username: string; // Nome do usuário que enviou
  text: string;
  timestamp: Timestamp; // Timestamp do Firestore
}

export function useCardChat(cardId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Carregar mensagens do Firestore
  useEffect(() => {
    if (!user || !user.coupleId || !cardId) {
      setMessages([]); // Limpa as mensagens se não houver cardId ou usuário
      setIsLoading(false);
      if (user && !user.coupleId && cardId) {
        console.warn(t('hooks.useCardChat.noCoupleIdWarningLog'));
      }
      return;
    }

    console.log(t('hooks.useCardChat.setupListenerLog', { coupleId: user.coupleId, cardId }));

    setIsLoading(true);
    setError(null);

    // Caminho para a coleção de mensagens dentro da subcoleção do casal
    const messagesPath = `couples/${user.coupleId}/cardChats/${cardId}/messages`;
    const q = query(collection(db, messagesPath), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          userId: data.userId,
          username: data.username,
          text: data.text,
          timestamp: data.timestamp as Timestamp, // Assume que é um Timestamp do Firestore
        });
      });
      setMessages(fetchedMessages);
      setIsLoading(false);
    }, (err) => {
      console.error(t('hooks.useCardChat.loadMessagesErrorLog', { path: messagesPath }), err);
      setError(t('hooks.useCardChat.loadMessagesErrorUser'));
      setMessages([]);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar

  }, [user, cardId, t]); // Depende do user (para coupleId) e cardId

  const sendMessage = async (text: string) => {
    if (!user || !user.id || !user.coupleId || !cardId || !text.trim()) {
      console.warn(t('hooks.useCardChat.sendMessageIncompleteDataWarningLog'), { userId: user?.id, coupleId: user?.coupleId, cardId });
      return;
    }

    const senderUsername = user.username || (user.email ? user.email.split('@')[0] : `User-${user.id.substring(0,5)}`);

    const newMessageData = {
      userId: user.id,
      username: senderUsername,
      text: text.trim(),
      timestamp: Timestamp.now(), // Usa o Timestamp do Firestore
    };

    try {
      const batch = writeBatch(db);

      // 1. Adicionar a nova mensagem
      const messagesPath = `couples/${user.coupleId}/cardChats/${cardId}/messages`;
      const messagesColRef = collection(db, messagesPath);
      const newMessageRef = doc(messagesColRef); // Gera uma referência para a nova mensagem
      batch.set(newMessageRef, newMessageData);

      // 2. Atualizar o documento pai do chat com os detalhes da última mensagem
      const chatDocPath = `couples/${user.coupleId}/cardChats/${cardId}`;
      const chatDocRef = doc(db, chatDocPath);
      batch.set(chatDocRef, { // Usar set com merge:true para criar/atualizar
        lastMessageSenderId: user.id,
        lastMessageTimestamp: newMessageData.timestamp,
        lastMessageTextSnippet: newMessageData.text.substring(0, 50), // Snippet da mensagem
      }, { merge: true });

      await batch.commit();
      console.log(t('hooks.useCardChat.sendMessageSuccessLog', { cardId }));
    } catch (err) {
      console.error(t('hooks.useCardChat.sendMessageErrorLog', { cardId }), err);
      // Poderia definir um estado de erro para a UI aqui
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    isChatReady: !!user?.coupleId && !!cardId // Indica se o chat pode ser usado
  };
}
