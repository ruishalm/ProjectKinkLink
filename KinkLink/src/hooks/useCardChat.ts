import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase'; // Importa a instância do Firestore
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp, // Para timestamps do Firestore
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
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determina o chatRoomId com base no usuário, parceiro vinculado e cardId
  useEffect(() => {
    if (user && user.id && user.linkedPartnerId && cardId) {
      // Ordena os IDs para garantir consistência no chatRoomId, independente de quem iniciou
      const ids = [user.id, user.linkedPartnerId].sort();
      setChatRoomId(`${cardId}_${ids[0]}_${ids[1]}`);
    } else {
      setChatRoomId(null);
    }
  }, [user, cardId]);

  // Carregar mensagens do Firestore quando o chatRoomId mudar
  useEffect(() => {
    if (!chatRoomId) {
      setMessages([]); // Limpa as mensagens se não houver cardId ou usuário
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const messagesColRef = collection(db, 'cardChats', chatRoomId, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'asc'));

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
      console.error("Erro ao carregar mensagens do chat do Firestore:", err);
      setError("Não foi possível carregar as mensagens.");
      setMessages([]);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar

  }, [chatRoomId]);

  const sendMessage = async (text: string) => {
    if (!user || !user.id || !chatRoomId || !text.trim()) return;

    const senderUsername = user.username || (user.email ? user.email.split('@')[0] : `User-${user.id.substring(0,5)}`);

    const newMessageData = {
      userId: user.id,
      username: senderUsername,
      text: text.trim(),
      timestamp: Timestamp.now(), // Usa o Timestamp do Firestore
    };

    try {
      const messagesColRef = collection(db, 'cardChats', chatRoomId, 'messages');
      await addDoc(messagesColRef, newMessageData);
      // Não é necessário setMessages aqui, o onSnapshot cuidará da atualização
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      // Poderia definir um estado de erro para a UI aqui
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    isChatReady: !!chatRoomId && !!user?.linkedPartnerId // Indica se o chat pode ser usado
  };
}