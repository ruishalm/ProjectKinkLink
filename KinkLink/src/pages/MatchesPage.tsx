// MatchesPage.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, type MatchedCard } from '../contexts/AuthContext';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import { useCoupleCardChats } from '../hooks/useCoupleCardChats';
import { useCardNotificationStatus } from '../hooks/useCardNotificationStatus'; // <<< NOVO HOOK
// Importa apenas o tipo CardData, pois o componente PlayingCard não é usado diretamente aqui.
import { type CardData as PlayingCardDataType } from '../components/PlayingCard'; // Mantido para o modal
import CardChatModal from '../components/CardChatModal'; // Mantido para o modal
import CategoryCarousel from '../components/CategoryCarousel';
import { useSkin } from '../contexts/SkinContext';
import { db } from '../firebase'; // <<< ADICIONADO
import styles from './MatchesPage.module.css';
import {doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// MatchCardItem é importado e usado, mas sua interface MatchCardItemProps não precisa ser importada separadamente aqui.
// A interface MatchCardItemProps é exportada pelo MatchCardItem.tsx e usada lá.
import MatchCardItem from '../components/MatchCardItem';


function MatchesPage() {
  const { user } = useAuth();
  const { matchedCards: userMatchedCards, toggleHotStatus } = useUserCardInteractions();
  const navigate = useNavigate();
  const { isLoadingSkins } = useSkin();
  const location = useLocation();
  const { cardChatsData, isLoading: isLoadingCardChats, error: cardChatsError } = useCoupleCardChats(user?.coupleId);
  
  // Hook customizado para verificar status de notificação das cartas
  const { getCardNotificationStatus } = useCardNotificationStatus(user, cardChatsData);

  // O tipo PlayingCardDataType é usado apenas para selectedCardForChat, que é passado para CardChatModal.
  const [selectedCardForChat, setSelectedCardForChat] = useState<PlayingCardDataType | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const completedSectionRef = useRef<HTMLDivElement>(null);
  const [hasUnseenGlobalMatches, setHasUnseenGlobalMatches] = useState(false); // Para o botão "Cartas"

  // Efeito para atualizar a flag global de "não visto" para o botão "Cartas"
  useEffect(() => {
    const anyNew = userMatchedCards.some(card => {
      const { isNewMatch, hasNewMessage } = getCardNotificationStatus(card);
      return isNewMatch || hasNewMessage;
    });
    setHasUnseenGlobalMatches(anyNew);
  }, [userMatchedCards, getCardNotificationStatus]);
  
  // Callback para abrir uma carta (usado no useEffect e nos handlers)
  const handleCardClick = useCallback((card: MatchedCard) => { 
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
  }, []); // A dependência vazia garante que a função seja criada apenas uma vez

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
  }, [location.hash, userMatchedCards, handleCardClick]);

  // Atualiza lastVisitedMatchesPage quando o componente é montado (entra na página)
  // Não no cleanup para evitar erro de permissão no Strict Mode
  useEffect(() => {
    if (user?.id) {
      const userDocRef = doc(db, 'users', user.id);
      updateDoc(userDocRef, {
        lastVisitedMatchesPage: serverTimestamp()
      }).catch(err => {
        console.error('[MatchesPage] Erro ao atualizar lastVisitedMatchesPage:', err);
      });
    }
  }, [user?.id]); // Roda apenas quando user.id muda (mount/login)

  const handleCloseChat = useCallback(() => {
    setIsChatModalOpen(false);
    setSelectedCardForChat(null);

    // Se a URL ainda tiver o hash da carta, limpa-o para evitar reabertura ao navegar.
    if (location.hash.startsWith('#card-')) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.hash, location.pathname, navigate]);

  // Callback para os carrosséis, que precisam do ID e do evento
  const handleToggleHotInCarousel = useCallback((cardId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    toggleHotStatus(cardId);
  }, [toggleHotStatus]);


  // Otimização: Memoiza a filtragem e agrupamento das cartas.
  // Isso evita que as listas sejam recalculadas em cada renderização.
  const { completedMatches, hotMatches, otherMatches, categorizedMatches, noActiveMatchesCondition } = useMemo(() => {
    const fixedCarouselOrder: string[] = ['Poder', 'Fantasia', 'Exposição', 'Sensorial'];

    const completed = userMatchedCards.filter(card => card.isCompleted);
    const active = userMatchedCards.filter(card => !card.isCompleted);
    const hot = active.filter(card => card.isHot);
    const others = active.filter(card => !card.isHot);

    // Agrupa as cartas "outras" por categoria
    const groupedByCategory = others.reduce((acc, card) => {
      const category = card.category || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(card);
      return acc;
    }, {} as Record<string, MatchedCard[]>);

    // Ordena as categorias: primeiro as da ordem fixa, depois as restantes.
    const sortedCategories = [...fixedCarouselOrder.filter(cat => groupedByCategory[cat]), ...Object.keys(groupedByCategory).filter(cat => !fixedCarouselOrder.includes(cat))];
    const categorized = sortedCategories.map(categoryName => ({ categoryName, cards: groupedByCategory[categoryName] }));

    const noActive = hot.length === 0 && others.length === 0;
    return { completedMatches: completed, hotMatches: hot, otherMatches: others, categorizedMatches: categorized, noActiveMatchesCondition: noActive };
  }, [userMatchedCards]);

  if (isLoadingSkins || (!user || (isLoadingCardChats && !Object.keys(cardChatsData).length))) { 
    return <div className={styles.page}><p>Carregando seus links...</p></div>;
  }
  if (cardChatsError) {
    return <div className={styles.page}><p>Erro ao carregar dados dos chats: {cardChatsError}</p></div>;
  }


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
                    <div key={card.id} className={styles.gridCellContent}>
                      <MatchCardItem
                        card={card}
                        onClick={() => handleCardClick(card)}
                        isHot={true}
                        isNewMatch={getCardNotificationStatus(card).isNewMatch}
                        hasNewMessage={getCardNotificationStatus(card).hasNewMessage}
                        lastMessageSnippet={getCardNotificationStatus(card).hasNewMessage ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                        onToggleHot={handleToggleHotInCarousel} // Usa a função correta para o carrossel
                        isCompletedCard={false}
                      />
                    </div>
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
                {categorizedMatches.map(({ categoryName, cards }) => {
                  if (cards && cards.length > 0) {
                    return (
                      <div key={categoryName} className={`${styles.carouselCell} ${getCarouselCellClasses(categoryName, cards.length)}`}>
                        <CategoryCarousel
                            title={categoryName}
                            cards={cards}
                            onCardClick={handleCardClick}
                            onToggleHot={handleToggleHotInCarousel}
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
                  <div key={card.id} className={styles.gridCellContent}>
                    <MatchCardItem
                      card={card}
                      onClick={() => handleCardClick(card)}
                      isCompletedCard={true}
                      // Não passa isHot, isNewMatch ou hasNewMessage - cartas completadas não exibem esses badges
                    />
                  </div>
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
        />
      )}
    </div>
  );
}

export default MatchesPage;
