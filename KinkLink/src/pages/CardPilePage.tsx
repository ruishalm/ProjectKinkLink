// d:\Projetos\Github\app\KinkLink\KinkLink\src\pages\CardPilePage.tsx
import React, { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo
import { useDrag } from '@use-gesture/react';
import { Link, useNavigate } from 'react-router-dom'; // Adicionado useNavigate
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import MatchModal from '../components/MatchModal';
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CreateUserCardModal from '../components/CreateUserCardModal';
import ConexaoCardModal from '../components/ConexaoCardModal';
import { useCardPileLogic } from '../hooks/useCardPileLogic';
import CarinhosMimosModal from '../components/CarinhosMimosModal'; // Novo Modal
import CardBack from '../components/CardBack'; // Importação adicionada
import type { Card } from '../data/cards'; // Importa o tipo Card
import styles from './CardPilePage.module.css'; // Importa os CSS Modules

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
    allConexaoCards, // Precisamos pegar todas as cartas de conexão
  } = useCardPileLogic();

  const { matchedCards, seenCards, handleCreateUserCard, toggleHotStatus } = useUserCardInteractions();
  const navigate = useNavigate();

  // Estado para controlar a animação de saída da carta atual
  const [exitingCard, setExitingCard] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true); // Nova carta aparece virada (de costas)
  const [showCreateUserCardModal, setShowCreateUserCardModal] = useState(false);
  const [showCarinhosMimosModal, setShowCarinhosMimosModal] = useState(false); // Estado para o novo modal
  const [dragVisuals, setDragVisuals] = useState({ x: 0, active: false, dir: 0 }); // Estado para feedback visual do swipe
  const [cardDimensions, setCardDimensions] = useState({ width: 250, height: 350 }); // Estado para dimensões responsivas da carta
  const [hasUnseenMatches, setHasUnseenMatches] = useState(false);

  // Filtra as cartas de conexão para mostrar apenas as que já foram vistas pelo usuário
  const seenConexaoCardsForModal = useMemo(() => {
    return (allConexaoCards || []).filter(card => seenCards.includes(card.id));
  }, [allConexaoCards, seenCards]);

  // Prepara os dados da carta atual para exibição, incluindo o status 'isHot'
  // e garante que currentCard seja do tipo CardData esperado por PlayingCard
  const cardForDisplay: PlayingCardDataType | null = currentCard
    ? {
        id: currentCard.id,
        text: currentCard.text,
        category: currentCard.category,
        intensity: currentCard.intensity,
        isHot: matchedCards.find(mc => mc.id === currentCard.id)?.isHot || false,
      }
    : null;

  // Efeito para verificar matches não visualizados
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
    navigate('/matches'); // Navega para a página de matches
  };

  // Efeito para calcular dimensões responsivas da carta
  useEffect(() => {
    const calculateCardDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const aspectRatio = 350 / 250; // Altura / Largura base

      // Define uma largura baseada na tela, com limites
      let newCardWidth = screenWidth * 0.8; // Tenta ocupar 80% da largura da tela
      if (screenWidth > 600) { // Em telas maiores, não precisa ser tão largo percentualmente
        newCardWidth = screenWidth * 0.5;
      }
      newCardWidth = Math.max(220, Math.min(newCardWidth, 320)); // Limites: min 220px, max 320px

      let newCardHeight = newCardWidth * aspectRatio;

      // Considera a altura da tela para não cortar a carta e os botões
      // Deixa espaço para a barra de navegação inferior (aprox 60-80px) e botões de ação (aprox 80-100px)
      const availableHeightForCard = screenHeight * 0.9 - 180; // 90% da tela menos espaço para UI
      
      if (newCardHeight > availableHeightForCard) {
        newCardHeight = availableHeightForCard;
        newCardWidth = newCardHeight / aspectRatio;
      }
      // Re-garante o mínimo após ajuste de altura
      newCardWidth = Math.max(220, newCardWidth);
      newCardHeight = newCardWidth * aspectRatio;

      setCardDimensions({ width: Math.round(newCardWidth), height: Math.round(newCardHeight) });
    };
    calculateCardDimensions();
    window.addEventListener('resize', calculateCardDimensions);
    return () => window.removeEventListener('resize', calculateCardDimensions);
  }, []);

  // Efeito para "virar" a carta após ela aparecer de costas
  useEffect(() => {
    if (cardForDisplay && !exitingCard && isCardFlipped) {
      // Se uma nova carta está visível, não está saindo, e está atualmente "de costas"
      const timer = setTimeout(() => {
        setIsCardFlipped(false); // Vira para mostrar a frente
      }, 150); // Pequeno delay para a carta ser renderizada de costas antes de virar
      return () => clearTimeout(timer);
    }
    // Se não há carta ou a carta está saindo, e ela não está marcada como "flipped",
    // preparamos para a próxima carta aparecer de costas.
    if (!cardForDisplay && !isCardFlipped) {
        // setIsCardFlipped(true); // Comentado por enquanto, pode causar loop se mal posicionado
    }
  }, [cardForDisplay, exitingCard, isCardFlipped]);

  // Função para feedback tátil
  const triggerHapticFeedback = (pattern: number | number[] = 30) => { // Duração padrão de 30ms
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Não é crítico se falhar, apenas loga um aviso
        console.warn("Haptic feedback failed:", e);
      }
    }
  };

  // Configuração do gesto de arrastar (swipe)
  const bindCardDrag = useDrag(({ active, movement: [mx], direction: [dx], velocity: [vx] }) => {
    // active: true se o usuário está pressionando/arrastando
    // movement: [mx, my] - deslocamento total do gesto
    // direction: [dx, dy] - direção do último movimento (-1, 0 ou 1)
    // velocity: [vx, vy] - velocidade do movimento

    if (active) {
      // Atualiza os visuais enquanto o usuário arrasta
      setDragVisuals({ x: mx, active: true, dir: dx });
    } else {
      // Drag terminou, resetar visuais
      setDragVisuals({ x: 0, active: false, dir: 0 });

      if (cardForDisplay && !exitingCard) { // Se houver carta e não estiver já saindo
        // Thresholds para confirmar o swipe ao soltar
        const SWIPE_CONFIRM_DISTANCE_THRESHOLD = cardDimensions.width * 0.35; // Usa a largura dinâmica
        const SWIPE_VELOCITY_THRESHOLD = 0.3; // Velocidade mínima do gesto

        // Verifica se o swipe foi intencional (distância OU velocidade)
        if (Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD || Math.abs(mx) > SWIPE_CONFIRM_DISTANCE_THRESHOLD) {
          if (dx > 0) { // Swipe para a direita
            triggerHapticFeedback();
            setExitingCard({ id: cardForDisplay.id, direction: 'right' });
          } else if (dx < 0) { // Swipe para a esquerda
            triggerHapticFeedback();
            setExitingCard({ id: cardForDisplay.id, direction: 'left' });
          }
        }
      }
    }
  });

  if (!currentCard && unseenCardsCount === 0) {
    return (
      <div className={styles.page}>
        <h2 style={{color: '#64b5f6'}}>Fim das Cartas!</h2>
        <p className={styles.noCardsMessage}>
          Você viu todas as cartas disponíveis por enquanto.
          <br />
          Volte mais tarde para novas sugestões ou crie as suas!
        </p>
        <button 
          className={styles.noCardsCreateButton}
          onClick={() => setShowCreateUserCardModal(true)}
        >Crie seu Kink</button>
      </div>
    );
  }


  return (
    <div className={styles.page}>
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
            handleConexaoInteractionInModal(false);
          }}
        />
      )}

      {showCreateUserCardModal && (
        <CreateUserCardModal
          isOpen={showCreateUserCardModal}
          onClose={() => setShowCreateUserCardModal(false)}
          onSubmit={(category: Card['category'], text: string, intensity: number) => { // Adiciona intensity
            if (handleCreateUserCard) { // Verifica se a função existe
                 handleCreateUserCard(category, text, intensity); // Passa intensity
            }
            setShowCreateUserCardModal(false);
          }}
        />
      )}

      {showCarinhosMimosModal && (
        <CarinhosMimosModal
          isOpen={showCarinhosMimosModal}
          onClose={() => setShowCarinhosMimosModal(false)}
          conexaoCards={seenConexaoCardsForModal} // Passa apenas as cartas de conexão vistas
        />
      )}


      {/* O botão "Crie seu Kink" que estava aqui foi movido para junto dos botões de ação abaixo */}
      {cardForDisplay ? ( // Usa cardForDisplay aqui
        <>
          <div className={styles.cardStackContainer}>
            {/* Carta de fundo estática */}
            {cardForDisplay && ( /* Só mostra se houver uma carta principal */
              <div className={styles.staticCardBack}>
                <CardBack
                  targetWidth={cardDimensions.width}
                  targetHeight={cardDimensions.height}
                />
              </div>
            )}
            {/* Aplicamos o {...bindCardDrag()} ao div que contém a carta para capturar o gesto */}
            <div {...bindCardDrag()} className={styles.playingCardWrapper}>
              <PlayingCard
                  key={cardForDisplay.id}
                  data={cardForDisplay}
                  targetWidth={cardDimensions.width} // Passa a largura dinâmica
                  targetHeight={cardDimensions.height} // Passa a altura dinâmica
                  dragVisuals={dragVisuals} // Passa informações do drag para feedback visual
                  isFlipped={exitingCard && exitingCard.id === cardForDisplay.id ? false : isCardFlipped} // Carta saindo mostra a frente, nova carta respeita isCardFlipped
                  exitDirection={exitingCard && exitingCard.id === cardForDisplay.id ? exitingCard.direction : null}
                onAnimationComplete={() => {
                  if (exitingCard) {
                    handleInteraction(exitingCard.direction === 'right');
                    setIsCardFlipped(true); // Prepara a próxima carta para aparecer de costas
                    setExitingCard(null); // Reseta o estado da animação
                  }
                }}
                  onToggleHot={(cardId) => {
                    if (toggleHotStatus) {
                      toggleHotStatus(cardId);
                    }
                  }}
              />
            </div> {/* Closes div for PlayingCard wrapper (zIndex: 2) */}

          </div> {/* THIS IS THE CORRECTED CLOSING TAG for cardStackContainerStyle */}

          <div className={styles.buttonContainer}>
            <button
              className={styles.dislikeButton}
              onClick={() => {
                if (cardForDisplay && !exitingCard) { // Só anima se não estiver animando
                  setExitingCard({ id: cardForDisplay.id, direction: 'left' });
                }
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label="Rejeitar carta"
            >
              Passo
            </button>

            <button
              className={styles.likeButton}
              onClick={() => {
                if (cardForDisplay && !exitingCard) { // Só anima se não estiver animando
                  setExitingCard({ id: cardForDisplay.id, direction: 'right' });
                }
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label="Aceitar carta"
            >
              Topo!
            </button>

            {/* Novo Botão Miniatura "Crie seu Kink" */}
            <div
              onClick={() => setShowCreateUserCardModal(true)}
              className={styles.createKinkMiniButton}
              title="Criar novo Kink" // Adicionado title para acessibilidade
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              role="button"
              aria-label="Criar novo Kink"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowCreateUserCardModal(true); }}
            >
              <div className={styles.createKinkMiniCardBackWrapper}>
                <CardBack />
              </div>
              {/* Texto sobreposto */}
              <div className={styles.createKinkMiniTextOverlay}>
                Crie<br/>seu Kink
              </div>
              </div>
            {/* Este div fechava o buttonContainerStyle, mas o Fragmento <> ainda estava aberto */}
          </div>
        </>
      ) : (
        <p className={styles.noCardsMessage}>Carregando próxima carta...</p>
      )}

      {/* Nova Barra de Navegação Inferior */}
      <div className={styles.bottomNavContainer}>
        <button className={styles.carinhosMimosButton} onClick={() => setShowCarinhosMimosModal(true)} title="Carinhos & Mimos">
          ❤️
        </button>
        {/* Alterado Link para button para usar o onClick customizado */}
        <button 
          onClick={handleMatchesButtonClick} 
          className={`${styles.matchesNavButton} ${hasUnseenMatches ? styles.shakeAnimation : ''}`} >
          Links ({matchedCards.length})
        </button>
        <Link to="/profile" className={styles.profileNavButton} aria-label="Perfil">
          👤 {/* Ícone de perfil Unicode */}
        </Link>
      </div>
      <div className={styles.cardCounters}>
        Cartas Vistas: {seenCards.length} | Restantes: {unseenCardsCount}
      </div>
    </div>
  );
}

export default CardPilePage;
