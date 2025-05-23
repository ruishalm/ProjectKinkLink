// d:\Projetos\Github\app\KinkLink\KinkLink\src\components\PlayingCard.tsx
import React, { useEffect, useRef, useState, type CSSProperties } from 'react';

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
}

// Estilos base para o container que lida com opacidade de saída e perspectiva
const getFlipperContainerBaseStyle = (targetWidth?: number, targetHeight?: number): CSSProperties => ({
  width: targetWidth ? `${targetWidth}px` : '250px',
  height: targetHeight ? `${targetHeight}px` : '350px',
  transformOrigin: 'center',
  position: 'relative',
  transition: 'opacity 0.5s ease-out, transform 0.5s ease-out', // 'transform' aqui é para o exitDirection
  overflow: 'hidden',
});

// Estilos para o container interno que faz o flip
const flipperStyleBase: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  transformStyle: 'preserve-3d',
  transition: 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)', // Transição para o flip
};

// Estilos base que não dependem da escala dinâmica inicialmente
const cornerStyleBase: CSSProperties = {
  position: 'absolute',
  textAlign: 'center',
  lineHeight: '1',
  fontWeight: 'bold',
};

const getCategoryStyles = (category: string): { backgroundColor: string; color: string; borderColor: string } => {
  switch (category.toLowerCase()) {
    case 'sensorial': return { backgroundColor: '#FFD700', color: '#4A3B00', borderColor: '#B8860B' };
    case 'poder': return { backgroundColor: '#E53935', color: '#FFFFFF', borderColor: '#B71C1C' };
    case 'fantasia': return { backgroundColor: '#5E35B1', color: '#FFFFFF', borderColor: '#311B92' };
    case 'exposicao': return { backgroundColor: '#43A047', color: '#FFFFFF', borderColor: '#1B5E20' };
    case 'conexao': return { backgroundColor: '#FFFFFF', color: '#333333', borderColor: '#696969' };
    default: return { backgroundColor: '#ECEFF1', color: '#263238', borderColor: '#B0BEC5' };
  }
};

const cardBackDiagonalTextStyle: CSSProperties = {
  position: 'absolute', fontSize: '2.8em', fontWeight: 'bold',
  color: '#e53935', opacity: 0.8, transform: 'rotate(-45deg)',
  whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none',
};
const cardBackDiagonalLinesStyle: CSSProperties = {
  position: 'absolute', width: '200%', height: '200%',
  background: 'repeating-linear-gradient(-45deg, #e53935, #e53935 5px, #1a1a1a 5px, #1a1a1a 15px)',
  opacity: 0.1, transform: 'translate(-25%, -25%) rotate(-45deg)',
  userSelect: 'none', pointerEvents: 'none',
};

