// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\CardChatModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useCardChat, type ChatMessage } from '../hooks/useCardChat';
import { useAuth } from '../contexts/AuthContext'; // Para pegar o ID do usuário atual
import { useUserCardInteractions } from '../hooks/useUserCardInteractions'; // Para a função deleteMatch
import styles from './CardChatModal.module.css'; // Estilos para o Modal (overlay, content box)
import chatStyles from './CardChat.module.css'; // Estilos para o conteúdo do Chat (mensagens, input, etc.)

interface CardChatModalProps {
  cardId: string;
  cardTitle: string; // Para exibir o título da carta no modal
  onClose: () => void;
}

function CardChatModal({ cardId, cardTitle, onClose }: CardChatModalProps) {
  // Hooks e Estados
  const { user } = useAuth(); // Para saber qual mensagem é do usuário atual
  const { messages, sendMessage } = useCardChat(cardId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { deleteMatch } = useUserCardInteractions(); // Pega a função deleteMatch

  // Efeitos
  useEffect(() => {
    // Listener para fechar com a tecla Escape
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]); // Rola para baixo quando novas mensagens chegam

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleDesfazerLink = async () => {
    if (window.confirm(`Tem certeza que deseja desfazer o Link com a carta "${cardTitle}"? Esta carta voltará para a pilha de ambos.`)) {
      await deleteMatch(cardId);
      onClose(); // Fecha o modal após a ação
    }
  };

  // Lógica de Renderização e JSX
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Botão de fechar do modal, estilizado por CardChatModal.module.css */}
        <button className={styles.closeButton} onClick={onClose} aria-label="Fechar chat">X</button>
        
        {/* Envolve todo o conteúdo do chat com chatStyles.chatContainer */}
        <div className={chatStyles.chatContainer}>
          <div className={chatStyles.chatHeader}>
            <h3 className={chatStyles.chatHeaderName}>Conversa sobre:</h3>
            <p className={chatStyles.chatHeaderName} style={{opacity: 0.8, fontSize: '0.9em'}}>
              {cardTitle}
            </p>
          </div>
          <div className={chatStyles.messagesList}> {/* O logo de fundo será aplicado aqui via CSS */}
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
          <div className={chatStyles.chatInputArea}>
            <input type="text" className={chatStyles.chatInput} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreva no verso da carta..." onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
            <button className={chatStyles.sendButton} onClick={handleSendMessage} disabled={!newMessage.trim()}>Enviar</button>
          </div>
        </div> {/* Fecha o chatStyles.chatContainer */}

        <button className={styles.destructiveButton} onClick={handleDesfazerLink}>
          Desfazer Link
        </button>
      </div>
    </div>
  );
}

export default CardChatModal;
