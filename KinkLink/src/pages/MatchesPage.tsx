// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\MatchesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate importado, Link removido
import { useAuth, type MatchedCard } from '../contexts/AuthContext'; // MatchedCard importado de AuthContext
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import { useCoupleCardChats } from '../hooks/useCoupleCardChats'; // Novo hook, CardChatData removido
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CardChatModal from '../components/CardChatModal';
import { getLastSeenTimestampForCard, markChatAsSeen } from '../utils/chatNotificationStore'; // Helpers do localStorage
import styles from './MatchesPage.module.css';
import { Timestamp } from 'firebase/firestore';


interface MatchCardItemProps {
  card: PlayingCardDataType; // Usando PlayingCardDataType para consistência
  onClick: () => void;
  isHot: boolean;
  isUnread: boolean;
  onToggleHot?: (cardId: string, event: React.MouseEvent) => void; // Atualizado para incluir o evento
  lastMessageSnippet?: string;
}

function MatchCardItem({ card, onClick, isHot, isUnread, onToggleHot, lastMessageSnippet }: MatchCardItemProps) {
  const scaleFactor = isHot ? 0.55 : 0.5;
  const cardWidth = 250 * scaleFactor;
  const cardHeight = 350 * scaleFactor;
  return (
    <div
      className={`${styles.cardItemWrapper} ${isUnread ? styles.unreadMatch : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      role="button"
      tabIndex={0}
      aria-label={`Link: ${card.text.substring(0,30)}... ${isUnread ? ' (Não lido)' : ''}`}
    >
      {isUnread && <div className={styles.unreadIndicator}></div>}
      <PlayingCard
        data={card}
        targetWidth={cardWidth}
        targetHeight={cardHeight}
        isFlipped={false} // Sempre mostrar a frente na lista de matches
        onToggleHot={onToggleHot} // Passa o handler para PlayingCard
      />
      {isUnread && lastMessageSnippet && (
        <div className={styles.matchCardSnippet}>
          {lastMessageSnippet}
        </div>
      )}
    </div>
  );
}


function MatchesPage() {
  const { user } = useAuth();
  const { matchedCards: userMatchedCards, toggleHotStatus } = useUserCardInteractions();
  const navigate = useNavigate();
  const { cardChatsData, isLoading: isLoadingCardChats, error: cardChatsError } = useCoupleCardChats(user?.coupleId);

  const [selectedCardForChat, setSelectedCardForChat] = useState<PlayingCardDataType | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [unreadStatuses, setUnreadStatuses] = useState<{ [key: string]: boolean }>({});
  const [forceUpdateUnreadKey, setForceUpdateUnreadKey] = useState(0); // Para forçar re-cálculo
  const [hasUnseenGlobalMatches, setHasUnseenGlobalMatches] = useState(false);


  // Efeito para verificar matches não visualizados globalmente (para o botão da nav)
  useEffect(() => {
    if (userMatchedCards) {
      const lastSeenMatchesCount = parseInt(localStorage.getItem('kinklink_lastSeenMatchesCount') || '0', 10);
      if (userMatchedCards.length > lastSeenMatchesCount) {
        setHasUnseenGlobalMatches(true);
      } else {
        setHasUnseenGlobalMatches(false);
      }
    }
  }, [userMatchedCards]);

  const handleMatchesButtonClick = () => {
    if (userMatchedCards) {
      localStorage.setItem('kinklink_lastSeenMatchesCount', String(userMatchedCards.length));
    }
    setHasUnseenGlobalMatches(false);
    navigate('/cards'); // Navega para a página de cartas (ou /matches se preferir)
  };


  useEffect(() => {
    // console.log("[useEffect-UnreadCheck] Effect triggered. Dependencies:", { userExists: !!user, coupleId: user?.coupleId, matchedCardsLength: userMatchedCards?.length, isLoadingCardChats, forceUpdateUnreadKey });
    // console.log("[useEffect-UnreadCheck] cardChatsData:", cardChatsData);

    if (!user || !user.id || !user.coupleId || !userMatchedCards || userMatchedCards.length === 0 || isLoadingCardChats) {
      // console.log("[useEffect-UnreadCheck] Condition guard met. Returning early.");
      setUnreadStatuses({});
      return;
    }

    // console.log("[useEffect-UnreadCheck] Proceeding to check unread status for ALL cards.");
    // console.log("[useEffect-UnreadCheck] Current user.id for comparison:", user.id);

    const newUnreadStatuses: { [key: string]: boolean } = {};

    userMatchedCards.forEach(card => {
      const chatData = cardChatsData[card.id];
      let isUnread = false;

      if (chatData && chatData.lastMessageSenderId && chatData.lastMessageTimestamp) {
        if (chatData.lastMessageSenderId !== user.id) {
          const lastSeenByClientISO = getLastSeenTimestampForCard(card.id);
          const lastMessageTimestamp = chatData.lastMessageTimestamp instanceof Timestamp 
                                        ? chatData.lastMessageTimestamp.toDate() 
                                        : new Date(chatData.lastMessageTimestamp); // Lida com possível formato diferente se não for Timestamp
          const lastMessageISO = lastMessageTimestamp.toISOString();
          
          // console.log(`[useEffect-UnreadCheck] Card ${card.id}: lastMsgSender=${chatData.lastMessageSenderId}, lastMsgTime=${lastMessageISO}, clientLastSeen=${lastSeenByClientISO}`);

          if (!lastSeenByClientISO || new Date(lastSeenByClientISO) < new Date(lastMessageISO)) {
            isUnread = true;
            // Se o modal deste chat estiver aberto, marca como visto imediatamente
            // Esta lógica é mais para o caso de uma mensagem chegar enquanto o modal já está aberto.
            // A principal marcação de "visto" ocorre quando o modal é aberto.
            if (isChatModalOpen && selectedCardForChat?.id === card.id) {
              // console.log(`[useEffect-UnreadCheck] Card ${card.id} chat is open, marking as read inside useEffect.`);
              markChatAsSeen(card.id, chatData.lastMessageTimestamp);
              isUnread = false; // Já considera lido se o modal estiver aberto
            }
          }
        }
      }
      newUnreadStatuses[card.id] = isUnread;
    });

    // console.log("[useEffect-UnreadCheck] Setting new unread statuses:", newUnreadStatuses);
    setUnreadStatuses(newUnreadStatuses);
  }, [user, userMatchedCards, cardChatsData, isLoadingCardChats, isChatModalOpen, selectedCardForChat, forceUpdateUnreadKey]);

  const handleCardClick = (card: MatchedCard) => { // MatchedCard é o tipo correto aqui
    // Convertendo MatchedCard para PlayingCardDataType se necessário, ou ajustando props
    const cardForModal: PlayingCardDataType = {
        id: card.id,
        text: card.text,
        category: card.category,
        intensity: card.intensity,
        isHot: card.isHot,
    };
    setSelectedCardForChat(cardForModal);
    setIsChatModalOpen(true);
    // A lógica de marcar como visto será acionada pelo CardChatModal ao receber as props
    // e chamar onChatSeen, que por sua vez atualiza forceUpdateUnreadKey.
  };

  const handleChatSeen = useCallback(() => { // Parâmetro _seenCardId removido
    // console.log(`[MatchesPage] Chat seen for card ${seenCardId}, forcing unread status re-check.`);
    setForceUpdateUnreadKey(prev => prev + 1);
  }, []);

  const handleToggleHot = async (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Impede que o clique no coração abra o chat
    if (user && user.coupleId) {
      await toggleHotStatus(cardId);
    }
  };

  if (!user || isLoadingCardChats && !Object.keys(cardChatsData).length) { // Mostra carregando se user não existe OU se está carregando chats e ainda não tem nenhum dado de chat
    return <div className={styles.page}><p>Carregando seus links...</p></div>;
  }
  if (cardChatsError) {
    return <div className={styles.page}><p>Erro ao carregar dados dos chats: {cardChatsError}</p></div>;
  }

  const hotMatches = userMatchedCards.filter(card => card.isHot);
  const otherMatches = userMatchedCards.filter(card => !card.isHot);
  const noMatchesCondition = hotMatches.length === 0 && otherMatches.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Seus Links</h1>
        <button onClick={handleMatchesButtonClick} className={`${styles.backToCardsButton} ${hasUnseenGlobalMatches ? styles.shakeAnimation : ''}`}>
          {hasUnseenGlobalMatches && <span className={styles.navNotificationDot}></span>}
          Cartas
        </button>
      </div>

      {noMatchesCondition ? (
        <p className={styles.noMatchesText}>
          Você ainda não tem Links. Continue explorando as cartas!
        </p>
      ) : (
        <>
          {hotMatches.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>🔥 Top Links</h2>
              <div className={styles.matchesGrid}>
                {hotMatches.map((card: MatchedCard) => (
                  <MatchCardItem
                    key={card.id}
                    card={card} // Passa o objeto card completo
                    onClick={() => handleCardClick(card)}
                    isHot={true}
                    isUnread={unreadStatuses[card.id] || false}
                    onToggleHot={handleToggleHot} // Passa a função handleToggleHot
                    lastMessageSnippet={unreadStatuses[card.id] ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}                  
                  />
                ))}
              </div>
            </section>
          )}

          {otherMatches.length > 0 && (
            <section className={styles.section} style={hotMatches.length > 0 ? { marginTop: '40px' } : {}}>
              <h2 className={`${styles.sectionTitle} ${styles.sectionTitleOthers}`}>
                {hotMatches.length > 0 ? 'Outros Links' : 'Seus Links'}
              </h2>
              <div className={styles.matchesGrid}>
                {otherMatches.map((card: MatchedCard) => (
                  <MatchCardItem
                    key={card.id}
                    card={card} // Passa o objeto card completo
                    onClick={() => handleCardClick(card)}
                    isHot={false}
                    isUnread={unreadStatuses[card.id] || false}
                    onToggleHot={handleToggleHot} // Passa a função handleToggleHot
                    lastMessageSnippet={unreadStatuses[card.id] ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}                  
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {isChatModalOpen && selectedCardForChat && user && (
        <CardChatModal
          isOpen={isChatModalOpen} // Passa o estado de abertura
          onClose={() => { setIsChatModalOpen(false); setSelectedCardForChat(null); }}
          cardId={selectedCardForChat.id}
          cardTitle={selectedCardForChat.text} // Passa o título da carta
          currentChatLastMessageTimestamp={cardChatsData?.[selectedCardForChat.id]?.lastMessageTimestamp || null}
          onChatSeen={handleChatSeen}
        />
      )}
    </div>
  );
}

export default MatchesPage;
