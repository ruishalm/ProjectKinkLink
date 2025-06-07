// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\UnlockNotificationModal.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './UnlockNotificationModal.module.css';

const UnlockNotificationModal: React.FC = () => {
  const { newlyUnlockedSkinsForModal, clearNewlyUnlockedSkinsForModal } = useAuth();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearNewlyUnlockedSkinsForModal();
      }
    };

    if (newlyUnlockedSkinsForModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [newlyUnlockedSkinsForModal, clearNewlyUnlockedSkinsForModal]);

  if (!newlyUnlockedSkinsForModal || newlyUnlockedSkinsForModal.length === 0) {
    return null;
  }

  return (
    <div className={styles.modalOverlay} onClick={clearNewlyUnlockedSkinsForModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>🎉 Skin Desbloqueada! 🎉</h2>
        <button className={styles.closeButtonTop} onClick={clearNewlyUnlockedSkinsForModal} aria-label="Fechar">&times;</button>

        <div className={styles.skinListContainer}> {/* Novo container para a lista rolável */}
          {newlyUnlockedSkinsForModal.map((skin) => (
            <div key={skin.id} className={styles.skinItem}>
              <h3 className={styles.skinName}>{skin.name}</h3>
              {skin.preview && typeof skin.preview === 'string' && (
                <img src={skin.preview} alt={skin.name} className={styles.skinPreviewImage} />
              )}
              {skin.preview && Array.isArray(skin.preview) && skin.type === 'colorPalette' && (
                <div className={styles.palettePreview}>
                  {skin.preview.map((color: string | undefined, index: React.Key | null | undefined) => (
                    <div key={index} className={styles.colorSwatch} style={{ backgroundColor: color }} title={color}></div>
                  ))}
                </div>
              )}
              {skin.preview && typeof skin.preview === 'string' && skin.type === 'font' && (
                <p className={styles.fontPreview} style={{ fontFamily: skin.preview }}>
                  Aa Bb Cc
                </p>
              )}
              {skin.description && <p className={styles.skinDescription}>{skin.description}</p>}
            </div>
          ))}
        </div>

        <div className={styles.footerContent}> {/* Agrupa o texto e o botão */}
          <p className={styles.infoText}>
            Você pode equipá-la na página "Minhas Skins"!
          </p>
          <button className={`${styles.confirmButton} genericButton`} onClick={clearNewlyUnlockedSkinsForModal}>
            Legal!
          </button>
              </div>
      </div>
    </div>
  );
};

export default UnlockNotificationModal;
