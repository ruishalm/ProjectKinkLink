// InteractiveDemo.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DemoCard from './DemoCard';
import { demoCards } from './demoCardData';
import styles from './InteractiveDemo.module.css';
import { useDrag } from '@use-gesture/react';

// Função para embaralhar um array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const InteractiveDemo: React.FC = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [dragVisuals, setDragVisuals] = useState({ x: 0, active: false, dir: 0 });
  const [exitingDirection, setExitingDirection] = useState<'left' | 'right' | null>(null);

  // IDs das cartas que o "Parceiro Simulado" já curtiu
  const simulatedPartnerLikes: string[] = ['c1', 'c3', 'c5'];

  // Embaralha as cartas apenas uma vez quando o componente monta
  const shuffledDemoCards = useMemo(() => shuffleArray(demoCards), []);
  const currentCard = shuffledDemoCards[currentCardIndex];

  useEffect(() => {
    // Lida com o avanço da carta para feedback simples (não-match) ou após swipe
    // Este useEffect é acionado quando feedbackMessage muda.
    if (feedbackMessage && !showMatchModal) {
      // Se a mensagem de feedback foi definida e não vamos mostrar um modal,
      // configuramos um timer para limpar a mensagem e avançar a carta.
      // Isso acontece após uma interação (botão ou swipe) que não resultou em "Link!".

      const timer = setTimeout(() => {
        setFeedbackMessage(null);
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % shuffledDemoCards.length);
        // Resetar exitingDirection aqui garante que a próxima carta não comece "saindo"
        setExitingDirection(null); 
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage, showMatchModal, exitingDirection, shuffledDemoCards.length]);


  const handleInteraction = (liked: boolean) => {
    setShowMatchModal(false);
    let message: string;

    if (liked) {
      if (currentCard && simulatedPartnerLikes.includes(currentCard.id)) {
        message = "🎉 Link! ✨ É assim que você e seu parceiro alinham seus interesses!";
        setFeedbackMessage(message);
        setShowMatchModal(true);
        return; // Não avança a carta imediatamente, espera o modal ser fechado
      } else {
        message = "Você topou! 👍";
      }
    } else {
      message = "Você não topou. 👎";
    }
    setFeedbackMessage(message);
    // O avanço da carta para feedback simples é tratado pelo useEffect
  };

  const handleSwipeInteraction = (direction: 'left' | 'right') => {
    if (exitingDirection || showMatchModal) return; // Evita múltiplas interações rápidas
    setExitingDirection(direction); // Isso vai disparar a animação de saída no DemoCard
    // A chamada para handleInteraction (e subsequente avanço da carta)
    // acontecerá no onAnimationComplete do DemoCard.
  };

  const handleCardAnimationComplete = () => {
    if (exitingDirection) {
      const liked = exitingDirection === 'right';
      handleInteraction(liked); // Define feedback ou mostra modal
      // Não resetamos exitingDirection aqui diretamente.
      // Se for um feedback simples, o useEffect do feedbackMessage o fará após o timeout.
      // Se for um modal, o handleCloseMatchModal o fará.
    }
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setFeedbackMessage(null);
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % shuffledDemoCards.length);
    setExitingDirection(null); // Limpa a direção de saída após fechar o modal e avançar
  };

  const bindCardDrag = useDrag(({ active, movement: [mx], direction: [dx], velocity: [vx], down, cancel, event }) => {
    event.preventDefault(); // Previne scroll da página durante o drag
    if (showMatchModal || exitingDirection) { // Não permite drag se modal estiver aberto ou carta já saindo
        if (active && cancel) cancel();
        return;
    }

    if (active) {
      setDragVisuals({ x: mx, active: true, dir: dx });
    } else {
      setDragVisuals({ x: 0, active: false, dir: 0 });
      if (!down && currentCard) {
        const SWIPE_CONFIRM_DISTANCE_THRESHOLD = 80;
        const SWIPE_VELOCITY_THRESHOLD = 0.3;

        if (Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD || Math.abs(mx) > SWIPE_CONFIRM_DISTANCE_THRESHOLD) {
          if (dx > 0) {
            handleSwipeInteraction('right');
          } else if (dx < 0) {
            handleSwipeInteraction('left');
          }
        }
      }
    }
  }, {
    axis: 'x', // Restringe o drag ao eixo X
    filterTaps: true, // Permite cliques nos botões dentro da área de drag
    preventScroll: true, // Tenta prevenir o scroll da página durante o drag
  });

  return (
    <div className={styles.demoContainer}>
      <h3 className={styles.demoTitle}>Experimente o KinkLink!</h3>

      <p className={styles.partnerInfoText}>
        Descubra os seus interesses em comum (parceiro simulado)
      </p>

      <div className={styles.tipsAndCardArea}>
        <div className={`${styles.sideTip} ${styles.leftTip}`}>
          <span>arraste para a esquerda o que você não topar!</span>
        </div>

        <div
          {...bindCardDrag()}
          className={styles.demoCardArea}
          style={{ touchAction: 'pan-y' }} // Permite scroll vertical se necessário, mas o drag é horizontal
        >
          {currentCard ? (
            <DemoCard
              card={currentCard}
              dragVisuals={dragVisuals}
              exitDirection={exitingDirection}
              onAnimationComplete={handleCardAnimationComplete}
            />
          ) : <p>Carregando demo...</p>}
        </div>

        <div className={`${styles.sideTip} ${styles.rightTip}`}>
          <span>arraste pra direita o que vc topar!</span>
        </div>
      </div>

      {/* Mensagem de feedback simples (não-match) */}
      {feedbackMessage && !showMatchModal && (
        <p className={styles.feedbackMessage}>{feedbackMessage}</p>
      )}

      {/* Botões de interação (ainda úteis para quem não usa swipe ou para acessibilidade) */}
      {currentCard && !exitingDirection && !showMatchModal && (
        <div className={styles.interactionButtons}>
          <button className={styles.dislike} onClick={() => handleSwipeInteraction('left')}>Não Topo!</button>
          <button className={styles.like} onClick={() => handleSwipeInteraction('right')}>Topo!</button>
        </div>
      )}
      {/* Texto sobre funcionalidades extras - AGORA DENTRO DA DEMO */}
      <p className={styles.demoExtraFeaturesText}>
        Ainda temos: chat individual por carta, cartas personalizadas, temas e skins e muito mais!
        <br /><strong>Confira!</strong>
      </p>

      <p className={styles.demoDisclaimer}>
        Este é um minigame demonstrativo. Suas escolhas não são salvas.
        <br />
        <Link to="/login" className={styles.loginLinkInDemo}>Faça login</Link> ou <Link to="/signup" className={styles.signupLinkInDemo}>cadastre-se</Link> para encontrar seu par real!
      </p>

      {/* Modal Simulado para "Link!" */}
      {showMatchModal && feedbackMessage && feedbackMessage.startsWith("🎉 Link!") && (
        <div className={styles.feedbackModalOverlay} onClick={handleCloseMatchModal}>
          <div className={styles.feedbackModalContent} onClick={(e) => e.stopPropagation()}>
            <p><strong>🎉 Link! ✨</strong><br />É assim que você e seu parceiro alinham seus interesses!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveDemo;
