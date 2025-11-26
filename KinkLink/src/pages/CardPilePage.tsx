// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\CardPilePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import { collection, query, where, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore'; // <<< ADICIONADO
import { useAuth } from '../contexts/AuthContext'; // Importar useAuth
import { Link, useNavigate } from 'react-router-dom';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import MatchModal from '../components/MatchModal';
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CreateUserCardModal from '../components/CreateUserCardModal';
import toast from 'react-hot-toast'; // Importa o toast
import PeekInvitation from '../components/PeekInvitation/PeekInvitation'; // Importa o novo componente
import ConexaoCardModal from '../components/ConexaoCardModal';
import { useCardPileLogic } from '../hooks/useCardPileLogic';
import CarinhosMimosModal from '../components/CarinhosMimosModal';
import CardBack from '../components/CardBack';
import type { Card } from '../data/cards';
import { useSkin } from '../contexts/SkinContext';
import { useCardTips } from '../hooks/useCardTips'; // Importa o novo hook
import { db } from '../firebase'; // <<< ADICIONADO
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
    undoLastDislike, // Nova função do hook
    canUndoDislike,  // Novo estado do hook
    cardToPeek,      // Carta para espiar
    acceptPeek,      // Função para aceitar espiar
    rejectPeek,      // Função para rejeitar espiar
  } = useCardPileLogic();
  const { isLoadingSkins } = useSkin(); 
  const { user } = useAuth(); // Obter o usuário atual

  const { matchedCards, seenCards, handleCreateUserCard, toggleHotStatus } = useUserCardInteractions();
  const navigate = useNavigate();

  const [exitingCard, setExitingCard] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [dragVisuals, setDragVisuals] = useState({ x: 0, active: false, dir: 0 });
  const [cardDimensions, setCardDimensions] = useState({ width: 250, height: 350 }); 

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

  const cardForDisplay: PlayingCardDataType | null = useMemo(() => {
    if (!currentCard) return null;
    return {
        id: currentCard.id,
        text: currentCard.text,
        category: currentCard.category,
        intensity: currentCard.intensity,
        creatorId: (currentCard as Card & { createdBy?: string }).createdBy, // Mapeia createdBy para creatorId de forma mais segura
        isCreatorSuggestion: currentCard.isCreatorSuggestion, // Passa a nova flag
      isHot: matchedCards.find(mc => mc.id === currentCard.id)?.isHot || false,
    };
  }, [currentCard, matchedCards]);

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

  // Efeito para garantir que a carta "flipe" quando currentCard muda (ex: após "Oops!")
  useEffect(() => {
    if (currentCard && !exitingCard) {
      // Força a carta a estar "virada" para que a animação de flip ocorra
      setIsCardFlipped(true);
    }
  }, [currentCard?.id, exitingCard]); // Depende do ID da carta atual e do estado de exitingCard

  // <<< NOVO: Listener para "Like do Parceiro"
  useEffect(() => {
    if (!user?.coupleId || !user?.id) {
      return; // Sai se não houver casal
    }

    const fetchPartnerIdAndListen = async () => {
      try {
        // Buscar partner ID do couple document
        const coupleDocRef = doc(db, 'couples', user.coupleId!);
        const coupleDocSnap = await getDoc(coupleDocRef);
        
        if (!coupleDocSnap.exists()) {
          console.log('[CardPilePage] Couple document não encontrado');
          return;
        }

        const coupleData = coupleDocSnap.data();
        const partnerId = coupleData.members?.find((id: string) => id !== user.id);
        
        if (!partnerId) {
          console.log('[CardPilePage] Partner ID não encontrado no couple');
          return;
        }

        const interactionsRef = collection(db, `couples/${user.coupleId}/likedInteractions`);
        // Ouve apenas por documentos criados a partir de agora
        const q = query(interactionsRef, where('createdAt', '>', Timestamp.now()));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              // Verifica se o primeiro like foi do parceiro
              if (data.likedByUIDs && data.likedByUIDs[0] === partnerId) {
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

        // Retorna a função de limpeza
        return unsubscribe;
      } catch (error) {
        console.error('[CardPilePage] Erro ao configurar listener de likes do parceiro:', error);
      }
    };

    let unsubscribe: (() => void) | undefined;
    fetchPartnerIdAndListen().then(unsub => {
      unsubscribe = unsub;
    });

    // Limpa o listener quando o componente desmonta ou o usuário muda
    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, [user?.coupleId, user?.id]);

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
    // Substitui o alert por um toast
    toast("Considere realinhar seu filtro: com consentimento e parceria vários mundos podem ser alcançados!", {
      icon: '🤫',
    });
  };

  // A função rejectPeek do hook já faz o que é preciso, então não precisamos de um wrapper.

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
          onClose={() => {
            handleConexaoInteractionInModal(false); // Considera fechar como rejeitar
          }}
        />
      )}

      {showCreateUserCardModal && (
        <CreateUserCardModal
          isOpen={showCreateUserCardModal}
          onClose={closeCreateUserCardModal}
          onSubmit={(category: Card['category'], text: string, intensity: number, notifyAsCreator: boolean) => { // Atualiza a assinatura
            if (handleCreateUserCard) {
                 handleCreateUserCard(category, text, intensity, notifyAsCreator); // Passa o novo parâmetro
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
                    key={cardForDisplay.id} // A key aqui é importante para o React identificar a carta mudando
                    data={cardForDisplay}
                    targetWidth={cardDimensions.width}
                    targetHeight={cardDimensions.height}
                    dragVisuals={dragVisuals}
                    isFlipped={exitingCard && exitingCard.id === cardForDisplay.id ? false : isCardFlipped}
                    currentUserId={user?.id} // Passa o ID do usuário atual
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

                {/* Botão Oops! movido para ser filho do playingCardWrapper */}
                {canUndoDislike && !areActionButtonsDisabled && cardForDisplay && (
                  <div className={styles.oopsButtonContainer}> {/* Container para posicionamento */}
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

            {/* Painel para botões de ação da carta e "Criar Kink" */}
            {/* Este painel só aparece se houver cardForDisplay. Adicionada a classe global klnkl-all-buttons-panel */}
            <div className={`${styles.cardActionsPanel} klnkl-all-buttons-panel klnkl-themed-panel`}>
              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.dislikeButton} ${styles.botaoDecisao} genericButton dislikeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !areActionButtonsDisabled) { // Verifica se não está desabilitado
                      // setAnimateTipsIn(false); // Removido: useCardTips gerencia isso
                      setExitingCard({ id: cardForDisplay.id, direction: 'left' });
                    }
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Rejeitar carta"
                  disabled={areActionButtonsDisabled} // Adiciona o estado de desabilitado
                >
              👎 Nao Topo!
                </button>

                <button
                  className={`${styles.likeButton} ${styles.botaoDecisao} genericButton likeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !areActionButtonsDisabled) { // Verifica se não está desabilitado
                      // setAnimateTipsIn(false); // Removido: useCardTips gerencia isso
                      setExitingCard({ id: cardForDisplay.id, direction: 'right' });
                    }
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Aceitar carta"
                  disabled={areActionButtonsDisabled} // Adiciona o estado de desabilitado
                >
              ❤️ Topo!
              </button>
            </div>
            </div> {/* Fecha o cardActionsPanel */}
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
              {/* O botão "Crie seu Kink" foi movido para o painel de navegação inferior */}
            </div>
          ) : (
            <p className={styles.noCardsMessage}>Carregando próxima carta...</p>
          )
        )
      }
      </div> {/* Fim de styles.contentArea */}
      {/* PAINEL DE NAVEGAÇÃO INFERIOR - SEMPRE VISÍVEL. Adicionada klnkl-all-buttons-panel para o estilo do botão Criar Kink */}
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
        {/* BOTÃO "CRIE SEU KINK" - AGORA É IRMÃO DO bottomNavContainer, ABAIXO DELE */}
        <button
          onClick={openCreateUserCardModal}
          className={`${styles.createKinkButtonInNav} klnkl-create-kink-btn genericButton`}
          title="Criar novo Kink"
          aria-label="Criar novo Kink"
        >
          Criar Kink
        </button>
      </div>

      {/* Contadores de cartas - Sempre visíveis */}
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