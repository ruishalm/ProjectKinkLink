// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\MatchesPage.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type MatchedCard } from '../contexts/AuthContext';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import { useCoupleCardChats } from '../hooks/useCoupleCardChats';
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CardChatModal from '../components/CardChatModal';
import CategoryCarousel from '../components/CategoryCarousel';
import { getLastSeenTimestampForCard, markChatAsSeen } from '../utils/chatNotificationStore';
import { useSkin } from '../contexts/SkinContext';
import styles from './MatchesPage.module.css';
import { Timestamp } from 'firebase/firestore';


interface MatchCardItemProps {
  card: PlayingCardDataType;
  onClick: () => void;
  isHot: boolean;
  isUnread: boolean;
  onToggleHot?: (cardId: string, event: React.MouseEvent) => void;
  lastMessageSnippet?: string;
  isCompletedCard?: boolean; // Nova prop para indicar se é uma carta da seção "Realizadas"
}

function MatchCardItem({ card, onClick, isHot, isUnread, onToggleHot, lastMessageSnippet, isCompletedCard }: MatchCardItemProps) {
  const scaleFactor = isHot && !isCompletedCard ? 0.55 : 0.5; // Não aplica scale maior se for completada
  const cardWidth = 250 * scaleFactor;
  const cardHeight = 350 * scaleFactor;
  return (
    <div
      className={`${styles.cardItemWrapper} ${isUnread ? styles.unreadMatch : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = ''} // Remove o scale(1) para deixar o CSS controlar
      role="button"
      tabIndex={0}
      aria-label={`Link: ${card.text.substring(0,30)}... ${isUnread ? ' (Não lido)' : ''}`}
    >
      {isUnread && <div className={styles.unreadIndicator}></div>}
      <PlayingCard
        data={card}
        targetWidth={cardWidth}
        targetHeight={cardHeight}
        isFlipped={false}
        onToggleHot={!isCompletedCard ? onToggleHot : undefined} // Não passa onToggleHot se for carta completada
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
  const { matchedCards: userMatchedCards, toggleHotStatus, toggleCompletedStatus, repeatCard } = useUserCardInteractions(); // Adicionar toggleCompletedStatus e repeatCard
  const navigate = useNavigate();
  const { isLoadingSkins } = useSkin(); // activeSkins não é mais usado diretamente aqui para o fundo
  const { cardChatsData, isLoading: isLoadingCardChats, error: cardChatsError } = useCoupleCardChats(user?.coupleId);

  const [selectedCardForChat, setSelectedCardForChat] = useState<PlayingCardDataType | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [unreadStatuses, setUnreadStatuses] = useState<{ [key: string]: boolean }>({});
  const [forceUpdateUnreadKey, setForceUpdateUnreadKey] = useState(0);
  const [hasUnseenGlobalMatches, setHasUnseenGlobalMatches] = useState(false);
  const completedSectionRef = useRef<HTMLDivElement>(null); // Ref para a seção de cartas realizadas

  const isFirestoreTimestamp = (value: unknown): value is Timestamp => {
    return !!value && typeof (value as Timestamp).toDate === 'function' && typeof (value as Timestamp).seconds === 'number' && typeof (value as Timestamp).nanoseconds === 'number';
  };

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
            } catch (_e: unknown) { 
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
        isCompleted: card.isCompleted, // Passa o status de completada
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
  const fixedCarouselOrder: string[] = ['Poder', 'Fantasia', 'Exposição', 'Sensorial']; // Ordem corrigida


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
      <main className={styles.mainContent}> {/* Conteúdo principal da página */}
        <div className={styles.pageHeaderControls}> {/* Novo container para título e botão */}
          {/* Botão existente para voltar às cartas */}
          <button onClick={handleMatchesButtonClick} className={`${styles.backToCardsButton} genericButton ${hasUnseenGlobalMatches ? styles.shakeAnimation : ''}`} aria-label="Voltar para as cartas">
            {hasUnseenGlobalMatches && <span className={styles.navNotificationDot}></span>}
            Cartas
          </button>
        </div>

        {/* O restante do conteúdo da página continua aqui dentro do main */}
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
                      onToggleHot={handleToggleHot}
                      lastMessageSnippet={unreadStatuses[card.id] ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                      isCompletedCard={false} // Não é uma carta completada
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
                  const cardsForCategory = otherCardsByCategory[categoryName]; // Busca as cartas para a categoria da ordem fixa
                  if (cardsForCategory && cardsForCategory.length > 0) {
                    return (
                      <div key={categoryName} className={`${styles.carouselCell} ${getCarouselCellClasses(categoryName, cardsForCategory.length)}`}>
                        <CategoryCarousel
                          title={categoryName}
                          cards={cardsForCategory}
                          onCardClick={handleCardClick}
                          onToggleHot={handleToggleHot}
                          unreadStatuses={unreadStatuses}
                          cardChatsData={cardChatsData}
                          // isCompletedCard para MatchCardItem dentro do Carousel será false por padrão
                        />
                      </div>
                    );
                  }
                  return null;
                })}
                {/* Loop para renderizar outras categorias que não estão na fixedCarouselOrder */}
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
                            cardChatsData={cardChatsData}
                            // isCompletedCard para MatchCardItem dentro do Carousel será false por padrão
                          />
                        </div>
                      );
                    }
                    return null;
                  })}
              </div>
            </section>
          )}

          {/* Seção de Cartas Realizadas */}
          <section className={styles.completedSection} ref={completedSectionRef}>
            <h2 className={styles.sectionTitleCompleted}>✅ Cartas Realizadas</h2>
            {completedMatches.length > 0 ? (
              <div className={styles.matchesGrid}>
                {completedMatches.map((card: MatchedCard) => (
                  <MatchCardItem
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(card)}
                    isHot={false} // Cartas completadas não são "hot" visualmente aqui
                    isUnread={unreadStatuses[card.id] || false} // Pode ainda ter mensagens não lidas
                    // onToggleHot não é passado, ou é passado como undefined
                    lastMessageSnippet={unreadStatuses[card.id] ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                    isCompletedCard={true} // Indica que é uma carta completada
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
          // Adiciona o status de 'hot' da carta selecionada
          isHot={userMatchedCards.find(card => card.id === selectedCardForChat.id)?.isHot || false}
          // Adiciona a função para alternar o status de 'hot'
          onToggleHot={() => {
            if (selectedCardForChat?.id) {
              toggleHotStatus(selectedCardForChat.id);
            }
          }}
          // Adiciona o status de 'completed' da carta selecionada
          isCompleted={userMatchedCards.find(card => card.id === selectedCardForChat.id)?.isCompleted || false}
          // Adiciona a função para alternar o status de 'completed'
          onToggleCompleted={() => {
            if (selectedCardForChat?.id) {
              // A função toggleCompletedStatus espera o novo estado 'completed'
              // Então, se está completada, passamos false para desmarcar, e vice-versa.
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
