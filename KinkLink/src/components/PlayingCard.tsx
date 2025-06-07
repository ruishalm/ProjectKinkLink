// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\PlayingCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './PlayingCard.module.css';

export interface CardData {
  id: string;
  text: string;
  category: string;
  intensity?: number;
  isHot?: boolean;
}

interface PlayingCardProps {
  data: CardData;
  targetWidth?: number;
  targetHeight?: number;
  onToggleHot?: (cardId: string, event: React.MouseEvent<HTMLButtonElement>) => void; // Modificado para incluir o evento
  exitDirection?: 'left' | 'right' | null;
  onAnimationComplete?: () => void;
  isFlipped?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  dragVisuals?: {
    x: number;
    active: boolean;
    dir: number;
  };
}

const getCategoryStyles = (category: string): { backgroundColor: string; color: string; borderColor: string } => {
  switch (category.toLowerCase()) {
    case 'sensorial': return { backgroundColor: '#FFD700', color: '#4A3B00', borderColor: '#B8860B' };
    case 'poder': return { backgroundColor: '#E53935', color: '#FFFFFF', borderColor: '#B71C1C' };
    case 'fantasia': return { backgroundColor: '#5E35B1', color: '#FFFFFF', borderColor: '#311B92' };
    case 'exposicao': return { backgroundColor: '#43A047', color: '#FFFFFF', borderColor: '#1B5E20' };
    case 'conexao': return { backgroundColor: '#FFFFFF', color: '#333333', borderColor: '#696969' };
    case 'usercard':
    case 'userCard': return { backgroundColor: '#0b5351', color: '#FFFFFF', borderColor: '#073e3c' };
    default: return { backgroundColor: '#ECEFF1', color: '#263238', borderColor: '#B0BEC5' };
  }
};

