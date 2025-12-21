// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\SkinsPage.tsx
import React, { useMemo, useState } from 'react'; // useEffect removido
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './SkinsPage.module.css';
import { useSkin } from '../contexts/SkinContext'; // ActiveSkinSettings não é mais necessária aqui diretamente
import { useAuth } from '../contexts/AuthContext'; // Importar o hook useAuth
import { type SkinDefinition, exampleSkinsData } from '../config/skins'; // Importar do index.ts
// import SkinPreviewMiniature from '../components/SkinPreviewMiniature'; // Não é mais usado diretamente aqui
import SkinItemDisplay from '../components/SkinItemDisplay'; // Importar o novo componente
// import { defaultPalette } from '../contexts/SkinContext'; // Não é mais usado diretamente aqui

function SkinsPage() {
  const { t } = useTranslation();
  const { activeSkins, setActiveSkin, isLoadingSkins } = useSkin(); // Usar o contexto
  const { user, isLoading: isLoadingAuth } = useAuth(); // Usar o contexto de autenticação
  const [forceUnlockedIds, setForceUnlockedIds] = useState<string[]>([]); // Estado para skins forçadamente desbloqueadas

  // Agrupa as skins por tipo para facilitar a renderização
  const skinsByType = useMemo(() => {
    return exampleSkinsData.reduce((acc, skin) => {
      if (!acc[skin.type]) {
        acc[skin.type] = [];
      }
      acc[skin.type].push(skin);
      return acc;
    }, {} as Record<SkinDefinition['type'], SkinDefinition[]>);
  }, []);

  const handleActivateSkin = (skinType: SkinDefinition['type'], skinId: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      console.log(`Tentativa de ativar skin bloqueada: ID=${skinId}`);
      // Poderia mostrar uma mensagem para o usuário aqui
      return;
    }

    // A lógica para encontrar a skin e aplicar seus valores está dentro de setActiveSkin no contexto.
    // Basta passar o tipo e o ID.
    setActiveSkin(skinType, skinId);

    console.log(`Skin ativada via contexto: Tipo=${skinType}, ID=${skinId}, Desbloqueada=${isUnlocked}`);

    // Após ativar, atualiza o preview para refletir a skin ativa (será feito pelo useEffect em activeSkins)
  };

  const handleForceUnlock = (e: React.MouseEvent<HTMLDivElement>, skinId: string, isCurrentlyUnlocked: boolean) => {
    // Usaremos clique duplo para forçar o desbloqueio/bloqueio para testes
    if (e.detail >= 2) { // e.detail conta o número de cliques
      if (isCurrentlyUnlocked && forceUnlockedIds.includes(skinId)) {
        // Se já estava forçadamente desbloqueada, remove o "force"
        setForceUnlockedIds(prev => prev.filter(id => id !== skinId));
        console.log(`[TESTE] Skin ${skinId} não está mais forçadamente desbloqueada.`);
      } else if (!isCurrentlyUnlocked) {
        setForceUnlockedIds(prev => [...new Set([...prev, skinId])]);
        console.log(`[TESTE] Skin ${skinId} forçadamente desbloqueada para esta sessão.`);
      }
    }
  };


  const getCategoryTitle = (type: SkinDefinition['type']): string => {
    switch (type) {
      case 'backgroundPile': return t('skins_category_background_pile');
      case 'backgroundMatches': return t('skins_category_background_matches');
      case 'colorPalette': return t('skins_category_color_palette');
      case 'font': return t('skins_category_font');
      case 'buttonStyle': return t('skins_category_button_style');
      case 'themePack': return t('skins_category_theme_pack');
      case 'panelStyle': return t('skins_category_panel_style');
      default: return t('skins_category_default');
    }
  };

  if (isLoadingSkins || isLoadingAuth) {
    return <div className={styles.page}><p>{t('skins_loading')}</p></div>;
  }

  if (!user) {
    return <div className={styles.page}><p>{t('skins_error_user_not_found')}</p></div>;
  }

  return (
    <div className={`${styles.page} klnkl-themed-panel`}> {/* Adicionado klnkl-themed-panel */}
      <div className={styles.pageHeaderControls}>
        <Link to="/profile" className={`${styles.backButton} genericButton ck-theme-button`}>
          {t('skins_back_button')}
        </Link>
        <h1 className={styles.pageTitle}>{t('skins_title')}</h1>
        <Link to="/cards" className={`${styles.backButton} genericButton ck-theme-button`}>
          {t('skins_card_pile_button')}
        </Link>
      </div>

      {/* Área da Miniatura Temporariamente Removida */}
      <div className={styles.skinsLayoutContainer}>
        {/* 
        <aside className={styles.previewArea}>
          <h2 className={styles.previewTitle}>Pré-visualização</h2>
          <SkinPreviewMiniature settings={previewSettings} />
        </aside>
        */}
        <main className={styles.skinsSelectionArea} > {/* Removido onMouseLeave */}
          {/* Define a ordem explícita das seções */}
          {([
            'backgroundPile',
            'backgroundMatches',
            'colorPalette',
            'font',
            'buttonStyle',
            'panelStyle',  // Adicionado aqui
            'themePack',   // Agora é o último
          ] as Array<SkinDefinition['type']>).map(skinType => {
            // Determina qual skin está ativa para esta categoria, para destacar na UI
            if (!skinsByType[skinType]) return null; // Pula se o tipo não tiver skins (segurança)
            let currentActiveSkinIdForCategory: string | undefined;
            switch (skinType) {
              case 'backgroundPile': currentActiveSkinIdForCategory = activeSkins.backgroundPile; break;
              case 'backgroundMatches': currentActiveSkinIdForCategory = activeSkins.backgroundMatches; break;
              case 'colorPalette': currentActiveSkinIdForCategory = activeSkins.colorPalette; break;
              case 'font': currentActiveSkinIdForCategory = activeSkins.font; break;
              case 'buttonStyle': currentActiveSkinIdForCategory = activeSkins.buttonStyleId; break;
              case 'panelStyle': currentActiveSkinIdForCategory = activeSkins.panelStyleId; break; // Adicionado
              case 'themePack': currentActiveSkinIdForCategory = activeSkins.themePack; break;
            }

            return (
              <section key={skinType} className={`${styles.skinSection} klnkl-themed-panel`}> {/* Adicionado klnkl-themed-panel */}
                <h2 className={styles.sectionTitle}>{getCategoryTitle(skinType)}</h2>
                <div className={styles.skinItemsGrid}>
                  {skinsByType[skinType].map(skin => {
                    const isNaturallyUnlocked = !skin.unlockCriteria || (user.unlockedSkinIds?.includes(skin.id) ?? false);
                    const isForceUnlocked = forceUnlockedIds.includes(skin.id);
                    const isEffectivelyUnlocked = isNaturallyUnlocked || isForceUnlocked;

                    const isActive = currentActiveSkinIdForCategory === skin.id;
                    // unlockDescription será tratado dentro de SkinItemDisplay

                    return (
                      <SkinItemDisplay
                        key={skin.id}
                        skin={skin}
                        skinType={skinType}
                        isActive={isActive}
                        isEffectivelyUnlocked={isEffectivelyUnlocked}
                        isForceUnlocked={isForceUnlocked}
                        isNaturallyUnlocked={isNaturallyUnlocked}
                        onActivate={handleActivateSkin}
                        onForceUnlock={handleForceUnlock}
                        // onMouseEnter foi removido pois handleMouseEnterSkin foi removido
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}
export default SkinsPage;
