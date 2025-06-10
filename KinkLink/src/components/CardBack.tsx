// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\CardBack.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './CardBack.module.css'; // Importa os CSS Modules

interface CardBackProps {
  targetWidth?: number;
  targetHeight?: number;
}

const CardBack: React.FC<CardBackProps> = ({
  targetWidth = 250, // Valor padrão se não for fornecido
  targetHeight = 350, // Valor padrão se não for fornecido
}) => {
  const { t } = useTranslation();
  const baseCardWidthForScaling = 250; // Mesmo valor usado em PlayingCard.tsx
  const visualScaleFactor = targetWidth / baseCardWidthForScaling;

  const dynamicBorderWidth = `${Math.max(1, 8 * visualScaleFactor)}px`;
  const dynamicBorderRadius = `${12 * visualScaleFactor}px`;

  const dynamicStyle: React.CSSProperties = {
    width: `${targetWidth}px`,
    height: `${targetHeight}px`,
    border: `${dynamicBorderWidth} solid #b71c1c`, // Borda dinâmica (cor de exemplo)
    borderRadius: dynamicBorderRadius, // Raio dinâmico
  };

  // O background-color e outros estilos base virão do CardBack.module.css

  return (
    <div className={styles.cardBack} style={dynamicStyle}>
      {/* Logo nas costas da carta */}
      <img
        src="/kinklogo512.png" // Alterado para o logo de 512px
        alt={t('cardBack.logoAlt')}
        className={styles.cardBackLogo} // Usaremos esta classe para estilizar
      />
    </div>
  );
};

export default CardBack;
