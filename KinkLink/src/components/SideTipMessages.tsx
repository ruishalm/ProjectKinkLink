// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\SideTipMessages.tsx
import React, { useState, useEffect } from 'react';
import styles from './SideTipMessages.module.css';

interface SideTipMessagesProps {
  leftMessage: string | null;
  rightMessage: string | null;
  animateIn: boolean;
  cardWidth: number; // Largura da carta atual para cálculo de posicionamento
}

const SideTipMessages: React.FC<SideTipMessagesProps> = ({
  leftMessage,
  rightMessage,
  animateIn,
  cardWidth,
}) => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)'); // Breakpoint para "tela pequena"
    
    const handleResize = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsSmallScreen(event.matches);
    };

    // Verifica o estado inicial
    handleResize(mediaQuery);

    // Adiciona listener para mudanças
    // Nota: addEventListener/removeEventListener pode não ser o ideal para MediaQueryList em todos os navegadores/versões antigas
    // mas para navegadores modernos é o padrão. Alternativamente, mediaQuery.addListener/removeListener.
    try {
        mediaQuery.addEventListener('change', handleResize);
    } catch { // Fallback para navegadores mais antigos
        mediaQuery.addListener(handleResize);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleResize);
      } catch { // Fallback
        mediaQuery.removeListener(handleResize);
      }
    };
  }, []);

  const animationClass = animateIn ? styles.animateIn : '';

  // Max width of the tip container from CSS (e.g., 160px for desktop, 120px for mobile)
  const tipContainerMaxWidth = isSmallScreen ? 120 : 160;
  const tipContainerHalfWidth = tipContainerMaxWidth / 2;
  const cardEdgeFromParentSide = `calc(50% - ${cardWidth / 2}px)`;

  // Aplicar estilos de posicionamento horizontal apenas se não for tela pequena
  const dynamicLeftStyle: React.CSSProperties = !isSmallScreen ? { left: `calc(${cardEdgeFromParentSide} - ${tipContainerHalfWidth}px)` } : {};
  const dynamicRightStyle: React.CSSProperties = !isSmallScreen ? { right: `calc(${cardEdgeFromParentSide} - ${tipContainerHalfWidth}px)` } : {};

  return (
    <>
      {leftMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.left} ${animationClass}`} style={dynamicLeftStyle}>
          <div className={styles.tipMessage}>
            {leftMessage}
          </div>
        </div>
      )}
      {rightMessage && (
        <div className={`${styles.sideMessagesContainer} ${styles.right} ${animationClass}`} style={dynamicRightStyle}>
          <div className={styles.tipMessage}>
            {rightMessage}
          </div>
        </div>
      )}
    </>
  );
};
export default SideTipMessages;