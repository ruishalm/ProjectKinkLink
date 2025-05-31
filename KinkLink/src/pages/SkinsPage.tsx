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
export const exampleSkinsData: SkinDefinition[] = [
  { id: 'bg_pile_default', name: 'Padrão (Pilha)', type: 'backgroundPile' },
  { id: 'bg_pile_azul_nipes', name: 'Azul Naipes (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/azulNipes.jpg', unlockCriteria: { type: 'matches', count: 5, description: 'Consiga 5 Links' } },
  { id: 'bg_pile_madeira', name: 'Madeira (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/madeira.jpg', unlockCriteria: { type: 'seenCards', count: 50, description: 'Veja 50 cartas' } },
  { id: 'bg_pile_verde_flor', name: 'Verde Flor (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/verdeFlor.jpg', unlockCriteria: { type: 'matches', count: 15, description: 'Consiga 15 Links' } },


  { id: 'bg_match_default', name: 'Padrão (Matches)', type: 'backgroundMatches' },
  { id: 'bg_match_cafe', name: 'Café (Matches)', type: 'backgroundMatches', preview: '/assets/skins/textures/cafe.jpg', unlockCriteria: { type: 'matches', count: 10, description: 'Consiga 10 Links' } },
  { id: 'bg_match_verde_claro', name: 'Verde Claro (Matches)', type: 'backgroundMatches', preview: '/assets/skins/textures/verdeClaro.jpg', unlockCriteria: { type: 'seenCards', count: 100, description: 'Veja 100 cartas' } },


  {
    id: 'palette_default',
    name: 'KinkLink Padrão',
    type: 'colorPalette',
    preview: [ // Agora com 17 cores
      '#FF69B4', // --cor-primaria (Rosa KinkLink)
      '#5C5C5C', // --cor-secundaria (Cinza Médio Escuro)
      '#1e1e1e', // --cor-fundo-pagina (Cinza Muito Escuro)
      '#2a2a2a', // --cor-fundo-elemento (Cinza Escuro)
      '#f0f0f0', // --cor-texto-primario (Branco Suave)
      '#b0b0b0', // --cor-texto-secundario (Cinza Claro)
      '#FFFFFF', // --cor-texto-sobre-primaria (Branco)
      '#FFFFFF', // --cor-texto-sobre-secundaria (Branco)
      '#3f3f3f', // --cor-borda (Cinza Escuro para Bordas)
      '#4CAF50', // --cor-acao-positiva (Verde)
      '#FFFFFF', // --cor-texto-acao-positiva (Branco)
      '#F44336', // --cor-acao-negativa (Vermelho)
      '#FFFFFF', // --cor-texto-acao-negativa (Branco)
      '#FFC107', // --cor-aviso (Âmbar)
      '#64b5f6', // --cor-destaque (Azul Claro)
      '#111111', // --cor-texto-sobre-destaque (Preto/Cinza Muito Escuro)
      'rgba(0, 0, 0, 0.7)' // --cor-overlay
    ]
  },
  {
    id: 'palette_ocean_deep',
    name: 'Oceano Profundo',
    type: 'colorPalette',
    preview: [
      '#1E90FF', // --cor-primaria (Azul Dodger)
      '#1976D2', // --cor-secundaria (Azul Escuro)
      '#000033', // --cor-fundo-pagina (Azul Marinho Muito Escuro)
      '#0D47A1', // --cor-fundo-elemento (Azul Mais Escuro)
      '#E0FFFF', // --cor-texto-primario (Azul Claro Quase Branco)
      '#ADD8E6', // --cor-texto-secundario (Azul Claro)
      '#FFFFFF', // --cor-texto-sobre-primaria (Branco)
      '#E0FFFF', // --cor-texto-sobre-secundaria (Azul Claro Quase Branco)
      '#00BFFF', // --cor-borda (Azul Céu Profundo)
      '#32CD32', // --cor-acao-positiva (Verde Lima)
      '#FFFFFF', // --cor-texto-acao-positiva (Branco)
      '#FF6347', // --cor-acao-negativa (Tomate)
      '#FFFFFF', // --cor-texto-acao-negativa (Branco)
      '#FFD700', // --cor-aviso (Dourado)
      '#90CAF9', // --cor-destaque (Azul Bebê)
      '#000033', // --cor-texto-sobre-destaque (Azul Marinho Muito Escuro)
      'rgba(0,0,51,0.85)' // --cor-overlay (Overlay Azul Escuro Transparente)
    ],
    unlockCriteria: { type: 'seenCards', count: 25, description: 'Veja 25 cartas' }
  },
  { // Exemplo para Névoa da Floresta - você precisará preencher com 16 cores
    id: 'palette_forest_mist',
    name: 'Névoa da Floresta',
    type: 'colorPalette',
    preview: [
      '#2E7D32', // --cor-primaria (Verde Escuro)
      '#1B5E20', // --cor-secundaria (Verde Mais Escuro)
      '#0A1F08', // --cor-fundo-pagina (Verde Quase Preto)
      '#10350E', // --cor-fundo-elemento (Verde Bem Escuro)
      '#A5D6A7', // --cor-texto-primario (Verde Claro)
      '#81C784', // --cor-texto-secundario (Verde Médio Claro)
      '#FFFFFF', // --cor-texto-sobre-primaria
      '#E8F5E9', // --cor-texto-sobre-secundaria
      '#66BB6A', // --cor-borda (Verde Médio)
      '#69F0AE', // --cor-acao-positiva (Verde Água Brilhante)
      '#000000', // --cor-texto-acao-positiva
      '#FF8A80', // --cor-acao-negativa (Vermelho Salmão Claro)
      '#000000', // --cor-texto-acao-negativa
      '#FFEB3B', // --cor-aviso (Amarelo)
      '#C8E6C9', // --cor-destaque (Verde Muito Claro)
      '#0A1F08', // --cor-texto-sobre-destaque (Verde Quase Preto para contraste com o destaque claro)
      'rgba(10, 31, 8, 0.9)' // --cor-overlay
    ],
    unlockCriteria: { type: 'matches', count: 20, description: 'Consiga 20 Links' }
  },
  {
    id: 'palette_vamp_night',
    name: 'Vamp Noturno',
    type: 'colorPalette',
    preview: [
      '#D32F2F', // --cor-primaria (Vermelho Escuro)
      '#424242', // --cor-secundaria (Cinza Escuro)
      '#121212', // --cor-fundo-pagina (Preto)
      '#212121', // --cor-fundo-elemento (Cinza Quase Preto)
      '#E0E0E0', // --cor-texto-primario (Cinza Muito Claro)
      '#9E9E9E', // --cor-texto-secundario (Cinza Médio)
      '#FFFFFF', // --cor-texto-sobre-primaria (Branco)
      '#E0E0E0', // --cor-texto-sobre-secundaria (Cinza Muito Claro)
      '#616161', // --cor-borda (Cinza Escuro para Bordas)
      '#7B1FA2', // --cor-acao-positiva (Roxo Escuro)
      '#FFFFFF', // --cor-texto-acao-positiva (Branco)
      '#5E35B1', // --cor-acao-negativa (Roxo Médio Escuro)
      '#FFFFFF', // --cor-texto-acao-negativa (Branco)
      '#FF6F00', // --cor-aviso (Laranja Escuro/Âmbar)
      '#E91E63', // --cor-destaque (Magenta/Pink Escuro)
      '#FFFFFF', // --cor-texto-sobre-destaque (Branco)
      'rgba(10, 0, 20, 0.85)' // --cor-overlay (Overlay Roxo Escuro Transparente)
    ],
    unlockCriteria: { type: 'seenCards', count: 75, description: 'Veja 75 cartas' }
  },
  {
    id: 'palette_candy_sky',
    name: 'Algodão Doce Celestial',
    type: 'colorPalette',
    preview: [
      '#FFC0CB', // --cor-primaria (Rosa Pastel)
      '#ADD8E6', // --cor-secundaria (Azul Bebê Claro)
      '#FAF3F7', // --cor-fundo-pagina (Branco com tom Rosa)
      '#FFFFFF', // --cor-fundo-elemento (Branco Puro)
      '#5D5463', // --cor-texto-primario (Roxo Acinzentado Escuro)
      '#A89FAC', // --cor-texto-secundario (Cinza Lavanda)
      '#4A4A4A', // --cor-texto-sobre-primaria (Cinza Escuro)
      '#4A4A4A', // --cor-texto-sobre-secundaria (Cinza Escuro)
      '#E0D8E0', // --cor-borda (Lavanda Muito Claro)
      '#98FB98', // --cor-acao-positiva (Verde Menta Pastel)
      '#2F4F4F', // --cor-texto-acao-positiva (DarkSlateGray)
      '#FFB6C1', // --cor-acao-negativa (Rosa Claro)
      '#2F4F4F', // --cor-texto-acao-negativa (DarkSlateGray)
      '#FFFACD', // --cor-aviso (Amarelo Limão Pastel)
      '#D8BFD8', // --cor-destaque (Lilás Pastel)
      '#2F4F4F', // --cor-texto-sobre-destaque (DarkSlateGray)
      'rgba(240, 248, 255, 0.7)' // --cor-overlay (Overlay Azul Alice Transparente)
    ],
    unlockCriteria: { type: 'matches', count: 30, description: 'Consiga 30 Links' }
  },

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
    // Para texturas e fontes, passamos a string de preview (URL ou nome da fonte).
    // Para paletas, o SkinContext buscará as cores usando o skinId.
    const valueToPass = (skinType !== 'colorPalette' && typeof skinDefinition?.preview === 'string') ? skinDefinition.preview : undefined;
    setActiveSkin(skinType, skinId, valueToPass);
    console.log(`Skin ativada via contexto: Tipo=${skinType}, ID=${skinId}, ValorPreview=${valueToPass}, Desbloqueada=${isUnlocked}`);
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
      <main className={styles.mainContent}> {/* Conteúdo principal da página */}
        <div className={styles.pageHeaderControls}> {/* Novo container para título e botão de voltar */}
          <Link to="/profile" className={styles.backButton}>&larr; Voltar</Link>
          <h1 className={styles.pageTitle}>Minhas Skins</h1>
        </div>

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
