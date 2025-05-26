// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\PlayingCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './PlayingCard.module.css'; // Importa os CSS Modules

// Defina a interface para os dados do card, conforme seu projeto
export interface CardData {
  id: string;
  text: string;
  category: string;
  intensity?: number;
  isHot?: boolean;
}

interface PlayingCardProps {
  data: CardData;
  targetWidth?: number; // Largura final desejada da carta
  targetHeight?: number; // Altura final desejada da carta
  onToggleHot?: (cardId: string) => void;
  exitDirection?: 'left' | 'right' | null;
  onAnimationComplete?: () => void;
  isFlipped?: boolean; // Controla se a carta está mostrando o verso
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  dragVisuals?: { // Novas props para feedback visual do swipe
    x: number;      // Deslocamento horizontal do drag
    active: boolean;// Se o drag está ativo
    dir: number;    // Direção horizontal do drag (-1 esquerda, 0 neutro, 1 direita)
  };
}

const getCategoryStyles = (category: string): { backgroundColor: string; color: string; borderColor: string } => {
  switch (category.toLowerCase()) {
    case 'sensorial': return { backgroundColor: '#FFD700', color: '#4A3B00', borderColor: '#B8860B' };
    case 'poder': return { backgroundColor: '#E53935', color: '#FFFFFF', borderColor: '#B71C1C' };
    case 'fantasia': return { backgroundColor: '#5E35B1', color: '#FFFFFF', borderColor: '#311B92' };
    case 'exposicao': return { backgroundColor: '#43A047', color: '#FFFFFF', borderColor: '#1B5E20' };
    case 'conexao': return { backgroundColor: '#FFFFFF', color: '#333333', borderColor: '#696969' };
    case 'usercard': // Adicionado para consistência com o modal de criação
    case 'userCard': return { backgroundColor: '#0b5351', color: '#FFFFFF', borderColor: '#073e3c' };
    default: return { backgroundColor: '#ECEFF1', color: '#263238', borderColor: '#B0BEC5' };
  }
};

