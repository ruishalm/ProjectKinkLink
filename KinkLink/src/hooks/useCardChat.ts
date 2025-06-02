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

  // Carregar mensagens do Firestore
  useEffect(() => {
    if (!user || !user.coupleId || !cardId) {
      setMessages([]); // Limpa as mensagens se não houver cardId ou usuário
      setIsLoading(false);
      if (user && !user.coupleId && cardId) {
        console.warn("[useCardChat] Usuário não possui coupleId. Não é possível carregar o chat.");
      }
      return;
    }

    console.log(`[useCardChat] Setting up listener for couple ${user.coupleId}, card ${cardId}`);

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
      console.error(`Erro ao carregar mensagens de ${messagesPath}:`, err);
      setError("Não foi possível carregar as mensagens.");
      setMessages([]);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar

  }, [user, cardId]); // Depende do user (para coupleId) e cardId

  const sendMessage = async (text: string) => {
    if (!user || !user.id || !user.coupleId || !cardId || !text.trim()) {
      console.warn("[useCardChat] Não é possível enviar mensagem: dados incompletos.", { userId: user?.id, coupleId: user?.coupleId, cardId });
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
      console.log(`[useCardChat - sendMessage] Message sent and chat doc updated for ${cardId}.`);
    } catch (err) {
      console.error(`[useCardChat - sendMessage] Error sending message or updating chat doc for ${cardId}:`, err);
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
