// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\CardChatModal.tsx
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useCardChat, type ChatMessage } from '../hooks/useCardChat';
import { useAuth } from '../contexts/AuthContext'; // Para pegar o ID do usuário atual

interface CardChatModalProps {
  cardId: string;
  cardTitle: string; // Para exibir o título da carta no modal
  onClose: () => void;
}

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1050, // Maior que o MatchModal
};

const modalContentStyle: CSSProperties = {
  padding: '20px',
  borderRadius: '8px', // Ajustado para consistência com PlayingCard (era 12px)
  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  width: '300px', // Largura similar à PlayingCard
  minHeight: '420px', // Altura similar à PlayingCard
  maxHeight: 'calc(100vh - 40px)', // Para não exceder a altura da viewport
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f9f9f9', // Fundo similar à PlayingCard
  border: '1px solid #b0b0b0', // Borda similar à PlayingCard
};

const messagesContainerStyle: CSSProperties = {
  flexGrow: 1,
  overflowY: 'auto',
  marginBottom: '15px',
  padding: '10px', // Padding interno para as mensagens
  backgroundColor: '#fff', // Fundo branco para a área de mensagens
  borderRadius: '4px',
};

const messageStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: '15px',
  marginBottom: '8px',
  maxWidth: '75%',
  wordWrap: 'break-word',
};

const inputAreaStyle: CSSProperties = {
  display: 'flex',
  marginTop: '10px',
};

const inputStyle: CSSProperties = {
  flexGrow: 1,
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '5px 0 0 5px',
  marginRight: '-1px', // Para juntar com o botão
};

const sendButtonStyle: CSSProperties = {
  padding: '10px 15px',
  backgroundColor: '#55efc4',
  color: '#2d3436',
  border: '1px solid #55efc4',
  borderRadius: '0 5px 5px 0',
  cursor: 'pointer',
};

function CardChatModal({ cardId, cardTitle, onClose }: CardChatModalProps) {
  const { user } = useAuth(); // Para saber qual mensagem é do usuário atual
  const { messages, sendMessage } = useCardChat(cardId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '5px', color: '#333' }}>Chat da Carta:</h3>
          <p style={{ fontSize: '0.9em', color: '#555', margin: 0, maxHeight: '3.6em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {cardTitle}
          </p>
        </div>
        <div style={messagesContainerStyle}>
          {messages.map((msg: ChatMessage) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.userId === user?.id ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...messageStyle, backgroundColor: msg.userId === user?.id ? '#dcf8c6' : '#f0f0f0' }}>
                <strong>{msg.username}: </strong>{msg.text}
                <div style={{ fontSize: '0.75em', color: '#888', textAlign: 'right', marginTop: '3px' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Para rolar para o final */}
        </div>
        <div style={inputAreaStyle}>
          <input type="text" style={inputStyle} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
          <button style={sendButtonStyle} onClick={handleSendMessage}>Enviar</button>
        </div>
        <button onClick={onClose} style={{ marginTop: '15px', padding: '10px', cursor: 'pointer', backgroundColor: '#ccc', border: 'none', borderRadius: '4px' }}>Fechar Chat</button>
      </div>
    </div>
  );
}

export default CardChatModal;
