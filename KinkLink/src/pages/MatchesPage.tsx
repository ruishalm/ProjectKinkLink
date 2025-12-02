// MatchesPage.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, type MatchedCard } from '../contexts/AuthContext';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import { useCoupleCardChats } from '../hooks/useCoupleCardChats';
import { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import { getLastSeenTimestampForCard } from '../utils/chatNotificationStore';
import CardChatModal from '../components/CardChatModal';
import CategoryCarousel from '../components/CategoryCarousel';
import { useSkin } from '../contexts/SkinContext';
import { db } from '../firebase';
import styles from './MatchesPage.module.css';
import {doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import MatchCardItem from '../components/MatchCardItem';


function MatchesPage() {
  // Hooks para obter dados globais e de contexto.
  const { user } = useAuth();
  const { matchedCards: userMatchedCards, toggleHotStatus } = useUserCardInteractions();
  const { isLoadingSkins } = useSkin();
  const { cardChatsData, isLoading: isLoadingCardChats, error: cardChatsError } = useCoupleCardChats(user?.coupleId);
  
  // Hooks de navegação e localização do React Router.
  const navigate = useNavigate();
  const location = useLocation();

  // Estados para controlar a UI, como a abertura de modais e referências de DOM.
  const [selectedCardForChat, setSelectedCardForChat] = useState<PlayingCardDataType | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const completedSectionRef = useRef<HTMLDivElement>(null);
  const [hasUnseenGlobalMatches, setHasUnseenGlobalMatches] = useState(false); // Controla a notificação no botão "Cartas".

  // Efeito para abrir o modal de chat diretamente se a URL contiver um hash
  // (ex: /matches#card-CARD_ID), vindo de uma notificação.
  useEffect(() => {
    if (location.hash && location.hash.startsWith('#card-')) {
      const cardIdFromHash = location.hash.substring('#card-'.length);
      if (cardIdFromHash && userMatchedCards) {
        const cardToOpen = userMatchedCards.find(card => card.id === cardIdFromHash);
        if (cardToOpen) {
          // Usa um timeout para garantir que a UI tenha tempo de renderizar antes de abrir o modal.
          setTimeout(() => {
            handleCardClick(cardToOpen);
          }, 100);
        } else {
          console.warn(`[MatchesPage] Card com ID ${cardIdFromHash} do hash não encontrado nos matches.`);
        }
      }
    }
  }, [location.hash, userMatchedCards]);

  // Determina o estado de notificação (novo match ou nova mensagem) para uma carta.
  const getCardNotificationStatus = (card: MatchedCard) => {
    const lastVisited = user?.lastVisitedMatchesPage?.toDate();
    const matchCreatedAt = card.createdAt?.toDate();
    const chatLastMessageTimestamp = cardChatsData[card.id]?.lastMessageTimestamp?.toDate();
    const lastSeenByClientISO = getLastSeenTimestampForCard(card.id);

    let isNewMatch = false;
    if (lastVisited && matchCreatedAt && matchCreatedAt > lastVisited && (!lastSeenByClientISO || new Date(lastSeenByClientISO) < matchCreatedAt)) {
      isNewMatch = true;
    }

    let hasNewMessage = false;
    if (chatLastMessageTimestamp && (!lastSeenByClientISO || new Date(lastSeenByClientISO) < chatLastMessageTimestamp)) {
      if (cardChatsData[card.id]?.lastMessageSenderId !== user?.id) {
        hasNewMessage = true;
      }
    }

    return { isNewMatch, hasNewMessage };
  };

  // Efeito para verificar se existe qualquer match ou mensagem nova para exibir
  // o indicador de notificação no botão "Cartas".
  useEffect(() => {
    const anyNew = userMatchedCards.some(card => {
      const { isNewMatch, hasNewMessage } = getCardNotificationStatus(card);
      return isNewMatch || hasNewMessage;
    });
    setHasUnseenGlobalMatches(anyNew);

    // Ao sair da página, atualiza o timestamp da última visita.
    // Isso marca todas as notificações atuais como "vistas" na próxima vez que a página for carregada.
    return () => {
      if (user?.id) {
        const userDocRef = doc(db, 'users', user.id);
        updateDoc(userDocRef, {
          lastVisitedMatchesPage: serverTimestamp()
        }).catch(console.error);
      }
    };
  }, [user?.id, userMatchedCards, cardChatsData]);
  
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
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsChatModalOpen(false);
    setSelectedCardForChat(null);

    // Limpa o hash da URL para não reabrir o modal ao recarregar a página.
    if (location.hash.startsWith('#card-')) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.hash, location.pathname, navigate]);

  const handleToggleHotInCarousel = useCallback((cardId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    toggleHotStatus(cardId);
  }, [toggleHotStatus]);


  // Otimiza a performance ao memoizar a filtragem e agrupamento das cartas.
  // Evita recalcular essas listas a cada renderização, a menos que os matches do usuário mudem.
  const { completedMatches, hotMatches, otherMatches, categorizedMatches, noActiveMatchesCondition } = useMemo(() => {
    const fixedCarouselOrder: string[] = ['Poder', 'Fantasia', 'Exposição', 'Sensorial'];

    const completed = userMatchedCards.filter(card => card.isCompleted);
    const active = userMatchedCards.filter(card => !card.isCompleted);
    const hot = active.filter(card => card.isHot);
    const others = active.filter(card => !card.isHot);

    const groupedByCategory = others.reduce((acc, card) => {
      const category = card.category || 'Outros';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(card);
      return acc;
    }, {} as Record<string, MatchedCard[]>);

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

  // Função auxiliar para aplicar classes de borda com base na contagem de cartas.
  const getCarouselCellClasses = (categoryName: string, cardCount: number): string => {
    const normalizedCategory = categoryName.toLowerCase().replace(/\s+/g, '');
    const categoryClass = styles[`carouselCell--${normalizedCategory}`] || styles['carouselCell--outros'] || '';

    let borderLevelClass = styles.borderLevel0; // 0-1
    if (cardCount >= 2 && cardCount <= 4) borderLevelClass = styles.borderLevel1;
    else if (cardCount >= 5 && cardCount <= 9) borderLevelClass = styles.borderLevel2;
    else if (cardCount >= 10 && cardCount <= 14) borderLevelClass = styles.borderLevel3;
    else if (cardCount >= 15) borderLevelClass = styles.borderLevel4;
    
    return `${categoryClass} ${borderLevelClass}`;
  };

  // Função auxiliar para aplicar classes de borda ao container de "Top Links".
  const getTopLinksContainerClasses = (cardCount: number): string => {
    let borderLevelClass = styles.topLinksBorderLevel0; // 0-1
    if (cardCount >= 2 && cardCount <= 4) borderLevelClass = styles.topLinksBorderLevel1;
    else if (cardCount >= 5 && cardCount <= 9) borderLevelClass = styles.topLinksBorderLevel2;
    else if (cardCount >= 10 && cardCount <= 14) borderLevelClass = styles.topLinksBorderLevel3;
    else if (cardCount >= 15) borderLevelClass = styles.topLinksBorderLevel4;

    return `${styles.topLinksContainerBase} ${borderLevelClass}`;
  };

  return (
    <div className={styles.page}>
      <main className={styles.mainContent}>
        {/* Cabeçalho da página com botão para voltar à pilha de cartas. */}
        <div className={styles.pageHeaderControls}>
          <Link to="/cards" className={`${styles.backToCardsButton} genericButton ${hasUnseenGlobalMatches ? styles.shakeAnimation : ''}`} aria-label="Voltar para as cartas">
            {hasUnseenGlobalMatches && <span className={styles.navNotificationDot}></span>}
            Cartas
          </Link>
        </div>

      {/* Renderização condicional: mostra uma mensagem se não houver nenhum match. */}
      {noActiveMatchesCondition && completedMatches.length === 0 ? (
        <p className={styles.noMatchesText}>
          Você ainda não tem Links. Continue explorando as cartas!
        </p>
      ) : (
        <>
          {/* Seção "Top Links" para as cartas marcadas como "Hot". */}
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
                      isNewMatch={getCardNotificationStatus(card).isNewMatch}
                      hasNewMessage={getCardNotificationStatus(card).hasNewMessage}
                      lastMessageSnippet={getCardNotificationStatus(card).hasNewMessage ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                      onToggleHot={handleToggleHotInCarousel}
                      isCompletedCard={false}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Seção para os outros links, agrupados por categoria em carrosséis. */}
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
                            userLastVisitedMatchesPage={user?.lastVisitedMatchesPage}
                          />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </section>
          )}

          {/* Seção para as cartas que já foram marcadas como "Realizadas". */}
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
                    isNewMatch={false}
                    hasNewMessage={false}
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

      {/* Modal de Chat: abre quando o usuário clica em uma carta. */}
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
