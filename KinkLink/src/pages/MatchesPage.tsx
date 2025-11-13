// MatchesPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, type MatchedCard } from '../contexts/AuthContext';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import { useCoupleCardChats } from '../hooks/useCoupleCardChats';
// Importa apenas o tipo CardData, pois o componente PlayingCard não é usado diretamente aqui.
import { type CardData as PlayingCardDataType } from '../components/PlayingCard'; // Mantido para o modal
import CardChatModal from '../components/CardChatModal'; // Mantido para o modal
import CategoryCarousel from '../components/CategoryCarousel';
import { useSkin } from '../contexts/SkinContext';
import { db } from '../firebase'; // <<< ADICIONADO
import styles from './MatchesPage.module.css';
import { Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
  const completedSectionRef = useRef<HTMLDivElement>(null);
  const [hasUnseenGlobalMatches, setHasUnseenGlobalMatches] = useState(false); // Para o botão "Cartas"

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

  // Passo 2: Atualiza o timestamp da última visita à página de matches
  useEffect(() => {
    if (user?.id) {
      // Usamos um pequeno delay para garantir que o onSnapshot do AuthContext
      // tenha tempo de pegar o user.lastVisitedMatchesPage antes de atualizarmos.
      // Isso é uma otimização para evitar que a data de visita seja atualizada
      // antes que a lógica de "novo" tenha a chance de usar a data antiga.
      const timer = setTimeout(() => {
        const userDocRef = doc(db, 'users', user.id);
        updateDoc(userDocRef, {
          lastVisitedMatchesPage: serverTimestamp()
        }).catch(error => {
          console.error("Erro ao atualizar o timestamp de 'lastVisitedMatchesPage':", error);
        });
      }, 500); // 500ms de delay

      return () => clearTimeout(timer); // Limpa o timer se o componente desmontar
    }
  }, [user?.id, db]);

  // Lógica para determinar se há novos matches ou novas mensagens
  const getCardNotificationStatus = (card: MatchedCard) => {
    const lastVisited = user?.lastVisitedMatchesPage?.toDate();
    const matchCreatedAt = card.createdAt?.toDate();
    const chatLastMessageTimestamp = cardChatsData[card.id]?.lastMessageTimestamp?.toDate();

    let isNewMatch = false;
    let hasNewMessage = false;

    if (lastVisited) {
      // Um match é novo se foi criado DEPOIS da última visita
      if (matchCreatedAt && matchCreatedAt > lastVisited) {
        isNewMatch = true;
      }
      // Uma mensagem é nova se a última mensagem foi enviada DEPOIS da última visita
      if (chatLastMessageTimestamp && chatLastMessageTimestamp > lastVisited) {
        // E se a última mensagem não foi enviada pelo próprio usuário
        if (cardChatsData[card.id]?.lastMessageSenderId !== user?.id) {
          hasNewMessage = true;
        }
      }
    }
    return { isNewMatch, hasNewMessage };
  };

  // Efeito para atualizar a flag global de "não visto" para o botão "Cartas"
  useEffect(() => {
    const anyNew = userMatchedCards.some(card => {
      const { isNewMatch, hasNewMessage } = getCardNotificationStatus(card);
      return isNewMatch || hasNewMessage;
    });
    setHasUnseenGlobalMatches(anyNew);
  }, [user?.id]);


  const isFirestoreTimestamp = (value: unknown): value is Timestamp => {
    return !!value && typeof (value as Timestamp).toDate === 'function' && typeof (value as Timestamp).seconds === 'number' && typeof (value as Timestamp).nanoseconds === 'number';
  };

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
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedCardForChat(null);

    // Se a URL ainda tiver o hash da carta, limpa-o para evitar reabertura ao navegar.
    if (location.hash.startsWith('#card-')) {
      navigate(location.pathname, { replace: true });
    }
  };

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
          <Link to="/cards" className={`${styles.backToCardsButton} genericButton ${hasUnseenGlobalMatches ? styles.shakeAnimation : ''}`} aria-label="Voltar para as cartas">
            {hasUnseenGlobalMatches && <span className={styles.navNotificationDot}></span>}
            Cartas
          </Link>
        </div>

      {noActiveMatchesCondition && completedMatches.length === 0 ? (
        // Se não há matches ativos e nem completados
        // (ou seja, o usuário não tem nenhum link ainda)
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
                    <MatchCardItem // <<< AQUI
                      key={card.id}
                      card={card}
                      onClick={() => handleCardClick(card)}
                      isHot={true}
                      isNewMatch={getCardNotificationStatus(card).isNewMatch}
                      hasNewMessage={getCardNotificationStatus(card).hasNewMessage}
                      lastMessageSnippet={getCardNotificationStatus(card).hasNewMessage ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                      onToggleHot={handleToggleHot}
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
                        <CategoryCarousel // <<< AQUI
                          title={categoryName}
                          cards={cardsForCategory}
                          onCardClick={handleCardClick}
                          cardChatsData={cardChatsData} // Passa para o carrossel
                          userLastVisitedMatchesPage={user?.lastVisitedMatchesPage} // Passa para o carrossel
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
                          <CategoryCarousel // <<< AQUI
                            title={categoryName}
                            cards={cardsForCategory}
                            onCardClick={handleCardClick}
                            cardChatsData={cardChatsData} // Passa para o carrossel
                            userLastVisitedMatchesPage={user?.lastVisitedMatchesPage} // Passa para o carrossel
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
                    card={card} // <<< AQUI
                    onClick={() => handleCardClick(card)}
                    isHot={false}
                    isNewMatch={false} // Cartas completadas não são "novas"
                    hasNewMessage={false} // Chats de cartas completadas não mostram "nova mensagem"
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
          onClose={handleCloseChat}
          cardId={selectedCardForChat.id}
          cardTitle={selectedCardForChat.text} 
          currentChatLastMessageTimestamp={
            cardChatsData?.[selectedCardForChat.id]?.lastMessageTimestamp &&
            isFirestoreTimestamp(cardChatsData[selectedCardForChat.id].lastMessageTimestamp)
              ? cardChatsData[selectedCardForChat.id].lastMessageTimestamp
              : null
          } 
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
