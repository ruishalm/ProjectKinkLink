// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\CardChatModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useCardChat, type ChatMessage } from '../hooks/useCardChat';
import { useAuth } from '../contexts/AuthContext';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import styles from './CardChatModal.module.css';
import chatStyles from './CardChat.module.css';
import { Timestamp } from 'firebase/firestore'; // Importa Timestamp
import { useTranslation } from 'react-i18next'; // Importa useTranslation
import { markChatAsSeen } from '../utils/chatNotificationStore'; // Importa a função

interface CardChatModalProps {
  isOpen: boolean; // Adicionado para controlar visibilidade externamente
  cardId: string | null; // Pode ser null se nenhum chat estiver selecionado
  cardTitle?: string; // Título da carta, opcional
  onClose: () => void;
  currentChatLastMessageTimestamp?: Timestamp | null; // Timestamp da última mensagem no chat
  onChatSeen?: (cardId: string) => void; // Callback para notificar que o chat foi visto
}

function CardChatModal({
  isOpen,
  cardId,
  cardTitle,
  onClose,
  currentChatLastMessageTimestamp,
  onChatSeen,
}: CardChatModalProps) {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading, error: chatError } = useCardChat(cardId); // Usa o cardId para o hook
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null); // Ref para o conteúdo do modal
  const { deleteMatch } = useUserCardInteractions();
  const { t } = useTranslation(); // Hook de tradução

  // Efeito para fechar com Escape e clique fora
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
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

  // Efeito para marcar o chat como visto ao abrir
  useEffect(() => {
    // console.log("[CardChatModal] useEffect for marking chat as read. isOpen:", isOpen, "cardId:", cardId, "userId:", user?.id, "currentChatLastMessageTimestamp:", currentChatLastMessageTimestamp);
    if (isOpen && cardId && user?.id && currentChatLastMessageTimestamp) {
      // console.log(`[CardChatModal] Marking chat ${cardId} as seen.`);
      markChatAsSeen(cardId, currentChatLastMessageTimestamp);
      onChatSeen?.(cardId); // Notifica o pai que o chat foi visto para atualizar a UI
    }
  }, [isOpen, cardId, user?.id, currentChatLastMessageTimestamp, onChatSeen]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && cardId) { // Garante que cardId não seja null
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleDesfazerLink = async () => {
    const confirmMessage = t('modals.cardChat.unlinkConfirmMessage', {
      cardTitle: cardTitle || t('modals.cardChat.thisCardFallback')
    });
    if (cardId && window.confirm(confirmMessage)) {
      await deleteMatch(cardId);
      onClose();
    }
  };

  if (!isOpen || !cardId) { // Se não estiver aberto ou não tiver cardId, não renderiza nada
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}> {/* Overlay pode fechar ao clicar */}
      <div className={`${styles.modalContent} klnkl-themed-panel`} ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label={t('modals.cardChat.closeChatAriaLabel')}>X</button>
        
        <div className={chatStyles.chatContainer}>
          <div className={chatStyles.chatHeader}>
            <h3 className={chatStyles.chatHeaderName}>{t('modals.cardChat.chatAboutTitle')}</h3>
            <p className={chatStyles.chatHeaderName} style={{opacity: 0.8, fontSize: '0.9em'}}>
              {cardTitle || t('modals.cardChat.selectedCardFallbackTitle')}
            </p>
          </div>

          {isLoading && <div className={chatStyles.loadingMessages}>{t('modals.cardChat.loadingMessages')}</div>}
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
                    <span>{msg.userId === user?.id ? t('modals.cardChat.currentUserMessageLabel') : (msg.username || t('modals.cardChat.partnerMessageLabel'))}</span>
                    <span style={{ marginLeft: '8px' }}>
                      {msg.timestamp && msg.timestamp.toDate ? 
                        msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                        t('modals.cardChat.timestampNowFallback')}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className={chatStyles.chatInputArea}>
            <input 
              type="text" 
              className={chatStyles.chatInput} 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder={t('modals.cardChat.inputPlaceholder')}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
              disabled={isLoading}
            />
            <button 
              className={`${chatStyles.sendButton} genericButton`}
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || isLoading}
            >
              {t('modals.cardChat.sendButtonLabel')}
            </button>
          </div>
        </div>

        <button className={`${styles.destructiveButton} genericButton genericButtonDestructive`} onClick={handleDesfazerLink} disabled={isLoading}>
          {t('modals.cardChat.unlinkButtonLabel')}
        </button>
      </div>
    </div>
  );
}

export default CardChatModal;
