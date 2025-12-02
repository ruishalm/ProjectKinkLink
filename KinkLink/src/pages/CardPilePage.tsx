// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\CardPilePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import MatchModal from '../components/MatchModal';
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CreateUserCardModal from '../components/CreateUserCardModal';
import toast from 'react-hot-toast';
import PeekInvitation from '../components/PeekInvitation/PeekInvitation';
import ConexaoCardModal from '../components/ConexaoCardModal';
import { useCardPileLogic } from '../hooks/useCardPileLogic';
import CarinhosMimosModal from '../components/CarinhosMimosModal';
import CardBack from '../components/CardBack';
import type { Card } from '../data/cards';
import { useSkin } from '../contexts/SkinContext';
import { useCardTips } from '../hooks/useCardTips';
import { db } from '../firebase';
import { useCardPileModals } from '../hooks/useCardPileModals';
import SideTipMessages from '../components/SideTipMessages';
import styles from './CardPilePage.module.css';

function CardPilePage() {
  // Hook principal para a lógica da pilha de cartas (qual carta mostrar, interações, etc.).
  const {
    currentCard,
    handleInteraction,
    showMatchModal,
    currentMatchCard,
    setShowMatchModal,
    unseenCardsCount,
    showConexaoModal,
    currentConexaoCardForModal,
    handleConexaoInteractionInModal,
    allConexaoCards,
    undoLastDislike,
    canUndoDislike,
    cardToPeek,
    acceptPeek,
    rejectPeek,
  } = useCardPileLogic();
  
  // Hooks para obter dados de autenticação, interações do usuário e skins.
  const { isLoadingSkins } = useSkin(); 
  const { user } = useAuth();
  const { matchedCards, seenCards, handleCreateUserCard, toggleHotStatus } = useUserCardInteractions();
  const navigate = useNavigate();

  // Estados para controlar a UI da carta (animação de saída, flip, arrasto).
  const [exitingCard, setExitingCard] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [dragVisuals, setDragVisuals] = useState({ x: 0, active: false, dir: 0 });
  const [cardDimensions, setCardDimensions] = useState({ width: 250, height: 350 }); 

  // Hook para gerenciar as dicas laterais que aparecem ao arrastar a carta.
  const { activeLeftTip, activeRightTip, animateTipsIn } = useCardTips(currentCard);

  // Hook para gerenciar a abertura e fechamento dos modais da página.
  const {
    showCreateUserCardModal,
    openCreateUserCardModal,
    closeCreateUserCardModal,
    showCarinhosMimosModal,
    openCarinhosMimosModal,
    closeCarinhosMimosModal,
  } = useCardPileModals();

  const seenConexaoCardsForModal = useMemo(() => {
    return (allConexaoCards || []).filter(card => seenCards.includes(card.id));
  }, [allConexaoCards, seenCards]);

  // Memoiza a transformação da carta atual para o formato esperado pelo componente PlayingCard.
  const cardForDisplay: PlayingCardDataType | null = useMemo(() => {
    if (!currentCard) return null;
    return {
        id: currentCard.id,
        text: currentCard.text,
        category: currentCard.category,
        intensity: currentCard.intensity,
        creatorId: (currentCard as Card & { createdBy?: string }).createdBy,
        isCreatorSuggestion: currentCard.isCreatorSuggestion,
      isHot: matchedCards.find(mc => mc.id === currentCard.id)?.isHot || false,
    };
  }, [currentCard, matchedCards]);

  // Efeito para calcular e atualizar as dimensões da carta responsivamente.
  useEffect(() => {
    const calculateCardDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const aspectRatio = 350 / 250;

      let newCardWidth = screenWidth * 0.8;
      if (screenWidth > 600) {
        newCardWidth = screenWidth * 0.5;
      }
      newCardWidth = Math.max(220, Math.min(newCardWidth, 320));
      let newCardHeight = newCardWidth * aspectRatio;
      const availableHeightForCard = screenHeight * 0.9 - 180;

      if (newCardHeight > availableHeightForCard) {
        newCardHeight = availableHeightForCard;
        newCardWidth = newCardHeight / aspectRatio;
      }
      newCardWidth = Math.max(220, newCardWidth);
      newCardHeight = newCardWidth * aspectRatio;

      setCardDimensions({ width: Math.round(newCardWidth), height: Math.round(newCardHeight) });
    };
    calculateCardDimensions();
    window.addEventListener('resize', calculateCardDimensions);
    return () => window.removeEventListener('resize', calculateCardDimensions);
  }, []);

  // Efeito para controlar a animação de "flip" da carta ao ser exibida.
  useEffect(() => {
    if (cardForDisplay && !exitingCard && isCardFlipped) {
      const timer = setTimeout(() => {
        setIsCardFlipped(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [cardForDisplay, exitingCard, isCardFlipped]);

  // Garante que a animação de "flip" seja reativada quando uma nova carta
  // é exibida (ex: após usar a função "Oops!").
  useEffect(() => {
    if (currentCard && !exitingCard) {
      setIsCardFlipped(true);
    }
  }, [currentCard?.id, exitingCard]);

  // Efeito para ouvir em tempo real os "likes" do parceiro e notificar o usuário com um toast.
  useEffect(() => {
    if (!user?.coupleId || !user.partnerId) {
      return;
    }

    const interactionsRef = collection(db, `couples/${user.coupleId}/likedInteractions`);
    // Ouve apenas por interações que acontecem a partir de agora.
    const q = query(interactionsRef, where('createdAt', '>', Timestamp.now()));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Notifica apenas se o primeiro "like" na interação foi do parceiro.
          if (data.likedByUIDs && data.likedByUIDs[0] === user.partnerId) {
            const cardText = data.cardData?.text || 'uma carta';
            const truncatedText = cardText.length > 40 ? `${cardText.substring(0, 37)}...` : cardText;

            toast.success(
              (t) => (
                <div onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer' }}>
                  <b>Seu par topou uma carta! 👀</b>
                  <p style={{ margin: '4px 0 0' }}>A carta '{truncatedText}' foi curtida.</p>
                </div>
              ), { duration: 6000 }
            );
          }
        }
      });
    });

    return () => unsubscribe();

  }, [user?.coupleId, user?.partnerId]);

  const triggerHapticFeedback = (pattern: number | number[] = 30) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Haptic feedback failed:", e);
      }
    }
  };

  const bindCardDrag = useDrag(({ active, movement: [mx], direction: [dx], velocity: [vx] }) => {
    if (active) {
      setDragVisuals({ x: mx, active: true, dir: dx });
    } else {
      setDragVisuals({ x: 0, active: false, dir: 0 });
      if (cardForDisplay && !exitingCard) {
        const SWIPE_CONFIRM_DISTANCE_THRESHOLD = cardDimensions.width * 0.35;
        const SWIPE_VELOCITY_THRESHOLD = 0.3;
        if (Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD || Math.abs(mx) > SWIPE_CONFIRM_DISTANCE_THRESHOLD) {
          if (dx > 0) {
            triggerHapticFeedback();
            // setAnimateTipsIn(false); // Removido: useCardTips gerencia isso
            setExitingCard({ id: cardForDisplay.id, direction: 'right' });
          } else if (dx < 0) {
            triggerHapticFeedback();
            // setAnimateTipsIn(false); // Removido: useCardTips gerencia isso
            setExitingCard({ id: cardForDisplay.id, direction: 'left' });
          }
        }
      }
    }
  });

  // Determina se os botões de ação da carta devem ser desabilitados
  const areActionButtonsDisabled = !!exitingCard || isCardFlipped;

  const handleAcceptPeek = () => {
    acceptPeek();
    toast("Considere realinhar seu filtro: com consentimento e parceria vários mundos podem ser alcançados!", {
      icon: '🤫',
    });
  };

  if (isLoadingSkins) {
    return <div className={styles.page}><p>Carregando skins...</p></div>;
  }

  return (
    <div className={styles.page}>
      {/* Seção de Modais: Renderizados condicionalmente sobre a página. */}
      {showMatchModal && currentMatchCard && (
        <MatchModal
          card={currentMatchCard}
          onClose={() => setShowMatchModal(false)}
        />
      )}

      {cardToPeek && (
        <PeekInvitation
          onAccept={handleAcceptPeek}
          onReject={rejectPeek}
        />
      )}

      {showConexaoModal && currentConexaoCardForModal && (
        <ConexaoCardModal
          isOpen={showConexaoModal}
          card={currentConexaoCardForModal}
          onAccept={() => handleConexaoInteractionInModal(true)}
          onReject={() => handleConexaoInteractionInModal(false)}
          onClose={() => handleConexaoInteractionInModal(false)}
        />
      )}

      {showCreateUserCardModal && (
        <CreateUserCardModal
          isOpen={showCreateUserCardModal}
          onClose={closeCreateUserCardModal}
          onSubmit={(category: Card['category'], text: string, intensity: number, notifyAsCreator: boolean) => {
            if (handleCreateUserCard) {
                 handleCreateUserCard(category, text, intensity, notifyAsCreator);
            }
            closeCreateUserCardModal();
          }}
        />
      )}

      {showCarinhosMimosModal && (
        <CarinhosMimosModal
          isOpen={showCarinhosMimosModal}
          onClose={closeCarinhosMimosModal}
          conexaoCards={seenConexaoCardsForModal}
        />
      )}

      {/* Área de Conteúdo Principal */}
      <div className={styles.contentArea}>
        {cardForDisplay ? (
          <>
            {/* Pilha de Cartas e Dicas Laterais */}
            <div className={styles.cardStackContainer}>
               <SideTipMessages
                leftMessage={activeLeftTip}
                rightMessage={activeRightTip}
                animateIn={animateTipsIn}
                cardWidth={cardDimensions.width}
              />
              {cardForDisplay && (
                <div className={styles.staticCardBack}>
                  <CardBack
                    targetWidth={cardDimensions.width}
                    targetHeight={cardDimensions.height}
                  />
                </div>
              )}
              <div {...bindCardDrag()} className={styles.playingCardWrapper}>
                <PlayingCard
                    key={cardForDisplay.id}
                    data={cardForDisplay}
                    targetWidth={cardDimensions.width}
                    targetHeight={cardDimensions.height}
                    dragVisuals={dragVisuals}
                    isFlipped={exitingCard && exitingCard.id === cardForDisplay.id ? false : isCardFlipped}
                    currentUserId={user?.id}
                    exitDirection={exitingCard && exitingCard.id === cardForDisplay.id ? exitingCard.direction : null}
                    onAnimationComplete={() => {
                      if (exitingCard) {
                        handleInteraction(exitingCard.direction === 'right');
                        setIsCardFlipped(true);
                        setExitingCard(null);
                      }
                    }}
                    onToggleHot={(cardId) => {
                      if (toggleHotStatus) {
                        toggleHotStatus(cardId);
                      }
                    }}
                />

                {/* Botão "Oops!" para desfazer a última ação de "Não Topo". */}
                {canUndoDislike && !areActionButtonsDisabled && cardForDisplay && (
                  <div className={styles.oopsButtonContainer}>
                    <button
                      onClick={undoLastDislike}
                      className={`${styles.oopsButton} genericButton`}
                      aria-label="Desfazer última ação Não Topo!"
                    >
                      Oops!
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Painel de Ações da Carta (Topo / Não Topo) */}
            <div className={`${styles.cardActionsPanel} klnkl-all-buttons-panel klnkl-themed-panel`}>
              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.dislikeButton} ${styles.botaoDecisao} genericButton dislikeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !areActionButtonsDisabled) {
                      setExitingCard({ id: cardForDisplay.id, direction: 'left' });
                    }
                  }}
                  aria-label="Rejeitar carta"
                  disabled={areActionButtonsDisabled}
                >
              👎 Nao Topo!
                </button>

                <button
                  className={`${styles.likeButton} ${styles.botaoDecisao} genericButton likeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !areActionButtonsDisabled) {
                      setExitingCard({ id: cardForDisplay.id, direction: 'right' });
                    }
                  }}
                  aria-label="Aceitar carta"
                  disabled={areActionButtonsDisabled}
                >
              ❤️ Topo!
              </button>
            </div>
            </div>
          </>
        ) : (
          // Visão exibida quando não há mais cartas para mostrar.
          unseenCardsCount === 0 ? (
            <div className={`${styles.noCardsViewContainer} klnkl-themed-panel`}>
              <h2 className={styles.pageTitle}>Fim das Cartas!</h2>
              <p className={styles.noCardsMessage}>
                Você viu todas as cartas disponíveis por enquanto.
                <br />
                Volte mais tarde para novas sugestões ou crie as suas!
              </p>
            </div>
          ) : (
            <p className={styles.noCardsMessage}>Carregando próxima carta...</p>
          )
        )}
      </div>

      {/* Painel de Navegação Inferior */}
      <div className={`${styles.bottomNavPanel} klnkl-all-buttons-panel klnkl-themed-panel`}>
        <div className={styles.bottomNavContainer}>
          <button className={`${styles.bottomNavIconStyle} ${styles.ballButton} genericButton klnkl-icon-nav-button klnkl-nav-cards`} onClick={openCarinhosMimosModal} title="Carinhos & Mimos">
            ❤️
          </button> 
          <button
            onClick={() => navigate('/matches')}
            className={`${styles.matchesNavButton} ${styles.linkButton} genericButton klnkl-nav-matches`}
          >
            Links ({matchedCards.length})
          </button>
          <Link to="/profile" className={`${styles.bottomNavIconStyle} ${styles.ballButton} genericButton klnkl-icon-nav-button klnkl-nav-profile`} aria-label="Perfil" title="Perfil">
            👤
          </Link>
        </div>
        <button
          onClick={openCreateUserCardModal}
          className={`${styles.createKinkButtonInNav} klnkl-create-kink-btn genericButton`}
          title="Criar novo Kink"
          aria-label="Criar novo Kink"
        >
          Criar Kink
        </button>
      </div>

      {/* Contadores de Cartas */}
      <div className={`${styles.cardCounters} klnkl-card-counters`}>
        <span className={`${styles.counterItem} klnkl-counter-item`}>
          Cartas Vistas: <span className={styles.counterValue}>{seenCards.length}</span>
        </span>
        <span className={`${styles.counterSeparator} klnkl-counter-separator`}>|</span>
        <span className={`${styles.counterItem} klnkl-counter-item`}>
          Restantes: <span className={styles.counterValue}>{unseenCardsCount}</span>
        </span>
      </div>
    </div>
  );
}


export default CardPilePage;