const PlayingCard: React.FC<PlayingCardProps> = ({
  data, targetWidth = 250, targetHeight = 350, onToggleHot, exitDirection, onAnimationComplete, isFlipped, onClick, dragVisuals
}) => {
  const textContentRef = useRef<HTMLParagraphElement>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const [currentFontSize, setCurrentFontSize] = useState(16);

  const baseCardWidthForScaling = 250;
  const visualScaleFactor = targetWidth / baseCardWidthForScaling;

  useEffect(() => {
    if (textContentRef.current && textAreaRef.current && !isFlipped) {
      const textElement = textContentRef.current;
      const container = textAreaRef.current;
      let bestFitSize = 8 * visualScaleFactor;
      const maxTestSize = 19 * visualScaleFactor; // Ajustado para a altura da textArea

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
  }, [data.text, targetWidth, targetHeight, visualScaleFactor, isFlipped]);

  const categoryStyles = getCategoryStyles(data.category);

  let exitMotionTransform = '';
  if (exitDirection === 'left') exitMotionTransform = `translateX(-150%) rotateZ(-15deg)`;
  else if (exitDirection === 'right') exitMotionTransform = `translateX(150%) rotateZ(15deg)`;

  let dragRotationTransform = '';
  if (dragVisuals && dragVisuals.active) {
    const rotationFactor = 0.05; const maxRotation = 10;
    let rotation = dragVisuals.x * rotationFactor;
    rotation = Math.max(-maxRotation, Math.min(maxRotation, rotation));
    dragRotationTransform = `rotateZ(${rotation}deg)`;
  }
  const flipTransformValue = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
  const flipperDynamicTransform = [flipTransformValue, dragRotationTransform, exitMotionTransform].filter(Boolean).join(' ').trim() || 'none';
  const baseFlipTransition = 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)';
  const flipperDynamicTransition = exitDirection
    ? `transform 0.5s ease-out, ${baseFlipTransition}`
    : (dragVisuals && dragVisuals.active ? 'none' : baseFlipTransition);
  const flipperContainerDynamicStyle: React.CSSProperties = {
    width: `${targetWidth}px`, height: `${targetHeight}px`, opacity: exitDirection ? 0 : 1,
  };
  const dynamicCardFacePadding = `${15 * visualScaleFactor}px`;
  const dynamicCardBorderWidth = `${Math.max(1, 8 * visualScaleFactor)}px`;
  const dynamicCardBorderRadius = `${12 * visualScaleFactor}px`;
  const cardFaceBaseDynamicStyle: React.CSSProperties = {
    borderRadius: dynamicCardBorderRadius, padding: dynamicCardFacePadding,
    boxShadow: `0 ${Math.max(1, 4 * visualScaleFactor)}px ${Math.max(1, 8 * visualScaleFactor)}px rgba(0,0,0,0.1)`,
    border: `${dynamicCardBorderWidth} solid`,
  };
  const cardFrontFaceDynamicInlineStyle: React.CSSProperties = {
    ...cardFaceBaseDynamicStyle, backgroundColor: categoryStyles.backgroundColor,
    color: categoryStyles.color, borderColor: categoryStyles.borderColor,
  };
  const cardBackFaceDynamicInlineStyle: React.CSSProperties = {
    ...cardFaceBaseDynamicStyle, backgroundColor: '#1a1a1a', borderColor: '#b71c1c', // Exemplo: Borda vermelha escura para o verso
  };
  const swipeFeedbackOverlayDynamicStyle: React.CSSProperties = dragVisuals && dragVisuals.active && dragVisuals.dir !== 0 ? {
    top: `${10 * visualScaleFactor}px`, padding: `${5 * visualScaleFactor}px ${10 * visualScaleFactor}px`,
    borderRadius: `${5 * visualScaleFactor}px`, fontSize: `${1.2 * visualScaleFactor}em`,
    left: dragVisuals.dir > 0 ? 'auto' : `${10 * visualScaleFactor}px`,
    right: dragVisuals.dir < 0 ? 'auto' : `${10 * visualScaleFactor}px`,
    backgroundColor: dragVisuals.dir > 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)',
    opacity: Math.min(Math.abs(dragVisuals.x) / (targetWidth * 0.3), 0.9),
    transform: dragVisuals.dir > 0 ? 'rotate(10deg)' : 'rotate(-10deg)',
    transformOrigin: dragVisuals.dir > 0 ? 'bottom left' : 'bottom right',
  } : {};

  const cornerOffsetFromPaddedEdge = 5 * visualScaleFactor;

  const dynamicTopLeftCornerStyle: React.CSSProperties = {
    position: 'absolute', top: cornerOffsetFromPaddedEdge, left: cornerOffsetFromPaddedEdge,
    color: categoryStyles.color, zIndex: 2,
  };
  const dynamicBottomRightCornerStyle: React.CSSProperties = {
    position: 'absolute', bottom: cornerOffsetFromPaddedEdge, right: cornerOffsetFromPaddedEdge,
    transform: 'rotate(180deg)', color: categoryStyles.color, zIndex: 2,
  };
  const dynamicCornerNumberStyle: React.CSSProperties = { fontSize: `${2.5 * visualScaleFactor}em` };
  const dynamicCornerSuitStyle: React.CSSProperties = {
    fontSize: `${0.95 * visualScaleFactor}em`, letterSpacing: `${0.5 * visualScaleFactor}px`
  };

  const textAreaHeightRatio = 0.60; // Altura da área de texto como 60% da altura da carta
  const calculatedTextAreaHeight = targetHeight * textAreaHeightRatio;

  const textAreaDynamicStyle: React.CSSProperties = {
    height: `${Math.max(20 * visualScaleFactor, calculatedTextAreaHeight)}px`,
    width: '100%',
    boxSizing: 'border-box',
    paddingTop: `${5 * visualScaleFactor}px`,
    paddingBottom: `${5 * visualScaleFactor}px`,
    paddingLeft: `${targetWidth * 0.08}px`,
    paddingRight: `${targetWidth * 0.08}px`,
  };

  const textContentFinalStyle: React.CSSProperties = { fontSize: `${currentFontSize}px` };

  const hotButtonDynamicStyle: React.CSSProperties = onToggleHot ? {
    position: 'absolute', top: cornerOffsetFromPaddedEdge, right: cornerOffsetFromPaddedEdge,
    fontSize: `${1.8 * visualScaleFactor}em`,
    color: data.isHot ? '#ff6b6b' : '#888888',
    filter: data.isHot ? 'drop-shadow(0 0 3px #ff6b6b)' : 'grayscale(100%)',
    opacity: data.isHot ? 1 : 0.6, zIndex: 2,
  } : {};

  const handleOuterTransitionEnd = () => {
    if (exitDirection && onAnimationComplete) onAnimationComplete();
  };

  const displayIntensity = typeof data.intensity === 'number' && !isNaN(data.intensity) ? data.intensity : '-';
  const displayCategoryName = data.category.charAt(0).toUpperCase() + data.category.slice(1).toLowerCase();

  return (
    <div
      style={flipperContainerDynamicStyle}
      className={styles.flipperContainer}
      onTransitionEnd={handleOuterTransitionEnd}
      onClick={onClick}
    >
      <div
        className={styles.flipper}
        style={{ transform: flipperDynamicTransform, transition: flipperDynamicTransition }}
      >
        <div style={cardFrontFaceDynamicInlineStyle} className={styles.cardFront}>
          {dragVisuals && dragVisuals.active && dragVisuals.dir !== 0 && (
            <div className={styles.swipeFeedbackOverlay} style={swipeFeedbackOverlayDynamicStyle}>
              {dragVisuals.dir > 0 ? 'Topo!' : 'Passo'}
            </div>
          )}

          <div className={styles.corner} style={dynamicTopLeftCornerStyle}>
            <span className={styles.cornerNumber} style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span className={styles.cornerSuit} style={dynamicCornerSuitStyle}>{displayCategoryName}</span>
          </div>
          <div className={styles.corner} style={dynamicBottomRightCornerStyle}>
            <span className={styles.cornerNumber} style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span className={styles.cornerSuit} style={dynamicCornerSuitStyle}>{displayCategoryName}</span>
          </div>

          <div ref={textAreaRef} className={styles.textArea} style={textAreaDynamicStyle}>
            <p ref={textContentRef} className={styles.textContent} style={textContentFinalStyle}>
              {data.text}
            </p>
          </div>

          {onToggleHot && (
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { // Adicionado tipo de evento
                e.stopPropagation(); 
                onToggleHot(data.id, e); // Passa o evento
              }}
              className={styles.hotButton}
              style={hotButtonDynamicStyle}
              aria-label={data.isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
              title={data.isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
            >
              🔥
            </button>
          )}
        </div>

        <div style={cardBackFaceDynamicInlineStyle} className={styles.cardBack}>
          {/* Logo nas costas da carta */}
          <img
            src="/kinklogo512.png" // <<< ALTERADO AQUI
            alt="KinkLink Logo"
            className={styles.cardBackLogo}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayingCard;
