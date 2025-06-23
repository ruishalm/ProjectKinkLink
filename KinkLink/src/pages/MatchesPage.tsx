// MatchesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type MatchedCard } from '../contexts/AuthContext';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import { useCoupleCardChats } from '../hooks/useCoupleCardChats';
// Importa apenas o tipo CardData, pois o componente PlayingCard não é usado diretamente aqui.
import { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CardChatModal from '../components/CardChatModal';
import CategoryCarousel from '../components/CategoryCarousel';
import { getLastSeenTimestampForCard, markChatAsSeen } from '../utils/chatNotificationStore';
import { useSkin } from '../contexts/SkinContext';
import styles from './MatchesPage.module.css';
import { Timestamp } from 'firebase/firestore';

// MatchCardItem é importado e usado, mas sua interface MatchCardItemProps não precisa ser importada separadamente aqui.
// A interface MatchCardItemProps é exportada pelo MatchCardItem.tsx e usada lá.
import MatchCardItem from '../components/MatchCardItem';


function MatchesPage() {
  const { user } = useAuth();
  const { matchedCards: userMatchedCards, toggleHotStatus, toggleCompletedStatus, repeatCard } = useUserCardInteractions();
  const navigate = useNavigate();
  const { isLoadingSkins } = useSkin();
  const location = useLocation();
  const { cardChatsData, isLoading: isLoadingCardChats, error: cardChatsError } = useCoupleCardChats(user?.coupleId);

  // O tipo PlayingCardDataType é usado apenas para selectedCardForChat, que é passado para CardChatModal.
  const [selectedCardForChat, setSelectedCardForChat] = useState<PlayingCardDataType | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [unreadStatuses, setUnreadStatuses] = useState<{ [key: string]: boolean }>({});
  const [newlyMatchedCardIds, setNewlyMatchedCardIds] = useState<string[]>([]);
  const [forceUpdateUnreadKey, setForceUpdateUnreadKey] = useState(0);
  const [hasUnseenGlobalMatches, setHasUnseenGlobalMatches] = useState(false);
  const completedSectionRef = useRef<HTMLDivElement>(null);

  // Efeito para abrir o modal de chat se a URL tiver um hash #card-CARD_ID
  useEffect(() => {
    if (location.hash && location.hash.startsWith('#card-')) {
      const cardIdFromHash = location.hash.substring('#card-'.length);
      if (cardIdFromHash && userMatchedCards) {
        const cardToOpen = userMatchedCards.find(card => card.id === cardIdFromHash);
        if (cardToOpen) {
          setTimeout(() => {
            handleCardClick(cardToOpen);
          }, 100);
        } else {
          console.warn(`[MatchesPage] Card com ID ${cardIdFromHash} do hash não encontrado nos matches.`);
        }
      }
    }
  }, [location.hash, userMatchedCards]);

  // Efeito para identificar cartas recém-combinadas (newly matched)
  useEffect(() => {
    if (userMatchedCards && userMatchedCards.length > 0) {
      const lastVisitedMatchIdsString = localStorage.getItem('kinklink_lastVisitedMatchIds');
      const lastVisitedMatchIds: string[] = lastVisitedMatchIdsString ? JSON.parse(lastVisitedMatchIdsString) : [];

      const currentMatchIds = userMatchedCards.map(card => card.id);
      const newMatches = currentMatchIds.filter(id => !lastVisitedMatchIds.includes(id));

      setNewlyMatchedCardIds(newMatches);
      // Se houver qualquer match novo, a flag global de "não visto" é true
      if (newMatches.length > 0) {
        setHasUnseenGlobalMatches(true);
      } else {
        setHasUnseenGlobalMatches(false); // Se não há novos matches, garante que a flag global seja false
      }

      // REMOVIDO: localStorage.setItem('kinklink_lastVisitedMatchIds', JSON.stringify(currentMatchIds));
      // Esta linha causava o bug de marcar todas as cartas como vistas imediatamente.
      // A atualização do localStorage agora ocorre apenas em handleCardClick e handleMatchesButtonClick.

    } else {
      setNewlyMatchedCardIds([]);
      setHasUnseenGlobalMatches(false);
      // Se não há matches, limpa também o localStorage para evitar que matches futuros sejam marcados como "vistos"
      localStorage.removeItem('kinklink_lastVisitedMatchIds');
    }
  }, [userMatchedCards]); // Depende apenas de userMatchedCards

  const isFirestoreTimestamp = (value: unknown): value is Timestamp => {
    return !!value && typeof (value as Timestamp).toDate === 'function' && typeof (value as Timestamp).seconds === 'number' && typeof (value as Timestamp).nanoseconds === 'number';
  };

  const handleMatchesButtonClick = () => {
    // Esta função é chamada ao clicar no botão "Cartas" para voltar para a CardPilePage.
    // A atualização de 'kinklink_lastVisitedMatchIds' é feita aqui para marcar todas as cartas como vistas.
    if (userMatchedCards) {
      localStorage.setItem('kinklink_lastVisitedMatchIds', JSON.stringify(userMatchedCards.map(card => card.id)));
      // Mantém a atualização da contagem para o botão na CardPilePage (se ainda usado lá)
      localStorage.setItem('kinklink_lastSeenMatchesCount', String(userMatchedCards.length));
    }
    setHasUnseenGlobalMatches(false); // Zera a flag global para o botão "Cartas"
    navigate('/cards');
  };


  useEffect(() => {
    if (!user || !user.id || !user.coupleId || !userMatchedCards || userMatchedCards.length === 0 || isLoadingCardChats) {
      setUnreadStatuses({});
      return;
    }
    
    const newUnreadStatuses: { [key: string]: boolean } = {};

    userMatchedCards.forEach(card => {
      const chatData = cardChatsData[card.id];
      let isUnread = false;

      if (chatData && chatData.lastMessageSenderId && chatData.lastMessageTimestamp) {
        if (chatData.lastMessageSenderId !== user.id) {
          let lastMessageDate: Date | null = null;
          const ts = chatData.lastMessageTimestamp;

          if (ts) {
            try {
              if (ts instanceof Date) {
                lastMessageDate = ts;
              } else if (isFirestoreTimestamp(ts)) {
                lastMessageDate = ts.toDate();
              } else if (typeof ts === 'string' || typeof ts === 'number') {
                lastMessageDate = new Date(ts);
              } else {
                console.warn("[MatchesPage] lastMessageTimestamp não é um tipo reconhecido:", ts);
                lastMessageDate = null;
              }

              if (lastMessageDate && isNaN(lastMessageDate.getTime())) {
                lastMessageDate = null;
              }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_e: unknown) { // CORREÇÃO: Adicionado eslint-disable-next-line para _e
              lastMessageDate = null;
            }
          }

          if (lastMessageDate) {
            const lastSeenByClientISO = getLastSeenTimestampForCard(card.id);
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
    setUnreadStatuses(newUnreadStatuses);
  }, [user, userMatchedCards, cardChatsData, isLoadingCardChats, isChatModalOpen, selectedCardForChat, forceUpdateUnreadKey]);

  const handleCardClick = (card: MatchedCard) => { 
    const cardForModal: PlayingCardDataType = {
        id: card.id,
        text: card.text,
        category: card.category,
        intensity: card.intensity,
        isHot: card.isHot,
        isCompleted: card.isCompleted,
    };
    setSelectedCardForChat(cardForModal);
    setIsChatModalOpen(true);

    // Quando uma carta é clicada, ela não é mais considerada "recém-combinada"
    setNewlyMatchedCardIds(prevIds => {
      const updatedIds = prevIds.filter(id => id !== card.id);
      // Se todos os matches novos foram vistos, atualiza a flag global
      if (updatedIds.length === 0) {
        setHasUnseenGlobalMatches(false);
      }
      // ATUALIZA O LOCALSTORAGE para persistir que esta carta foi vista
      const currentVisitedIdsString = localStorage.getItem('kinklink_lastVisitedMatchIds');
      const currentVisitedIds: string[] = currentVisitedIdsString ? JSON.parse(currentVisitedIdsString) : [];
      if (!currentVisitedIds.includes(card.id)) {
        currentVisitedIds.push(card.id);
        localStorage.setItem('kinklink_lastVisitedMatchIds', JSON.stringify(currentVisitedIds));
      }
      return updatedIds;
    });
  };

  const handleChatSeen = useCallback(
    (_seenCardId: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
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

  if (isLoadingSkins || (!user || (isLoadingCardChats && !Object.keys(cardChatsData).length))) { 
    return <div className={styles.page}><p>Carregando seus links...</p></div>;
  }
  if (cardChatsError) {
    return <div className={styles.page}><p>Erro ao carregar dados dos chats: {cardChatsError}</p></div>;
  }

  // Filtragem das cartas
  const completedMatches = userMatchedCards.filter(card => card.isCompleted);
  const activeMatches = userMatchedCards.filter(card => !card.isCompleted);
  
  const hotMatches = activeMatches.filter(card => card.isHot);
  const otherMatches = activeMatches.filter(card => !card.isHot);
  
  const noActiveMatchesCondition = hotMatches.length === 0 && otherMatches.length === 0;


  const groupCardsByCategory = (cards: MatchedCard[]) => {
    return cards.reduce((acc, card) => {
      const category = card.category || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(card);
      return acc;
    }, {} as Record<string, MatchedCard[]>);
  };
  const otherCardsByCategory = groupCardsByCategory(otherMatches);

  // Define a ordem fixa e as únicas categorias a serem exibidas nos carrosséis
  const fixedCarouselOrder: string[] = ['Poder', 'Fantasia', 'Exposição', 'Sensorial'];


  // Função auxiliar para obter a classe CSS da categoria
  const getCarouselCellClasses = (categoryName: string, cardCount: number): string => {
    const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '');
    const categoryClass = styles[`carouselCell--${normalizedCategory}`] || styles['carouselCell--outros'] || '';

    let borderLevelClass = styles.borderLevel0; // 0-1 links
    if (cardCount >= 2 && cardCount <= 4) {
      borderLevelClass = styles.borderLevel1;
    } else if (cardCount >= 5 && cardCount <= 9) {
      borderLevelClass = styles.borderLevel2;
    } else if (cardCount >= 10 && cardCount <= 14) {
      borderLevelClass = styles.borderLevel3;
    } else if (cardCount >= 15) {
      borderLevelClass = styles.borderLevel4;
    }
    return `${categoryClass} ${borderLevelClass}`;
  };

  // Função auxiliar para obter as classes CSS do container de Top Links
  const getTopLinksContainerClasses = (cardCount: number): string => {
    let borderLevelClass = styles.topLinksBorderLevel0; // 0-1 links
    if (cardCount >= 2 && cardCount <= 4) {
      borderLevelClass = styles.topLinksBorderLevel1;
    } else if (cardCount >= 5 && cardCount <= 9) {
      borderLevelClass = styles.topLinksBorderLevel2;
    } else if (cardCount >= 10 && cardCount <= 14) {
      borderLevelClass = styles.topLinksBorderLevel3;
    } else if (cardCount >= 15) {
      borderLevelClass = styles.topLinksBorderLevel4;
    }
    return `${styles.topLinksContainerBase} ${borderLevelClass}`; // Adiciona a classe base e a de nível
  };

  return (
    <div className={styles.page}>
      <main className={styles.mainContent}>
        <div className={styles.pageHeaderControls}>
          <button onClick={handleMatchesButtonClick} className={`${styles.backToCardsButton} genericButton ${hasUnseenGlobalMatches ? styles.shakeAnimation : ''}`} aria-label="Voltar para as cartas">
            {hasUnseenGlobalMatches && <span className={styles.navNotificationDot}></span>}
            Cartas
          </button>
        </div>

      {noActiveMatchesCondition && completedMatches.length === 0 ? (
        <p className={styles.noMatchesText}>
          Você ainda não tem Links. Continue explorando as cartas!
        </p>
      ) : (
        <>
          {hotMatches.length > 0 && (
            <section className={styles.topLinksSection}>
              <h2 className={styles.sectionTitle}>🔥 Top Links</h2>
              <div className={getTopLinksContainerClasses(hotMatches.length)}>
                <div className={styles.matchesGrid}>
                  {hotMatches.map((card: MatchedCard) => (
                    <MatchCardItem
                      key={card.id}
                      card={card}
                      onClick={() => handleCardClick(card)}
                      isHot={true}
                      isUnread={unreadStatuses[card.id] || false}
                      isNewlyMatched={newlyMatchedCardIds.includes(card.id)}
                      onToggleHot={handleToggleHot}
                      lastMessageSnippet={unreadStatuses[card.id] ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                      isCompletedCard={false}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {otherMatches.length > 0 && (
            <section className={styles.section} style={hotMatches.length > 0 ? { marginTop: '40px' } : {}}>
              <h2 className={`${styles.sectionTitle} ${styles.sectionTitleOthers}`}>
                {hotMatches.length > 0 ? 'Outros Links' : 'Seus Links por Categoria'}
              </h2>
              <div className={styles.categoryCarouselsGrid}>
                {fixedCarouselOrder.map(categoryName => {
                  const cardsForCategory = otherCardsByCategory[categoryName];
                  if (cardsForCategory && cardsForCategory.length > 0) {
                    return (
                      <div key={categoryName} className={`${styles.carouselCell} ${getCarouselCellClasses(categoryName, cardsForCategory.length)}`}>
                        <CategoryCarousel
                          title={categoryName}
                          cards={cardsForCategory}
                          onCardClick={handleCardClick}
                          onToggleHot={handleToggleHot}
                          unreadStatuses={unreadStatuses}
                          newlyMatchedCardIds={newlyMatchedCardIds}
                          cardChatsData={cardChatsData}
                        />
                      </div>
                    );
                  }
                  return null;
                })}
                {Object.entries(otherCardsByCategory)
                  .filter(([categoryName]) => !fixedCarouselOrder.includes(categoryName))
                  .map(([categoryName, cardsForCategory]) => {
                    if (cardsForCategory && cardsForCategory.length > 0) {
                      return (
                        <div key={`other-${categoryName}`} className={`${styles.carouselCell} ${getCarouselCellClasses(categoryName, cardsForCategory.length)}`}>
                          <CategoryCarousel
                            title={categoryName}
                            cards={cardsForCategory}
                            onCardClick={handleCardClick}
                            onToggleHot={handleToggleHot}
                            unreadStatuses={unreadStatuses}
                            newlyMatchedCardIds={newlyMatchedCardIds}
                            cardChatsData={cardChatsData}
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
              </div>
            </section>
          )}

          <section className={styles.completedSection} ref={completedSectionRef}>
            <h2 className={styles.sectionTitleCompleted}>✅ Cartas Realizadas</h2>
            {completedMatches.length > 0 ? (
              <div className={styles.matchesGrid}>
                {completedMatches.map((card: MatchedCard) => (
                  <MatchCardItem
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(card)}
                    isHot={false}
                    isUnread={unreadStatuses[card.id] || false}
                    isNewlyMatched={newlyMatchedCardIds.includes(card.id)}
                    lastMessageSnippet={unreadStatuses[card.id] ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                    isCompletedCard={true}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.noMatchesText} style={{ marginTop: '20px', fontSize: '1em' }}>
                Nenhuma carta marcada como realizada ainda.
              </p>
            )}
          </section>
        </>
      )}
      </main>

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
          isHot={userMatchedCards.find(card => card.id === selectedCardForChat.id)?.isHot || false}
          onToggleHot={() => {
            if (selectedCardForChat?.id) {
              toggleHotStatus(selectedCardForChat.id);
            }
          }}
          isCompleted={userMatchedCards.find(card => card.id === selectedCardForChat.id)?.isCompleted || false}
          onToggleCompleted={() => {
            if (selectedCardForChat?.id) {
              const currentCard = userMatchedCards.find(card => card.id === selectedCardForChat.id);
              toggleCompletedStatus(selectedCardForChat.id, !currentCard?.isCompleted);
            }
          }}
          onRepeatCard={() => {
            if (selectedCardForChat?.id) {
              repeatCard(selectedCardForChat.id);
            }
          }}
        />
      )}
    </div>
  );
}

export default MatchesPage;
