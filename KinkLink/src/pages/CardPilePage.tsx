// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\CardPilePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import MatchModal from '../components/MatchModal';
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CreateUserCardModal from '../components/CreateUserCardModal';
import ConexaoCardModal from '../components/ConexaoCardModal';
import { useCardPileLogic } from '../hooks/useCardPileLogic';
import CarinhosMimosModal from '../components/CarinhosMimosModal';
import CardBack from '../components/CardBack';
import type { Card } from '../data/cards';
import { useSkin } from '../contexts/SkinContext';
import { useCardTips } from '../hooks/useCardTips'; // Importa o novo hook
import { useCardPileModals } from '../hooks/useCardPileModals'; // Importa o hook dos modais
// import { categorySpecificTips } from '../components/categorySpecificTips'; // Não é mais necessário aqui
import SideTipMessages from '../components/SideTipMessages';
import styles from './CardPilePage.module.css';

function CardPilePage() {
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
  } = useCardPileLogic();
  const { isLoadingSkins } = useSkin();

  const { matchedCards, seenCards, handleCreateUserCard, toggleHotStatus } = useUserCardInteractions();
  const navigate = useNavigate();

  const [exitingCard, setExitingCard] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [dragVisuals, setDragVisuals] = useState({ x: 0, active: false, dir: 0 });
  const [cardDimensions, setCardDimensions] = useState({ width: 250, height: 350 });
  const [hasUnseenMatches, setHasUnseenMatches] = useState(false);

  const { activeLeftTip, activeRightTip, animateTipsIn } = useCardTips(currentCard); // Usa o hook

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

  const cardForDisplay: PlayingCardDataType | null = currentCard
    ? {
        id: currentCard.id,
        text: currentCard.text,
        category: currentCard.category,
        intensity: currentCard.intensity,
        isHot: matchedCards.find(mc => mc.id === currentCard.id)?.isHot || false,
      }
    : null;

  useEffect(() => {
    const lastSeenMatchesCount = parseInt(localStorage.getItem('kinklink_lastSeenMatchesCount') || '0', 10);
    if (matchedCards.length > lastSeenMatchesCount) {
      setHasUnseenMatches(true);
    } else {
      setHasUnseenMatches(false);
    }
  }, [matchedCards]);

  const handleMatchesButtonClick = () => {
    localStorage.setItem('kinklink_lastSeenMatchesCount', String(matchedCards.length));
    setHasUnseenMatches(false);
    navigate('/matches');
  };

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

  useEffect(() => {
    if (cardForDisplay && !exitingCard && isCardFlipped) {
      const timer = setTimeout(() => {
        setIsCardFlipped(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [cardForDisplay, exitingCard, isCardFlipped]);

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

  if (isLoadingSkins) {
    return <div className={styles.page}><p>Carregando skins...</p></div>;
  }

  return (
    <div className={styles.page}> {/* Removido klnkl-themed-panel daqui */}
      {showMatchModal && currentMatchCard && (
        <MatchModal
          card={currentMatchCard}
          onClose={() => setShowMatchModal(false)}
        />
      )}

      {showConexaoModal && currentConexaoCardForModal && (
        <ConexaoCardModal
          isOpen={showConexaoModal}
          card={currentConexaoCardForModal}
          onAccept={() => handleConexaoInteractionInModal(true)}
          onReject={() => handleConexaoInteractionInModal(false)}
          onClose={() => {
            handleConexaoInteractionInModal(false); // Considera fechar como rejeitar
          }}
        />
      )}

      {showCreateUserCardModal && (
        <CreateUserCardModal
          isOpen={showCreateUserCardModal}
          onClose={closeCreateUserCardModal}
          onSubmit={(category: Card['category'], text: string, intensity: number) => {
            if (handleCreateUserCard) {
                 handleCreateUserCard(category, text, intensity);
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

      <div className={styles.contentArea}>
        {cardForDisplay ? (
          <>
            <div className={styles.cardStackContainer}> {/* REMOVIDO klnkl-themed-panel daqui */}
               <SideTipMessages
                leftMessage={activeLeftTip}
                rightMessage={activeRightTip}
                animateIn={animateTipsIn}
                cardWidth={cardDimensions.width}
              />
              {cardForDisplay && (
                <div className={styles.staticCardBack}>
                  {/* CardBack estaria dentro do painel */}
                  <CardBack
                    targetWidth={cardDimensions.width}
                    targetHeight={cardDimensions.height}
                  />
                </div>
              )}
              <div {...bindCardDrag()} className={styles.playingCardWrapper}> {/* playingCardWrapper não teria a classe de painel aqui */}
                <PlayingCard
                    key={cardForDisplay.id}
                    data={cardForDisplay}
                    targetWidth={cardDimensions.width}
                    targetHeight={cardDimensions.height}
                    dragVisuals={dragVisuals}
                    isFlipped={exitingCard && exitingCard.id === cardForDisplay.id ? false : isCardFlipped}
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
              </div>
            </div>

            <div className={`${styles.allButtonsPanel} klnkl-all-buttons-panel klnkl-themed-panel`}>
              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.dislikeButton} ${styles.botaoDecisao} genericButton dislikeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !exitingCard) {
                      // setAnimateTipsIn(false); // Removido: useCardTips gerencia isso
                      setExitingCard({ id: cardForDisplay.id, direction: 'left' });
                    }
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Rejeitar carta"
                >
              👎 Nao Topo!
                </button>

                <button
                  className={`${styles.likeButton} ${styles.botaoDecisao} genericButton likeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !exitingCard) {
                      // setAnimateTipsIn(false); // Removido: useCardTips gerencia isso
                      setExitingCard({ id: cardForDisplay.id, direction: 'right' });
                    }
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Aceitar carta"
                >
              ❤️ Topo!
                </button>
              </div>

              {/* Botão "Criar Kink" movido para dentro do painel e com classe global estável */}
              <button
                onClick={openCreateUserCardModal}
                className="klnkl-create-kink-btn genericButton" /* Classe global para estilização no panel-styles.css */
                title="Criar novo Kink"
                aria-label="Criar novo Kink"
              >
                Criar Kink
              </button>

              <div className={styles.bottomNavContainer}>
                <button className={`${styles.bottomNavIconStyle} ${styles.ballButton} genericButton klnkl-icon-nav-button klnkl-nav-cards`} onClick={openCarinhosMimosModal} title="Carinhos & Mimos">
                  ❤️
                </button>
                <button
                  onClick={handleMatchesButtonClick}
                  className={`${styles.matchesNavButton} ${styles.linkButton} genericButton klnkl-nav-matches ${hasUnseenMatches ? styles.shakeAnimation : ''}`}
                >
                  Links ({matchedCards.length})
                </button>
                <Link to="/profile" className={`${styles.bottomNavIconStyle} ${styles.ballButton} genericButton klnkl-icon-nav-button klnkl-nav-profile`} aria-label="Perfil" title="Perfil">
                  👤
                </Link>
              </div>
            </div>
          </>
        ) : (
          unseenCardsCount === 0 ? ( // Este bloco também deve estar dentro do painel temático da página
            <div className={`${styles.noCardsViewContainer} klnkl-themed-panel`}>
              <h2 className={styles.pageTitle}>Fim das Cartas!</h2>
              <p className={styles.noCardsMessage}>
                Você viu todas as cartas disponíveis por enquanto.
                <br />
                Volte mais tarde para novas sugestões ou crie as suas!
              </p>
              <div
                onClick={openCreateUserCardModal}
                className={`${styles.createKinkMiniButton} ${styles.centeredCreateKinkButton}`}
                title="Criar novo Kink"
                role="button"
                aria-label="Criar novo Kink"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') openCreateUserCardModal(); }}
              >
                <div className={styles.createKinkMiniCardBackWrapper}>
                  <CardBack targetWidth={30} targetHeight={42} />
                </div>
                <div className={styles.createKinkMiniTextOverlay}>Crie<br/>seu Kink</div>
              </div>
            </div>
          ) : (
            <p className={styles.noCardsMessage}>Carregando próxima carta...</p>
          )
        )
      }
      </div>
      {/* Contadores de cartas voltam a ser um elemento simples */}
      {/* Estes contadores também devem estar dentro do painel temático da página */}
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
} // Adicionado o fechamento da função CardPilePage


export default CardPilePage;
