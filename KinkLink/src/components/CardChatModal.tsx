// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\CardChatModal.tsx
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useCardChat, type ChatMessage } from '../hooks/useCardChat';
import { useAuth } from '../contexts/AuthContext'; // Para pegar o ID do usuário atual
import { useUserCardInteractions } from '../hooks/useUserCardInteractions'; // Para a função deleteMatch

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
  backgroundColor: '#1a1a1a', // Fundo escuro (como o verso da carta)
  padding: '20px',
  borderRadius: '12px', // Consistente com PlayingCard
  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
  width: '320px', // Um pouco mais largo para o chat
  minHeight: '450px', // Um pouco mais alto
  maxHeight: 'calc(100vh - 40px)', // Para não exceder a altura da viewport
  display: 'flex',
  flexDirection: 'column',
  border: '8px solid #b71c1c', // Borda vermelha escura (como o verso da carta)
  // fontFamily: '"Georgia", "Times New Roman", serif', // Pode manter ou usar a padrão do app
  fontFamily: '"Trebuchet MS", sans-serif', // Consistente com outras partes do app
  color: '#e0e0e0', // Cor de texto padrão clara para o modal
};

const messagesContainerStyle: CSSProperties = {
  flexGrow: 1,
  overflowY: 'auto',
  marginBottom: '15px',
  padding: '0 5px', // Padding lateral leve
};

// Estilo base para os balões de mensagem
const baseBubbleStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: '15px',
  marginBottom: '8px',
  maxWidth: '75%',
  wordWrap: 'break-word',
  backgroundColor: 'white', // Balões brancos
  color: 'black', // Texto preto
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
};

const myMessageBubbleStyle: CSSProperties = {
  ...baseBubbleStyle,
  alignSelf: 'flex-end',
  borderBottomRightRadius: '5px',
};

const theirMessageBubbleStyle: CSSProperties = {
  ...baseBubbleStyle,
  alignSelf: 'flex-start',
  borderBottomLeftRadius: '5px',
};

const inputAreaStyle: CSSProperties = {
  display: 'flex',
  marginTop: '10px',
};

const inputStyle: CSSProperties = {
  flexGrow: 1,
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '20px', // Bordas arredondadas para o input
  marginRight: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.8)', // Levemente transparente
  color: 'black',
};

const sendButtonStyle: CSSProperties = {
  padding: '10px 15px',
  backgroundColor: '#e53935', // Vermelho vibrante (cor de "Poder" ou do logo)
  color: 'white',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const destructiveButtonStyle: CSSProperties = {
  width: '100%', // Botão largo
  padding: '12px',
  marginTop: '20px',
  backgroundColor: '#757575', // Um cinza neutro, pode ser ajustado
  color: '#e0e0e0',
  border: '1px solid #555',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'normal',
  fontSize: '0.9em',
  textAlign: 'center',
};

function CardChatModal({ cardId, cardTitle, onClose }: CardChatModalProps) {
  const { user } = useAuth(); // Para saber qual mensagem é do usuário atual
  const { messages, sendMessage } = useCardChat(cardId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { deleteMatch } = useUserCardInteractions(); // Pega a função deleteMatch

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


  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderBottom: '1px solid #8c7853', paddingBottom: '10px', marginBottom: '10px', textAlign: 'center' }}>
          <h3 style={{ marginTop: 0, marginBottom: '5px', color: '#e0e0e0' }}>Conversa sobre:</h3>
          <p style={{ fontSize: '0.9em', color: '#ffcdd2', /* Vermelho claro para destaque */ margin: 0, maxHeight: '3.6em', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }}>
            {cardTitle}
          </p>
        </div>
        <div style={messagesContainerStyle}>
          {messages.map((msg: ChatMessage) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.userId === user?.id ? 'flex-end' : 'flex-start' }}>
              <div style={msg.userId === user?.id ? myMessageBubbleStyle : theirMessageBubbleStyle}>
                <strong style={{ fontSize: '0.8em', color: '#555', display: 'block', marginBottom: '2px' }}>
                  {msg.userId === user?.id ? "Você" : msg.username}
                </strong>
                {msg.text}
                <div style={{ fontSize: '0.7em', color: '#777', textAlign: 'right', marginTop: '4px' }}>
                  {/* Correção do Timestamp aqui */}
                  {msg.timestamp && msg.timestamp.toDate ? 
                    msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                    'agora'}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Para rolar para o final */}
        </div>
        <div style={inputAreaStyle}>
          <input type="text" style={inputStyle} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escreva no verso da carta..." onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
          <button style={sendButtonStyle} onClick={handleSendMessage}>Enviar</button>
        </div>
        <button style={destructiveButtonStyle} onClick={handleDesfazerLink}>
          Desfazer Link com esta Carta
        </button>
      </div>
    </div>
  );
}

export default CardChatModal;