const PlayingCard: React.FC<PlayingCardProps> = ({
  data, targetWidth, targetHeight, onToggleHot, exitDirection, onAnimationComplete, isFlipped, onClick
}) => {
  const textContentRef = useRef<HTMLParagraphElement>(null);
  const textAreaRef = useRef<HTMLDivElement>(null);
  const [currentFontSize, setCurrentFontSize] = useState(16);

  // Calcular um fator de escala visual para os elementos internos
  const baseCardWidthForScaling = 250; // Largura base para a qual os valores fixos foram desenhados
  const visualScaleFactor = targetWidth ? targetWidth / baseCardWidthForScaling : 1;

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
  }, [data.text, targetWidth, targetHeight, visualScaleFactor]);

  const categoryStyles = getCategoryStyles(data.category);
  const flipperContainerEffectiveStyle = getFlipperContainerBaseStyle(targetWidth, targetHeight);

  let exitMotionTransform = '';
  if (exitDirection === 'left') {
    exitMotionTransform = `translateX(-150%) rotateZ(-15deg)`;
  } else if (exitDirection === 'right') {
    exitMotionTransform = `translateX(150%) rotateZ(15deg)`;
  }
  const flipTransformValue = isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
  
  const flipperDynamicTransform = [flipTransformValue, exitMotionTransform].filter(Boolean).join(' ').trim() || 'none';
  const flipperDynamicTransition = exitMotionTransform 
    ? `transform 0.5s ease-out, ${flipperStyleBase.transition}` // Combina transições
    : (flipperStyleBase.transition as string);


  const flipperContainerDynamicStyle: CSSProperties = {
    ...flipperContainerEffectiveStyle,
    opacity: exitDirection ? 0 : 1,
    perspective: '1000px',
    // A transformação de saída (translateX/rotateZ) é aplicada ao flipper interno
    // para que a perspectiva do flip não seja afetada pelo movimento de saída.
    // No entanto, a transição de opacity e a transição de transform (para o exit)
    // estão no container externo. O flipper interno só transiciona o rotateY.
    // Se o exitMotionTransform for aplicado aqui, a transição de opacity pode não sincronizar bem.
    // Vamos manter o exitMotionTransform no flipper interno.
  };

  // --- Estilos Dinâmicos Baseados na Escala ---
  const dynamicCardFacePadding = `${15 * visualScaleFactor}px`;
  const dynamicCardBorderWidth = `${Math.max(1, 8 * visualScaleFactor)}px`;
  const dynamicCardBorderRadius = `${12 * visualScaleFactor}px`;

  const cardFaceBaseStyleDynamic: CSSProperties = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: dynamicCardBorderRadius,
    padding: dynamicCardFacePadding,
    display: 'flex', flexDirection: 'column',
    boxShadow: `0 ${Math.max(1, 4 * visualScaleFactor)}px ${Math.max(1, 8 * visualScaleFactor)}px rgba(0,0,0,0.1)`,
    boxSizing: 'border-box',
    fontFamily: '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif',
    color: '#333',
    overflow: 'hidden',
    border: `${dynamicCardBorderWidth} solid`,
  };

  const dynamicCornerOffset = `${10 * visualScaleFactor}px`;
  const dynamicTopLeftCornerStyle: CSSProperties = { ...cornerStyleBase, top: dynamicCornerOffset, left: dynamicCornerOffset };
  const dynamicBottomRightCornerStyle: CSSProperties = { ...cornerStyleBase, bottom: dynamicCornerOffset, right: dynamicCornerOffset, transform: 'rotate(180deg)' };
  const dynamicCornerNumberStyle: CSSProperties = { fontSize: `${2.5 * visualScaleFactor}em`, display: 'block' };
  const dynamicCornerSuitStyle: CSSProperties = { fontSize: `${0.95 * visualScaleFactor}em`, textTransform: 'uppercase', letterSpacing: `${0.5 * visualScaleFactor}px` };

  const dynamicTextAreaMargin = `${10 * visualScaleFactor}px 0`;
  const textAreaStyleDynamic: CSSProperties = {
    flexGrow: 1, width: '100%', overflow: 'hidden', display: 'flex',
    alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    margin: dynamicTextAreaMargin,
  };

  const cardFrontFaceDynamicStyle: CSSProperties = {
    ...cardFaceBaseStyleDynamic,
    backgroundColor: categoryStyles.backgroundColor,
    color: categoryStyles.color,
    borderColor: categoryStyles.borderColor,
  };

  const cardBackFaceStyleConfigDynamic: CSSProperties = {
    ...cardFaceBaseStyleDynamic,
    backgroundColor: '#1a1a1a',
    borderColor: '#b71c1c',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotateY(180deg)',
  };
  
  const handleOuterTransitionEnd = () => {
    if (exitDirection && onAnimationComplete) {
      onAnimationComplete();
    }
  };
  
  const displayIntensity = typeof data.intensity === 'number' && !isNaN(data.intensity) ? data.intensity : '-';
  const categoryAbbreviation = data.category.substring(0, 3).toUpperCase();
  const textContentFinalStyle: CSSProperties = { margin: 0, fontSize: `${currentFontSize}px`, lineHeight: '1.4' };

  return (
    <div 
      style={flipperContainerDynamicStyle} 
      className="playing-card-flipper-container" 
      onTransitionEnd={handleOuterTransitionEnd}
      onClick={onClick}
    >
      <div
        className="playing-card-flipper"
        style={{
          ...flipperStyleBase,
          transform: flipperDynamicTransform, // Contém o flip e o exit motion
          transition: flipperDynamicTransition, // Controla a transição para flip e/ou exit
        }}
      >
        {/* Frente da Carta */}
        <div style={cardFrontFaceDynamicStyle} className="card-face card-front">
          <div style={{ ...dynamicTopLeftCornerStyle, color: categoryStyles.color }}>
            <span style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span style={dynamicCornerSuitStyle}>{categoryAbbreviation}</span>
          </div>
          <div style={{ ...dynamicBottomRightCornerStyle, color: categoryStyles.color }}>
            <span style={dynamicCornerNumberStyle}>{displayIntensity}</span>
            <span style={dynamicCornerSuitStyle}>{categoryAbbreviation}</span>
          </div>
          <div ref={textAreaRef} style={textAreaStyleDynamic} className="card-text-area">
            <p ref={textContentRef} style={textContentFinalStyle} className="card-text-content">
              {data.text}
            </p>
          </div>
          {onToggleHot && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHot(data.id); }}
              style={{
                position: 'absolute', 
                top: dynamicCardFacePadding, // Usa o padding dinâmico para posicionamento
                right: dynamicCardFacePadding, // Usa o padding dinâmico para posicionamento
                background: 'transparent',
                border: 'none', 
                fontSize: `${1.8 * visualScaleFactor}em`, // Escala o tamanho do ícone
                cursor: 'pointer', 
                padding: '0',
                lineHeight: '1', 
                color: data.isHot ? '#ff6b6b' : '#888888',
                filter: data.isHot ? 'drop-shadow(0 0 3px #ff6b6b)' : 'grayscale(100%)',
                opacity: data.isHot ? 1 : 0.6,
              }}
              aria-label={data.isHot ? "Remover dos Top Matches" : "Adicionar aos Top Matches"}
              title={data.isHot ? "Remover dos Top Matches" : "Adicionar aos Top Matches"}
            >
              🔥
            </button>
          )}
        </div>

        {/* Verso da Carta */}
        <div style={cardBackFaceStyleConfigDynamic} className="card-face card-back">
          <div style={cardBackDiagonalLinesStyle}></div>
          <div style={cardBackDiagonalTextStyle}>
            Kink 🔗 Link
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayingCard;
