// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\CardChatModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useCardChat, type ChatMessage } from '../hooks/useCardChat';
import { useAuth } from '../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore'; // <<< ADICIONADO
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import styles from './CardChatModal.module.css';
import chatStyles from './CardChat.module.css';
import { markChatAsSeen } from '../utils/chatNotificationStore'; // Importa a função

interface CardChatModalProps {
  isOpen: boolean; // Adicionado para controlar visibilidade externamente
  cardId: string | null; // Pode ser null se nenhum chat estiver selecionado
  cardTitle?: string; // Título da carta, opcional
  onClose: () => void;
}

function CardChatModal({
  isOpen,
  cardId,
  cardTitle,
  onClose,
}: CardChatModalProps) {
  const { user } = useAuth();
  const { messages, sendMessage, isLoading, error: chatError } = useCardChat(cardId); // Usa o cardId para o hook
  // O modal agora busca seus próprios dados e funções de interação
  const { matchedCards, toggleHotStatus, toggleCompletedStatus, repeatCard, deleteMatch } = useUserCardInteractions();
  const [newMessage, setNewMessage] = useState(''); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null); // Ref para o conteúdo do modal

  // Efeito para fechar com Escape e clique fora
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (event: MouseEvent) => {
      // A verificação de isOpen garante que a lógica de limpeza da URL não seja chamada desnecessariamente
      if (isOpen && modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Adiciona os listeners apenas quando o modal está aberto
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);

      // <<< CORREÇÃO PRINCIPAL >>>
      // Limpa o hash da URL quando o modal é fechado, não importa como.
      // Isso é feito na função de limpeza do useEffect, que roda quando o componente desmonta ou `isOpen` muda para `false`.
      if (window.location.hash.startsWith('#card-')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
  }, [isOpen, onClose]);

  // Efeito para marcar o chat como visto ao abrir
  useEffect(() => {
    if (isOpen && cardId) {
      // Ao abrir o modal, marca o chat como visto usando a data e hora atuais.
      // Isso é mais simples e garante que qualquer mensagem vista ao abrir
      // não será mais notificada.
      const nowAsTimestamp = Timestamp.now();
      markChatAsSeen(cardId, nowAsTimestamp);
    }
  }, [isOpen, cardId]);


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

  const handleToggleHot = () => {
    if (cardId) {
      toggleHotStatus(cardId);
    }
  };

  const handleToggleCompleted = () => {
    if (cardId) {
      // A lógica para determinar o novo status é movida para cá
      const currentCard = matchedCards.find(card => card.id === cardId);
      toggleCompletedStatus(cardId, !currentCard?.isCompleted);
    }
  };

  const handleRepeatCard = () => {
    if (cardId) {
      repeatCard(cardId);
    }
  };

  const handleDesfazerLink = async () => {
    if (cardId && window.confirm(`Tem certeza que deseja desfazer o Link com a carta "${cardTitle || 'esta carta'}"? Esta carta voltará para a pilha de ambos.`)) {
      await deleteMatch(cardId);
      onClose();
    }
  };

  // Determina os status da carta buscando nos dados mais recentes do hook
  const isHot = matchedCards.find(card => card.id === cardId)?.isHot || false;
  const isCompleted = matchedCards.find(card => card.id === cardId)?.isCompleted || false;

  if (!isOpen || !cardId) { // Se não estiver aberto ou não tiver cardId, não renderiza nada
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}> {/* Overlay pode fechar ao clicar */}
      <div className={`${styles.modalContent} klnkl-themed-panel`} ref={modalContentRef} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho com ações e botão de fechar */}
        <div className={styles.modalHeaderActions}>
          <div className={styles.actionButtonsGroup}> {/* Renomeado de leftHeaderActions e agora contém todos os 3 botões */}
            {/* Botão de Marcar como Realizada / Repetir (AGORA PRIMEIRO) */}
            {cardId && (
              <button
                onClick={isCompleted ? handleRepeatCard : handleToggleCompleted}
                className={`${styles.headerActionButton} ${styles.completedButtonInChat} ${isCompleted ? styles.isCompletedAction : ''}`}
                aria-label={isCompleted ? "Vamos Repetir?!" : "Marcar como Realizada"}
                title={isCompleted ? "Mover para Top Links e marcar como não realizada" : "Marcar esta carta como já realizada"}
              >
                <span className={styles.completedIcon}>{isCompleted ? '🔁' : '✅'}</span>
                <span className={styles.completedText}>{isCompleted ? "Repetir?!" : "Realizada"}</span>
              </button>
            )}

            {/* Botão de Favoritar (AGORA SEGUNDO) */}
            {cardId && (
              <button
                onClick={handleToggleHot}
                className={`${styles.headerActionButton} ${styles.favoriteButtonInChat} ${isHot ? styles.isHot : ''}`}
                aria-label={isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
                title={isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
                disabled={isCompleted} // Desabilitado se a carta estiver completada
              >
                <span className={styles.favoriteIcon}>🔥</span>
                <span className={styles.favoriteText}>Favoritar</span>
              </button>
            )}

            {/* Botão de Fechar (AGORA DENTRO DO GRUPO) */}
            <button
              className={`${styles.headerActionButton} ${styles.closeButtonInGroup}`} // Nova classe para o X dentro do grupo
              onClick={onClose}
              aria-label="Fechar chat"
            >X</button>
          </div>
        </div>
        
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
                      {msg.timestamp && msg.timestamp.toDate ? 
                        msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                        'agora'}
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

        <button className={`${styles.destructiveButton} genericButton genericButtonDestructive`} onClick={handleDesfazerLink} disabled={isLoading}>
          Desfazer Link
        </button>
      </div>
    </div>
  );
}

export default React.memo(CardChatModal);
