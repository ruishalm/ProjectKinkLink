// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\CardChatModal.tsx
import React, { useState, useEffect, useRef } from 'react'; // Removido CSSProperties
import { useCardChat, type ChatMessage } from '../hooks/useCardChat';
import { useAuth } from '../contexts/AuthContext'; // Para pegar o ID do usuário atual
import { useUserCardInteractions } from '../hooks/useUserCardInteractions'; // Para a função deleteMatch
import styles from './CardChatModal.module.css'; // Importa os CSS Modules

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
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Conversa sobre:</h3>
          <p className={styles.headerCardTitle}>
            {cardTitle}
          </p>
        </div>
        <div className={styles.messagesContainer}>
          {messages.map((msg: ChatMessage) => (
            <div 
              key={msg.id} 
              className={msg.userId === user?.id ? styles.myMessageWrapper : styles.theirMessageWrapper}
            >
              <div className={msg.userId === user?.id ? styles.myMessageBubble : styles.theirMessageBubble}>
                <strong className={styles.messageUsername}>
                  {msg.userId === user?.id ? "Você" : msg.username}
                </strong>
                {msg.text}
                <div className={styles.messageTimestamp}>
                  {msg.timestamp && msg.timestamp.toDate ? 
                    msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                    'agora'}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className={styles.inputArea}>
          <input type="text" className={styles.input} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreva no verso da carta..." onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
          <button className={styles.sendButton} onClick={handleSendMessage}>Enviar</button>
        </div>
        <button className={styles.destructiveButton} onClick={handleDesfazerLink}>
          Desfazer Link com esta Carta
        </button>
      </div>
    </div>
  );
}

export default CardChatModal;