const PlayingCard: React.FC<PlayingCardProps> = ({
  data, targetWidth = 250, targetHeight = 350, onToggleHot, exitDirection, onAnimationComplete, isFlipped, onClick, dragVisuals
}) => {
  // Refs e Estados
  const textContentRef = useRef<HTMLParagraphElement>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const [currentFontSize, setCurrentFontSize] = useState(16);

  // Variáveis e Lógica de Cálculo
  // Calcular um fator de escala visual para os elementos internos
  const baseCardWidthForScaling = 250; // Largura base para a qual os valores fixos foram desenhados
  const visualScaleFactor = targetWidth / baseCardWidthForScaling;

  useEffect(() => {
    if (textContentRef.current && textAreaRef.current) {
      const textElement = textContentRef.current;
      const container = textAreaRef.current;
      let bestFitSize = 8 * visualScaleFactor; // Escala o tamanho mínimo da fonte
      const maxTestSize = 28 * visualScaleFactor; // Escala o tamanho máximo de teste da fonte

      for (let testSize = maxTestSize; testSize >= bestFitSize; testSize -= 1) {
        textElement.style.fontSize = `${testSize}px`;
        if (textElement.scrollHeight <= container.clientHeight && textElement.scrollWidth <= container.clientWidth) {
          bestFitSize = testSize;
          break;
        }
      }
      setCurrentFontSize(bestFitSize);
      textElement.style.fontSize = `${bestFitSize}px`;
    }
  }, [data.text, targetWidth, targetHeight, visualScaleFactor, isFlipped]); // Adicionado isFlipped para recalcular se a carta virar

  const categoryStyles = getCategoryStyles(data.category);

  let exitMotionTransform = '';
  if (exitDirection === 'left') {
    exitMotionTransform = `translateX(-150%) rotateZ(-15deg)`;
  } else if (exitDirection === 'right') {
    exitMotionTransform = `translateX(150%) rotateZ(15deg)`;
  }
  
  let dragRotationTransform = '';
  if (dragVisuals && dragVisuals.active) {
    const rotationFactor = 0.05; // graus por pixel de drag
    const maxRotation = 10; // max graus
    let rotation = dragVisuals.x * rotationFactor;
    rotation = Math.max(-maxRotation, Math.min(maxRotation, rotation)); // Limita a rotação
    dragRotationTransform = `rotateZ(${rotation}deg)`;
  }

  const flipTransformValue = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
  
  // Combina as transformações: flip, depois rotação do drag, depois movimento de saída
  const flipperDynamicTransform = [flipTransformValue, dragRotationTransform, exitMotionTransform].filter(Boolean).join(' ').trim() || 'none';

  // Base transition for flip
  const baseFlipTransition = 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)';
  const flipperDynamicTransition = exitMotionTransform 
    ? `transform 0.5s ease-out, ${baseFlipTransition}` // Combina transições se estiver saindo
    : (dragVisuals && dragVisuals.active ? 'none' : baseFlipTransition); // Sem transição de transform durante o drag ativo, senão usa a de flip

  // Estilos dinâmicos que dependem de props ou estado
  const flipperContainerDynamicStyle: React.CSSProperties = {
    width: `${targetWidth}px`,
    height: `${targetHeight}px`,
    opacity: exitDirection ? 0 : 1,
  };

  const dynamicCardFacePadding = `${15 * visualScaleFactor}px`;
  const dynamicCardBorderWidth = `${Math.max(1, 8 * visualScaleFactor)}px`;
  const dynamicCardBorderRadius = `${12 * visualScaleFactor}px`;

  const cardFaceDynamicInlineStyle: React.CSSProperties = {
    borderRadius: dynamicCardBorderRadius,
    padding: dynamicCardFacePadding,
    boxShadow: `0 ${Math.max(1, 4 * visualScaleFactor)}px ${Math.max(1, 8 * visualScaleFactor)}px rgba(0,0,0,0.1)`,
    border: `${dynamicCardBorderWidth} solid`,
  };

  const dynamicCornerOffset = `${10 * visualScaleFactor}px`;
  const dynamicTopLeftCornerStyle: React.CSSProperties = {
    top: dynamicCornerOffset,
    left: dynamicCornerOffset,
    color: categoryStyles.color,
  };
  const dynamicBottomRightCornerStyle: React.CSSProperties = {
    bottom: dynamicCornerOffset,
    right: dynamicCornerOffset,
    transform: 'rotate(180deg)',
    color: categoryStyles.color,
  };
  const dynamicCornerNumberStyle: React.CSSProperties = { fontSize: `${2.5 * visualScaleFactor}em` };
  const dynamicCornerSuitStyle: React.CSSProperties = { fontSize: `${0.95 * visualScaleFactor}em`, letterSpacing: `${0.5 * visualScaleFactor}px` };

  const textAreaDynamicStyle: React.CSSProperties = {
    margin: `${10 * visualScaleFactor}px 0`,
  };

  const cardFrontFaceDynamicInlineStyle: React.CSSProperties = {
    ...cardFaceDynamicInlineStyle,
    backgroundColor: categoryStyles.backgroundColor,
    color: categoryStyles.color,
    borderColor: categoryStyles.borderColor,
  };

  const cardBackFaceDynamicInlineStyle: React.CSSProperties = {
    ...cardFaceDynamicInlineStyle,
    borderColor: '#b71c1c',
  };
  
  const textContentFinalStyle: React.CSSProperties = { fontSize: `${currentFontSize}px` };

  const swipeFeedbackOverlayDynamicStyle: React.CSSProperties = dragVisuals && dragVisuals.active && dragVisuals.dir !== 0 ? {
    top: `${10 * visualScaleFactor}px`,
    padding: `${5 * visualScaleFactor}px ${10 * visualScaleFactor}px`,
    borderRadius: `${5 * visualScaleFactor}px`,
    fontSize: `${1.2 * visualScaleFactor}em`,
    left: dragVisuals.dir > 0 ? 'auto' : `${10 * visualScaleFactor}px`,
    right: dragVisuals.dir < 0 ? 'auto' : `${10 * visualScaleFactor}px`,
    backgroundColor: dragVisuals.dir > 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)',
    opacity: Math.min(Math.abs(dragVisuals.x) / (targetWidth * 0.3), 0.9),
    transform: dragVisuals.dir > 0 ? 'rotate(10deg)' : 'rotate(-10deg)',
    transformOrigin: dragVisuals.dir > 0 ? 'bottom left' : 'bottom right',
  } : {};

  const hotButtonDynamicStyle: React.CSSProperties = onToggleHot ? {
    top: dynamicCardFacePadding,
    right: dynamicCardFacePadding,
    fontSize: `${1.8 * visualScaleFactor}em`,
    color: data.isHot ? '#ff6b6b' : '#888888',
    filter: data.isHot ? 'drop-shadow(0 0 3px #ff6b6b)' : 'grayscale(100%)',
    opacity: data.isHot ? 1 : 0.6,
  } : {};

  // Funções Manipuladoras
  const handleOuterTransitionEnd = () => {
    if (exitDirection && onAnimationComplete) {
      onAnimationComplete();
    }
  };
  
  // Variáveis para Display
  const displayIntensity = typeof data.intensity === 'number' && !isNaN(data.intensity) ? data.intensity : '-';
  const categoryAbbreviation = data.category.substring(0, 3).toUpperCase();

  return (
    <div 
      style={flipperContainerDynamicStyle}
      className={`${styles.flipperContainer} ${styles.flipperContainerOuter}`}
      onTransitionEnd={handleOuterTransitionEnd}
      onClick={onClick}
    >
      <div
        className={styles.flipper}
        style={{
          transform: flipperDynamicTransform,
          transition: flipperDynamicTransition,
        }}
      >
        {/* Frente da Carta */}
        <div style={cardFrontFaceDynamicInlineStyle} className={styles.cardFront}>
          {/* Overlay de Feedback Visual do Swipe */}
          {dragVisuals && dragVisuals.active && dragVisuals.dir !== 0 && (
            <div className={styles.swipeFeedbackOverlay} style={swipeFeedbackOverlayDynamicStyle}>
              {dragVisuals.dir > 0 ? 'Topo!' : 'Passo'}
            </div>
          )}

          <div className={styles.corner} style={dynamicTopLeftCornerStyle}>
            <span className={styles.cornerNumber} style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span className={styles.cornerSuit} style={dynamicCornerSuitStyle}>{categoryAbbreviation}</span>
          </div>
          <div className={styles.corner} style={dynamicBottomRightCornerStyle}>
            <span className={styles.cornerNumber} style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span className={styles.cornerSuit} style={dynamicCornerSuitStyle}>{categoryAbbreviation}</span>
          </div>
          <div ref={textAreaRef} className={styles.textArea} style={textAreaDynamicStyle}>
            <p ref={textContentRef} className={styles.textContent} style={textContentFinalStyle}>
              {data.text}
            </p>
          </div>
          {onToggleHot && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHot(data.id); }}
              className={styles.hotButton}
              style={hotButtonDynamicStyle}
              aria-label={data.isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
              title={data.isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
            >
              🔥
            </button>
          )}
        </div>

        {/* Verso da Carta */}
        <div style={cardBackFaceDynamicInlineStyle} className={styles.cardBack}>
          <div className={styles.cardBackDiagonalLines}></div>
          <div className={styles.cardBackDiagonalText}>
            Kink 🔗 Link
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayingCard;
