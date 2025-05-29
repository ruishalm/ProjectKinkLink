// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\MatchesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate importado, Link removido
import { useAuth, type MatchedCard } from '../contexts/AuthContext'; // MatchedCard importado de AuthContext
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import { useCoupleCardChats } from '../hooks/useCoupleCardChats'; // Novo hook
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
          <span>✉️ {lastMessageSnippet}</span>
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

  // Helper para verificar se um objeto é um Timestamp do Firestore (duck-typing)
  const isFirestoreTimestamp = (value: unknown): value is Timestamp => {
    return !!value && typeof (value as Timestamp).toDate === 'function' && typeof (value as Timestamp).seconds === 'number' && typeof (value as Timestamp).nanoseconds === 'number';
  };


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
          let lastMessageDate: Date | null = null;
          const ts = chatData.lastMessageTimestamp;

          if (ts) { // Ensure ts is truthy before proceeding
            try {
              if (ts instanceof Date) { // Check if it's already a Date object first
                lastMessageDate = ts;
              } else if (isFirestoreTimestamp(ts)) { // Then check if it's a Firestore Timestamp
                lastMessageDate = ts.toDate();
              } else if (typeof ts === 'string' || typeof ts === 'number') { // Depois tenta converter string/number
                lastMessageDate = new Date(ts);
              } else {
                // Se não for nenhum dos tipos esperados, loga e define como nulo
                console.warn("[MatchesPage] lastMessageTimestamp não é um tipo reconhecido (Date, Firestore Timestamp, string, or number):", ts);
                lastMessageDate = null;
              }

              // Verifica se lastMessageDate foi definido e se é uma data válida
              if (lastMessageDate && isNaN(lastMessageDate.getTime())) {
                lastMessageDate = null;
              }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_e: unknown) { 
              lastMessageDate = null;
            }
          }

          if (lastMessageDate) {
            const lastSeenByClientISO = getLastSeenTimestampForCard(card.id);
            // const lastMessageISO = lastMessageDate.toISOString(); // Removido pois não é usado

            if (!lastSeenByClientISO || new Date(lastSeenByClientISO) < lastMessageDate) {
              isUnread = true;
              if (isChatModalOpen && selectedCardForChat?.id === card.id && isFirestoreTimestamp(ts)) {
                markChatAsSeen(card.id, ts); 
                isUnread = false; 
              }
            }
          }
        }
      }
      newUnreadStatuses[card.id] = isUnread;
    });

    // console.log("[useEffect-UnreadCheck] Setting new unread statuses:", newUnreadStatuses);
    setUnreadStatuses(newUnreadStatuses);
  }, [user, userMatchedCards, cardChatsData, isLoadingCardChats, isChatModalOpen, selectedCardForChat, forceUpdateUnreadKey]);

  const handleCardClick = (card: MatchedCard) => { 
    const cardForModal: PlayingCardDataType = {
        id: card.id,
        text: card.text,
        category: card.category,
        intensity: card.intensity,
        isHot: card.isHot,
    };
    setSelectedCardForChat(cardForModal);
    setIsChatModalOpen(true);
  };

  const handleChatSeen = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_seenCardId: string) => { 
      setForceUpdateUnreadKey(prev => prev + 1);
    }, 
    [] 
  );

  const handleToggleHot = async (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation(); 
    if (user && user.coupleId) {
      await toggleHotStatus(cardId);
    }
  };

  if (!user || isLoadingCardChats && !Object.keys(cardChatsData).length) { 
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
                    card={card} 
                    onClick={() => handleCardClick(card)}
                    isHot={true}
                    isUnread={unreadStatuses[card.id] || false}
                    onToggleHot={handleToggleHot} 
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
                    card={card} 
                    onClick={() => handleCardClick(card)}
                    isHot={false}
                    isUnread={unreadStatuses[card.id] || false}
                    onToggleHot={handleToggleHot} 
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
          isOpen={isChatModalOpen} 
          onClose={() => { setIsChatModalOpen(false); setSelectedCardForChat(null); }}
          cardId={selectedCardForChat.id}
          cardTitle={selectedCardForChat.text} 
          currentChatLastMessageTimestamp={
            cardChatsData?.[selectedCardForChat.id]?.lastMessageTimestamp &&
            isFirestoreTimestamp(cardChatsData[selectedCardForChat.id].lastMessageTimestamp)
              ? cardChatsData[selectedCardForChat.id].lastMessageTimestamp
              : null
          }
          onChatSeen={handleChatSeen}
        />
      )}
    </div>
  );
}

export default MatchesPage;
