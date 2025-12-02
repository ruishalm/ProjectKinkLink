// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\CardChatModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useCardChat, type ChatMessage } from '../hooks/useCardChat';
import { useAuth } from '../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import styles from './CardChatModal.module.css';
import chatStyles from './CardChat.module.css';
import { markChatAsSeen } from '../utils/chatNotificationStore';

interface CardChatModalProps {
  isOpen: boolean;
  cardId: string | null;
  cardTitle?: string;
  onClose: () => void;
}

/**
 * Modal que exibe a conversa de chat associada a uma carta de match.
 * Permite enviar mensagens e gerenciar o estado da carta (favoritar, completar, etc.).
 */
function CardChatModal({
  isOpen,
  cardId,
  cardTitle,
  onClose,
}: CardChatModalProps) {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading, error: chatError } = useCardChat(cardId);
  const { matchedCards, toggleHotStatus, toggleCompletedStatus, repeatCard, deleteMatch } = useUserCardInteractions();
  
  const [newMessage, setNewMessage] = useState(''); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Efeito para fechar o modal com a tecla 'Escape' or ao clicar fora dele.
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Efeito para marcar o chat como visto no localStorage quando o modal é aberto.
  // Isso remove o indicador de "nova mensagem".
  useEffect(() => {
    if (isOpen && cardId) {
      const nowAsTimestamp = Timestamp.now();
      markChatAsSeen(cardId, nowAsTimestamp);
    }
  }, [isOpen, cardId]);

  // Efeito para rolar para a mensagem mais recente.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && cardId) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  // Funções de manipulação para as ações da carta.
  const handleToggleHot = () => cardId && toggleHotStatus(cardId);
  const handleToggleCompleted = () => {
    if (cardId) {
      const currentCard = matchedCards.find(card => card.id === cardId);
      toggleCompletedStatus(cardId, !currentCard?.isCompleted);
    }
  };
  const handleRepeatCard = () => cardId && repeatCard(cardId);
  const handleDesfazerLink = async () => {
    if (cardId && window.confirm(`Tem certeza que deseja desfazer o Link com a carta "${cardTitle || 'esta carta'}"? Esta carta voltará para a pilha de ambos.`)) {
      await deleteMatch(cardId);
      onClose();
    }
  };

  const isHot = matchedCards.find(card => card.id === cardId)?.isHot || false;
  const isCompleted = matchedCards.find(card => card.id === cardId)?.isCompleted || false;

  if (!isOpen || !cardId) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} klnkl-themed-panel`} ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
        
        {/* Cabeçalho do Modal com botões de ação */}
        <div className={styles.modalHeaderActions}>
          <div className={styles.actionButtonsGroup}>
            <button
              onClick={isCompleted ? handleRepeatCard : handleToggleCompleted}
              className={`${styles.headerActionButton} ${styles.completedButtonInChat} ${isCompleted ? styles.isCompletedAction : ''}`}
              aria-label={isCompleted ? "Vamos Repetir?!" : "Marcar como Realizada"}
              title={isCompleted ? "Mover para Top Links e marcar como não realizada" : "Marcar esta carta como já realizada"}
            >
              <span className={styles.completedIcon}>{isCompleted ? '🔁' : '✅'}</span>
              <span className={styles.completedText}>{isCompleted ? "Repetir?!" : "Realizada"}</span>
            </button>

            <button
              onClick={handleToggleHot}
              className={`${styles.headerActionButton} ${styles.favoriteButtonInChat} ${isHot ? styles.isHot : ''}`}
              aria-label={isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
              title={isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
              disabled={isCompleted}
            >
              <span className={styles.favoriteIcon}>🔥</span>
              <span className={styles.favoriteText}>Favoritar</span>
            </button>

            <button
              className={`${styles.headerActionButton} ${styles.closeButtonInGroup}`}
              onClick={onClose}
              aria-label="Fechar chat"
            >X</button>
          </div>
        </div>
        
        {/* Corpo do Chat */}
        <div className={chatStyles.chatContainer}>
          <div className={chatStyles.chatHeader}>
            <h3 className={chatStyles.chatHeaderName}>Conversa sobre:</h3>
            <p className={chatStyles.chatHeaderName} style={{opacity: 0.8, fontSize: '0.9em'}}>
              {cardTitle || "Carta selecionada"}
            </p>
          </div>

          {isLoading && <div className={chatStyles.loadingMessages}>Carregando mensagens...</div>}
          {chatError && <div className={chatStyles.chatError}>{chatError}</div>}
          
          {!isLoading && !chatError && (
            <div className={chatStyles.messagesList}>
              {messages.map((msg: ChatMessage) => (
                <div 
                  key={msg.id} 
                  className={msg.userId === user?.id ? chatStyles.messageSent : chatStyles.messageReceived}
                >
                  <div className={chatStyles.messageContent}>{msg.text}</div>
                  <div className={chatStyles.messageInfo}>
                    <span>{msg.userId === user?.id ? "Você" : (msg.username || "Parceiro(a)")}</span>
                    <span style={{ marginLeft: '8px' }}>
                      {msg.timestamp?.toDate ? 
                        msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                        'agora'}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Área de Input da Mensagem */}
          <div className={chatStyles.chatInputArea}>
            <input 
              type="text" 
              className={chatStyles.chatInput} 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder="Escreva no verso da carta..." 
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
              disabled={isLoading}
            />
            <button 
              className={`${chatStyles.sendButton} genericButton`}
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isLoading}
            >
              Enviar
            </button>
          </div>
        </div>

        {/* Ação Destrutiva */}
        <button className={`${styles.destructiveButton} genericButton genericButtonDestructive`} onClick={handleDesfazerLink} disabled={isLoading}>
          Desfazer Link
        </button>
      </div>
    </div>
  );
}

export default React.memo(CardChatModal);
