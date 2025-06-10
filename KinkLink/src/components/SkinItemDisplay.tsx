// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\SkinItemDisplay.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { SkinDefinition } from '../config/skins';
import styles from './SkinItemDisplay.module.css'; // Usaremos um novo CSS Module para ele

interface SkinItemDisplayProps {
  skin: SkinDefinition;
  skinType: SkinDefinition['type']; // Necessário para handleActivateSkin
  isActive: boolean;
  isEffectivelyUnlocked: boolean;
  isForceUnlocked: boolean;
  isNaturallyUnlocked: boolean; // Para a lógica do forceUnlockedHighlight
  onActivate: (skinType: SkinDefinition['type'], skinId: string, isUnlocked: boolean) => void;
  onForceUnlock: (e: React.MouseEvent<HTMLDivElement>, skinId: string, isCurrentlyUnlocked: boolean) => void;
  // onMouseEnter: (skin: SkinDefinition) => void; // Removido, não mais usado
}

const SkinItemDisplay: React.FC<SkinItemDisplayProps> = ({
  skin,
  skinType,
  isActive,
  isEffectivelyUnlocked,
  isForceUnlocked,
  isNaturallyUnlocked,
  onActivate,
  onForceUnlock,
  // onMouseEnter, // Removido
}) => {
  const { t } = useTranslation();
  const unlockDescription = skin.unlockCriteria?.description;

  const handleToggleChange = () => {
    if (isEffectivelyUnlocked) {
      onActivate(skinType, skin.id, isEffectivelyUnlocked);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Permite o force unlock clicando no card, mas não se o clique foi no toggle
    if (!(e.target as HTMLElement).closest(`.${styles.activateButton}`)) {
      onForceUnlock(e, skin.id, isEffectivelyUnlocked);
    }
  };

  const getToggleTitle = () => {
    if (!isEffectivelyUnlocked) {
      return unlockDescription || t('skinsPage.lockedIconLabel');
    }
    return isActive ? t('skinsPage.deactivateSkinTitle', { skinName: skin.name }) : t('skinsPage.activateSkinTitle', { skinName: skin.name });
  };

  const getToggleAriaLabel = () => {
    if (!isEffectivelyUnlocked) {
      return t('skinsPage.lockedSkinAriaLabelWithName', { skinName: skin.name, unlockStatus: unlockDescription || t('skinsPage.lockedStatusDefault') });
    }
    return isActive ? t('skinsPage.deactivateSkinAriaLabel', { skinName: skin.name }) : t('skinsPage.activateSkinAriaLabel', { skinName: skin.name });
  };

  return (
    <div
      // key={skin.id} // A key principal deve estar no elemento mapeado em SkinsPage.tsx
      className={`${styles.skinItem} ${isActive ? styles.activeSkin : ''} ${!isEffectivelyUnlocked ? styles.lockedSkin : ''} ${isForceUnlocked && !isNaturallyUnlocked ? styles.forceUnlockedHighlight : ''}`}
      onClick={handleCardClick}
      // onMouseEnter={() => onMouseEnter(skin)} // Removido
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-disabled={!isEffectivelyUnlocked}
    >
      <h3 className={styles.skinName}>{skin.name}</h3>
      {!isEffectivelyUnlocked && <span className={styles.lockedIcon} title={unlockDescription || t('skinsPage.lockedIconLabel')}>🔒</span>}

      {/* Previews específicos por tipo */}
      {skin.type === 'colorPalette' && Array.isArray(skin.preview) && (
        <div className={styles.palettePreview}>
          {skin.preview.slice(0, 5).map((color, index) => (
            <div key={index} className={styles.colorSwatch} style={{ backgroundColor: color }} title={color}></div>
          ))}
        </div>
      )}
      {(skin.type === 'backgroundPile' || skin.type === 'backgroundMatches') && typeof skin.preview === 'string' && (
        <img src={skin.preview} alt={skin.name} className={styles.texturePreview} />
      )}
      {skin.type === 'font' && typeof skin.preview === 'string' && (
        <p className={styles.fontPreview} style={{ fontFamily: skin.preview }}>Aa Bb Cc</p>
      )}
      {/* Para buttonStyle e themePack, o nome é o preview principal. A miniatura na SkinsPage mostrará o efeito. */}

      {skin.description && <p className={styles.skinDescription}>{skin.description}</p>}
      {!isEffectivelyUnlocked && unlockDescription && (
        <p className={styles.unlockHint}>{unlockDescription}</p>
      )}
      {/* Toggle Switch */}
      <label
        className={styles.activateButton}
        onClick={(e) => e.stopPropagation()} // Impede que o clique no label acione o onForceUnlock do card
        title={getToggleTitle()}
      >
        <input
          type="checkbox"
          checked={isActive && isEffectivelyUnlocked}
          disabled={!isEffectivelyUnlocked}
          onChange={handleToggleChange}
          aria-label={getToggleAriaLabel()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && isEffectivelyUnlocked) {
              e.preventDefault();
              handleToggleChange();
            }
          }}
        />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
};

export default SkinItemDisplay;