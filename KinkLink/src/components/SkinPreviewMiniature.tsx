// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\SkinPreviewMiniature.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ActiveSkinSettings } from '../contexts/SkinContext';
import styles from './SkinPreviewMiniature.module.css';
import { defaultPalette } from '../contexts/SkinContext';

export interface SkinPreviewMiniatureProps {
  settings: ActiveSkinSettings;
}

const SkinPreviewMiniature: React.FC<SkinPreviewMiniatureProps> = ({ settings }) => {
  const { t } = useTranslation();
  // Helper para verificar se uma string é uma URL de imagem provável
  const isImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url) || url.startsWith('data:image') || url.startsWith('/');
  };

  const skinColors = settings.colorPaletteColors;

  const isDefaultSkin = settings.colorPalette === 'default-dark';

  // Cores para o Logo na miniatura (sempre usa a paleta)
  const actualLogoBgColor = isDefaultSkin
    ? '#4CAF50' // Verde para Logo no skin padrão
    : (skinColors && skinColors.length > 1 && skinColors[1] ? skinColors[1] : (defaultPalette[1] || '#6A0DAD')); // p[1] para outros skins
  const actualLogoTextColor = isDefaultSkin
    ? '#FFFFFF' // Branco para texto no Logo no skin padrão
    : (skinColors && skinColors.length > 6 && skinColors[6] ? skinColors[6] : (defaultPalette[6] || '#FFFFFF')); // p[6] para outros skins

  // Cores base da paleta para os botões, usadas se buttonStyleClass não estiver presente.
  const paletteForPrimaryButtonBg = actualLogoBgColor; // "BOTAO" usa a cor primária da paleta por padrão
  const paletteForPrimaryButtonText = actualLogoTextColor;
  const paletteForSecondaryButtonBg = isDefaultSkin // "Apoio" usa a cor secundária da paleta por padrão
    ? '#F44336' // Vermelho para Apoio no skin padrão
    : (skinColors && skinColors.length > 3 && skinColors[3] ? skinColors[3] : (defaultPalette[3] || '#5C5C5C')); // p[3] para outros skins
  const paletteForSecondaryButtonText = actualLogoTextColor; // Usando a mesma cor de texto do logo para consistência em botões secundários

  // Determina as cores efetivas para as variáveis CSS dos botões
  const varPreviewButtonBg = settings.buttonStyleClass ? 'unset' : paletteForPrimaryButtonBg;
  const varPreviewButtonText = settings.buttonStyleClass ? 'unset' : paletteForPrimaryButtonText;
  const varPreviewButtonBorder = settings.buttonStyleClass ? 'unset' : `color-mix(in srgb, ${paletteForPrimaryButtonBg} 70%, black)`;

  const varPreviewSecondaryActionBg = settings.buttonStyleClass ? 'unset' : paletteForSecondaryButtonBg;
  const varPreviewTextOnSecondaryAction = settings.buttonStyleClass ? 'unset' : paletteForSecondaryButtonText;

  // Fallback para a cor do texto principal da miniatura
  const miniatureTextColor = (skinColors && skinColors.length > 0 && skinColors[0]) ? skinColors[0] : (defaultPalette[0] || '#CCCCCC');

  const miniatureStyle: React.CSSProperties = {
    '--preview-font-family': settings.fontFamily || 'Arial, sans-serif',
    '--preview-text-color': miniatureTextColor,
    '--preview-border-color': (skinColors && skinColors.length > 3 && skinColors[3]) ? skinColors[3] : (defaultPalette[3] || '#444444'), // Borda da miniatura

    '--preview-header-bg': (skinColors && skinColors.length > 2 && skinColors[2]) ? skinColors[2] : (defaultPalette[2] || '#1E1E1E'),
    '--preview-header-border': (skinColors && skinColors.length > 3 && skinColors[3]) ? skinColors[3] : (defaultPalette[3] || '#3F3F3F'),

    // O logo na miniatura sempre usa as cores da paleta diretamente
    '--preview-primary-action-bg': actualLogoBgColor,
    '--preview-text-on-primary-action': actualLogoTextColor,

    // Variáveis para o botão "Apoio" (.miniSupportButton)
    '--preview-secondary-action-bg': varPreviewSecondaryActionBg,
    '--preview-text-on-secondary-action': varPreviewTextOnSecondaryAction,

    '--preview-content-bg': (skinColors && skinColors.length > 5 && skinColors[5]) ? skinColors[5] : (defaultPalette[5] || '#252525'),

    '--preview-card-face-bg': (skinColors && skinColors.length > 6 && skinColors[6]) ? skinColors[6] : (defaultPalette[6] || '#FFFFFF'),
    '--preview-card-border': (skinColors && skinColors.length > 3 && skinColors[3]) ? skinColors[3] : (defaultPalette[3] || '#CCCCCC'),
    '--preview-card-face-text': miniatureTextColor, // Usa a cor de texto principal da miniatura
    '--preview-card-back-bg': actualLogoBgColor, // Verso da carta usa a mesma cor do logo
    '--preview-card-back-border': `color-mix(in srgb, ${actualLogoBgColor} 80%, black)`,
    '--preview-card-back-pattern': actualLogoTextColor,

    // Variáveis para o botão "BOTAO" (.miniActionButton)
    '--preview-button-bg': varPreviewButtonBg,
    '--preview-button-text': varPreviewButtonText,
    '--preview-button-border': varPreviewButtonBorder,

  } as React.CSSProperties;

  const pileBgStyle: React.CSSProperties = isImageUrl(settings.backgroundPileUrl)
    ? { backgroundImage: `url("${settings.backgroundPileUrl}")` }
    : { backgroundColor: settings.backgroundPileUrl || 'transparent' };

  const matchesBgStyle: React.CSSProperties = isImageUrl(settings.backgroundMatchesUrl)
    ? { backgroundImage: `url("${settings.backgroundMatchesUrl}")` }
    : { backgroundColor: settings.backgroundMatchesUrl || 'transparent' };

  return (
    <div className={styles.miniatureContainer} style={miniatureStyle}>
      {/* Fundos Divididos */}
      <div className={styles.backgroundTopHalf} style={pileBgStyle} title={`Fundo Pilha: ${settings.backgroundPileUrl || 'Padrão'}`}></div>
      <div className={styles.backgroundBottomHalf} style={matchesBgStyle} title={`Fundo Links: ${settings.backgroundMatchesUrl || 'Padrão'}`}></div>

      <div className={styles.miniHeader}>
        <div className={styles.miniLogo}>
          <img src="/kinklogo.png" alt="Logo" className={styles.miniLogoImage} />
        </div>
        <div className={`${styles.miniSupportButton} ${settings.buttonStyleClass || ''}`}>
          {t('skin_preview_support')}
        </div>
      </div>

      <div className={styles.miniContentArea}>
        <div className={styles.miniCardsArea}>
          <div className={`${styles.miniCard} ${styles.faceUpCard}`}>♦</div> {/* Símbolo de naipe para a frente */}
          <div className={`${styles.miniCard} ${styles.faceDownCard}`}><img src="/kinklogo.png" alt="Card Back" className={styles.miniCardBackLogo} /></div>
        </div>

        {/* Botão de demonstração de estilo */}
        <div className={styles.miniButtonStylePreviewContainer}>
          <div className={`${styles.miniActionButton} ${settings.buttonStyleClass || ''}`}>
            {t('skin_preview_button')}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SkinPreviewMiniature;
 