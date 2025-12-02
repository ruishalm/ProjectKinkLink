// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\PlayingCard.tsx
import React, { useEffect, useRef, useState } from 'react';
import styles from './PlayingCard.module.css';

export interface CardData {
  id: string;
  text: string;
  category: string;
  intensity?: number;
  isHot?: boolean;
  creatorId?: string;
  isCreatorSuggestion?: boolean;
  isCompleted?: boolean;
}

interface PlayingCardProps {
  data: CardData;
  targetWidth?: number;
  targetHeight?: number;
  onToggleHot?: (cardId: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  exitDirection?: 'left' | 'right' | null;
  onAnimationComplete?: () => void;
  isFlipped?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  dragVisuals?: {
    x: number;
    active: boolean;
    dir: number;
  };
  currentUserId?: string;
}

// Função para determinar o estilo da carta com base na sua categoria.
const getCategoryStyles = (category: string): { backgroundColor: string; color: string; borderColor: string } => {
  switch (category.toLowerCase()) {
    case 'sensorial': return { backgroundColor: '#FFD700', color: '#4A3B00', borderColor: '#B8860B' };
    case 'poder': return { backgroundColor: '#E53935', color: '#FFFFFF', borderColor: '#B71C1C' };
    case 'fantasia': return { backgroundColor: '#5E35B1', color: '#FFFFFF', borderColor: '#311B92' };
    case 'exposicao': return { backgroundColor: '#43A047', color: '#FFFFFF', borderColor: '#1B5E20' };
    case 'conexao': return { backgroundColor: '#FFFFFF', color: '#333333', borderColor: '#696969' };
    case 'usercard': return { backgroundColor: '#0b5351', color: '#FFFFFF', borderColor: '#073e3c' };
    default: return { backgroundColor: '#ECEFF1', color: '#263238', borderColor: '#B0BEC5' };
  }
};

/**
 * Componente que renderiza a face de uma carta de jogo.
 * É responsável por sua aparência, animações (flip, swipe), e ajuste dinâmico de fontes.
 */
const PlayingCard: React.FC<PlayingCardProps> = ({
  data,
  targetWidth = 250,
  targetHeight = 350,
  onToggleHot,
  exitDirection,
  onAnimationComplete,
  isFlipped,
  onClick,
  dragVisuals,
  currentUserId
}) => {
  const textContentRef = useRef<HTMLParagraphElement>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const [currentFontSize, setCurrentFontSize] = useState(16);

  const visualScaleFactor = targetWidth / 250; // Fator de escala para UI responsiva.

  // Efeito para ajustar dinamicamente o tamanho da fonte do texto principal
  // para que ele caiba perfeitamente na área designada da carta.
  useEffect(() => {
    if (textContentRef.current && textAreaRef.current && !isFlipped) {
      const textElement = textContentRef.current;
      const container = textAreaRef.current;
      let bestFitSize = 8 * visualScaleFactor;
      const maxTestSize = 19 * visualScaleFactor;

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

  // --- Lógica de Estilos e Animações Dinâmicas ---

  // Animação de saída da carta (swipe)
  let exitMotionTransform = '';
  if (exitDirection === 'left') exitMotionTransform = `translateX(-150%) rotateZ(-15deg)`;
  else if (exitDirection === 'right') exitMotionTransform = `translateX(150%) rotateZ(15deg)`;

  // Rotação da carta durante o arrasto
  let dragRotationTransform = '';
  if (dragVisuals && dragVisuals.active) {
    const rotation = Math.max(-10, Math.min(10, dragVisuals.x * 0.05));
    dragRotationTransform = `rotateZ(${rotation}deg)`;
  }

  // Combina as transformações de flip, arrasto e saída.
  const flipperDynamicTransform = [
    isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    dragRotationTransform,
    exitMotionTransform
  ].filter(Boolean).join(' ').trim();

  const flipperDynamicTransition = exitDirection
    ? `transform 0.5s ease-out`
    : (dragVisuals && dragVisuals.active ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)');

  // Estilos responsivos para o container da carta.
  const flipperContainerDynamicStyle: React.CSSProperties = {
    width: `${targetWidth}px`, height: `${targetHeight}px`, opacity: exitDirection ? 0 : 1,
  };
  
  // Estilos responsivos para as faces da carta (frente e verso).
  const cardFaceBaseDynamicStyle: React.CSSProperties = {
    borderRadius: `${12 * visualScaleFactor}px`,
    padding: `${15 * visualScaleFactor}px`,
    boxShadow: `0 ${Math.max(1, 4 * visualScaleFactor)}px ${Math.max(1, 8 * visualScaleFactor)}px rgba(0,0,0,0.1)`,
    border: `${Math.max(1, 8 * visualScaleFactor)}px solid`,
  };
  const cardFrontFaceDynamicInlineStyle: React.CSSProperties = {
    ...cardFaceBaseDynamicStyle,
    backgroundColor: categoryStyles.backgroundColor,
    color: categoryStyles.color,
    borderColor: categoryStyles.borderColor,
  };
  const cardBackFaceDynamicInlineStyle: React.CSSProperties = {
    ...cardFaceBaseDynamicStyle,
    backgroundColor: '#1a1a1a',
    borderColor: '#b71c1c',
  };

  // Estilo para o overlay de feedback ("Topo!"/"Passo") durante o arrasto.
  const swipeFeedbackOverlayDynamicStyle: React.CSSProperties = dragVisuals && dragVisuals.active && dragVisuals.dir !== 0 ? {
    opacity: Math.min(Math.abs(dragVisuals.x) / (targetWidth * 0.3), 0.9),
    // ... outros estilos para posicionamento e aparência
  } : {};

  // Estilos para os cantos da carta (intensidade e categoria).
  const cornerOffsetFromPaddedEdge = 5 * visualScaleFactor;
  const dynamicTopLeftCornerStyle: React.CSSProperties = { top: cornerOffsetFromPaddedEdge, left: cornerOffsetFromPaddedEdge };
  const dynamicBottomRightCornerStyle: React.CSSProperties = { bottom: cornerOffsetFromPaddedEdge, right: cornerOffsetFromPaddedEdge };
  const dynamicCornerNumberStyle: React.CSSProperties = { fontSize: `${2.5 * visualScaleFactor}em` };
  const dynamicCornerSuitStyle: React.CSSProperties = { fontSize: `${0.95 * visualScaleFactor}em` };

  // Estilos para a área de texto principal.
  const textAreaDynamicStyle: React.CSSProperties = {
    height: `${Math.max(20 * visualScaleFactor, targetHeight * 0.60)}px`,
    // ... outros estilos para padding
  };

  const handleOuterTransitionEnd = () => {
    if (exitDirection && onAnimationComplete) onAnimationComplete();
  };

  const displayIntensity = typeof data.intensity === 'number' ? data.intensity : '-';
  const displayCategoryName = data.category.charAt(0).toUpperCase() + data.category.slice(1).toLowerCase();

  // Condição para exibir o aviso de "Sugestão do Par".
  const showPartnerSuggestionNotice =
    data.category?.toLowerCase().includes('usercard') &&
    data.isCreatorSuggestion &&
    data.creatorId &&
    currentUserId &&
    data.creatorId !== currentUserId;

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
        {/* Face da Frente da Carta */}
        <div style={cardFrontFaceDynamicInlineStyle} className={styles.cardFront}>
          {dragVisuals?.active && dragVisuals.dir !== 0 && (
            <div className={styles.swipeFeedbackOverlay} style={swipeFeedbackOverlayDynamicStyle}>
              {dragVisuals.dir > 0 ? 'Topo!' : 'Passo'}
            </div>
          )}

          {showPartnerSuggestionNotice && (
            <div className={styles.partnerSuggestionNotice} style={{ fontSize: `${0.7 * visualScaleFactor}em`}}>
              💌 Sugestão do Par!
            </div>
          )}

          {/* Cantos da Carta */}
          <div className={styles.corner} style={dynamicTopLeftCornerStyle}>
            <span className={styles.cornerNumber} style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span className={styles.cornerSuit} style={dynamicCornerSuitStyle}>{displayCategoryName}</span>
          </div>
          <div className={styles.corner} style={{...dynamicBottomRightCornerStyle, transform: 'rotate(180deg)'}}>
            <span className={styles.cornerNumber} style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span className={styles.cornerSuit} style={dynamicCornerSuitStyle}>{displayCategoryName}</span>
          </div>

          {/* Área de Texto Principal */}
          <div ref={textAreaRef} className={styles.textArea} style={textAreaDynamicStyle}>
            <p ref={textContentRef} className={styles.textContent} style={{ fontSize: `${currentFontSize}px` }}>
              {data.text}
            </p>
          </div>

          {/* Botão de Favoritar (Hot) */}
          {onToggleHot && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHot(data.id, e); }}
              className={styles.hotButton}
              style={{
                fontSize: `${1.8 * visualScaleFactor}em`,
                color: data.isHot ? '#ff6b6b' : '#888888',
                filter: data.isHot ? 'drop-shadow(0 0 3px #ff6b6b)' : 'grayscale(100%)',
              }}
              aria-label={data.isHot ? "Remover dos Top Links" : "Adicionar aos Top Links"}
            >
              🔥
            </button>
          )}
        </div>

        {/* Face de Trás da Carta */}
        <div style={cardBackFaceDynamicInlineStyle} className={styles.cardBack}>
          <img
            src="/kinklogo512.png"
            alt="KinkLink Logo"
            className={styles.cardBackLogo}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayingCard;
