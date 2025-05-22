// d:\Projetos\Github\app\KinkLink\KinkLink\src\hooks\useCardChat.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ChatMessage {
  id: string; // ID único da mensagem
  // cardId: string; // Não é estritamente necessário aqui se o hook é por cardId
  userId: string; // ID do usuário que enviou
  username: string; // Nome do usuário que enviou
  text: string;
  timestamp: number; // Usaremos timestamp numérico para facilitar o armazenamento e ordenação
}

const KINKLINK_CHAT_STORAGE_PREFIX = 'kinklink_chat_';

export function useCardChat(cardId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const getStorageKey = useCallback(() => {
    if (!user || !cardId) return null;
    return `${KINKLINK_CHAT_STORAGE_PREFIX}${user.id}_${cardId}`;
  }, [user, cardId]);

  // Carregar mensagens do localStorage quando o cardId ou user mudar
  useEffect(() => {
    if (!cardId || !user) {
      setMessages([]); // Limpa as mensagens se não houver cardId ou usuário
      return;
    }

    const storageKey = getStorageKey();
    if (!storageKey) return;

    try {
      const storedMessages = localStorage.getItem(storageKey);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens do chat do localStorage:", error);
      setMessages([]);
    }
  }, [cardId, user, getStorageKey]);

  const sendMessage = useCallback((text: string) => {
    if (!user || !cardId || !text.trim()) return; // Precisa estar logado, ter um cardId e texto

    const newMessage: ChatMessage = {
      id: new Date().toISOString() + Math.random().toString(36).substring(2), // ID simples
      userId: user.id,
      username: user.username || user.email.split('@')[0],
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages, newMessage];
      const storageKey = getStorageKey();
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      }
      return updatedMessages;
    });
  }, [user, cardId, getStorageKey]);

  return { messages, sendMessage };
}