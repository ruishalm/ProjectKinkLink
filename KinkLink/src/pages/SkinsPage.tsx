// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\SkinsPage.tsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SkinsPage.module.css';
import { useSkin } from '../contexts/SkinContext';
import { useAuth } from '../contexts/AuthContext'; // Importar o hook useAuth

// Definição da Skin (poderia vir de um arquivo de tipos)
export interface SkinDefinition {
  id: string;
  name: string;
  type: 'backgroundPile' | 'backgroundMatches' | 'colorPalette' | 'font' | 'themePack';
  description?: string;
  preview?: string | string[]; // URL para textura/fonte, ou array de cores para paleta
  unlockCriteria?: {
    type: 'matches' | 'seenCards' | 'userCreatedCards'; // Tipo de métrica para desbloqueio
    count: number; // Quantidade necessária
    description?: string; // Descrição de como desbloquear (para UI futura)
  };
}

// Dados de exemplo (mais tarde viriam do Firestore ou config)
const exampleSkinsData: SkinDefinition[] = [
  { id: 'bg_pile_default', name: 'Padrão (Pilha)', type: 'backgroundPile' },
  { id: 'bg_pile_azul_nipes', name: 'Azul Naipes (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/azulNipes.jpg', unlockCriteria: { type: 'matches', count: 5, description: 'Consiga 5 Links' } },
  { id: 'bg_pile_madeira', name: 'Madeira (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/madeira.jpg', unlockCriteria: { type: 'seenCards', count: 50, description: 'Veja 50 cartas' } },
  { id: 'bg_pile_verde_flor', name: 'Verde Flor (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/verdeFlor.jpg', unlockCriteria: { type: 'matches', count: 15, description: 'Consiga 15 Links' } },


  { id: 'bg_match_default', name: 'Padrão (Matches)', type: 'backgroundMatches' },
  { id: 'bg_match_cafe', name: 'Café (Matches)', type: 'backgroundMatches', preview: '/assets/skins/textures/cafe.jpg', unlockCriteria: { type: 'matches', count: 10, description: 'Consiga 10 Links' } },
  { id: 'bg_match_verde_claro', name: 'Verde Claro (Matches)', type: 'backgroundMatches', preview: '/assets/skins/textures/verdeClaro.jpg', unlockCriteria: { type: 'seenCards', count: 100, description: 'Veja 100 cartas' } },


  { id: 'palette_default', name: 'KinkLink Padrão', type: 'colorPalette', preview: ['#FF69B4', '#333333', '#FFFFFF', '#64b5f6', '#4caf50'] },
  { id: 'palette_ocean_deep', name: 'Oceano Profundo', type: 'colorPalette', preview: ['#1E90FF', '#000033', '#E0FFFF', '#00BFFF', '#90CAF9'], unlockCriteria: { type: 'seenCards', count: 25, description: 'Veja 25 cartas' } },
  { id: 'palette_forest_mist', name: 'Névoa da Floresta', type: 'colorPalette', preview: ['#2E7D32', '#1B5E20', '#A5D6A7', '#81C784', '#66BB6A'], unlockCriteria: { type: 'matches', count: 20, description: 'Consiga 20 Links' } },

  { id: 'font_default', name: 'Padrão App', type: 'font' },
  { id: 'font_roboto', name: 'Roboto', type: 'font', preview: 'Roboto, sans-serif', unlockCriteria: { type: 'userCreatedCards', count: 1, description: 'Crie sua primeira carta' } },
  { id: 'font_lato', name: 'Lato', type: 'font', preview: 'Lato, sans-serif', unlockCriteria: { type: 'userCreatedCards', count: 3, description: 'Crie 3 cartas' } },

  { id: 'pack_romantic_night', name: 'Noite Romântica', type: 'themePack', description: 'Um tema completo para noites especiais.' },
  { id: 'pack_default', name: 'Tema Padrão', type: 'themePack', description: 'O visual clássico do KinkLink.' },
];

function SkinsPage() {
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

    const skinDefinition = exampleSkinsData.find(s => s.id === skinId);
    // Passa a URL de preview para o contexto, se for uma string (textura ou fonte)
    // Para paletas, o preview é um array de cores, que não precisamos passar como URL aqui.
    // O contexto pode ter lógica para lidar com paletas de forma diferente.
    const previewUrl = (typeof skinDefinition?.preview === 'string') ? skinDefinition.preview : undefined;
    setActiveSkin(skinType, skinId, previewUrl);
    console.log(`Skin ativada via contexto: Tipo=${skinType}, ID=${skinId}, PreviewURL=${previewUrl}, Desbloqueada=${isUnlocked}`);
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
      case 'backgroundPile': return 'Textura de Fundo (Pilha de Cartas)';
      case 'backgroundMatches': return 'Textura de Fundo (Tela de Links)';
      case 'colorPalette': return 'Paletas de Cores';
      case 'font': return 'Estilos de Fonte';
      case 'themePack': return 'Pacotes de Tema Completos';
      default: return 'Skins';
    }
  };

  if (isLoadingSkins || isLoadingAuth) {
    return <div className={styles.page}><p>Carregando skins...</p></div>;
  }

  if (!user) {
    return <div className={styles.page}><p>Erro: Usuário não encontrado. Por favor, tente recarregar.</p></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/profile" className={styles.backButton}>&larr; Voltar</Link>
        <h1>Minhas Skins</h1>
      </header>
      <main className={styles.content}>
        {(Object.keys(skinsByType) as Array<SkinDefinition['type']>).map(skinType => {
          let currentActiveSkinId: string | undefined;
          switch (skinType) {
            case 'backgroundPile': currentActiveSkinId = activeSkins.backgroundPile; break;
            case 'backgroundMatches': currentActiveSkinId = activeSkins.backgroundMatches; break;
            case 'colorPalette': currentActiveSkinId = activeSkins.colorPalette; break;
            case 'font': currentActiveSkinId = activeSkins.font; break;
            case 'themePack': currentActiveSkinId = activeSkins.themePack; break;
          }

          return (
            <section key={skinType} className={styles.skinSection}>
              <h2 className={styles.sectionTitle}>{getCategoryTitle(skinType)}</h2>
              <div className={styles.skinItemsGrid}>
                {skinsByType[skinType].map(skin => {
                  const isNaturallyUnlocked = !skin.unlockCriteria || (user.unlockedSkinIds?.includes(skin.id) ?? false);
                  const isForceUnlocked = forceUnlockedIds.includes(skin.id);
                  const isEffectivelyUnlocked = isNaturallyUnlocked || isForceUnlocked;

                  const isActive = currentActiveSkinId === skin.id;
                  const unlockDescription = skin.unlockCriteria?.description;

                  return (
                    <div
                    key={skin.id}
                    className={`${styles.skinItem} ${isActive ? styles.activeSkin : ''} ${!isEffectivelyUnlocked ? styles.lockedSkin : ''} ${isForceUnlocked && !isNaturallyUnlocked ? styles.forceUnlockedHighlight : ''}`}
                    onClick={(e) => {
                      handleActivateSkin(skinType, skin.id, isEffectivelyUnlocked);
                      handleForceUnlock(e, skin.id, isEffectivelyUnlocked); // Passa o estado efetivo atual
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    aria-disabled={!isEffectivelyUnlocked}
                    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleActivateSkin(skinType, skin.id, isEffectivelyUnlocked)}
                  >
                    <h3 className={styles.skinName}>{skin.name}</h3>
                    {!isEffectivelyUnlocked && <span className={styles.lockedIcon} title={unlockDescription || 'Bloqueada'}>🔒</span>}
                    {skin.type === 'colorPalette' && Array.isArray(skin.preview) && (
                      <div className={styles.palettePreview}>
                        {skin.preview.map((color, index) => (
                          <div key={index} className={styles.colorSwatch} style={{ backgroundColor: color }} title={color}></div>
                        ))}
                      </div>
                    )}
                    {skin.type === 'backgroundPile' && typeof skin.preview === 'string' && (
                       <img src={skin.preview} alt={skin.name} className={styles.texturePreview} />
                    )}
                     {skin.type === 'backgroundMatches' && typeof skin.preview === 'string' && (
                       <img src={skin.preview} alt={skin.name} className={styles.texturePreview} />
                    )}
                    {skin.type === 'font' && typeof skin.preview === 'string' && (
                      <p className={styles.fontPreview} style={{ fontFamily: skin.preview }}>Aa Bb Cc</p>
                    )}
                    {skin.description && <p className={styles.skinDescription}>{skin.description}</p>}
                    {!isEffectivelyUnlocked && unlockDescription && (
                      <p className={styles.unlockHint}>{unlockDescription}</p>
                    )}
                    <button className={styles.activateButton} disabled={!isEffectivelyUnlocked}>
                      {isActive ? 'Ativa' : (isEffectivelyUnlocked ? 'Ativar' : 'Bloqueada')}
                    </button>
                  </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
export default SkinsPage;
