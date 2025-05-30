// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\SkinContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { exampleSkinsData, type SkinDefinition } from '../pages/SkinsPage'; // Importar dados e tipo

const LOCAL_STORAGE_KEY = 'kinklink_active_skins';

export interface ActiveSkinSettings {
  backgroundPile?: string; // ID da skin de fundo da pilha
  backgroundPileUrl?: string; // URL da textura para a pilha
  backgroundMatches?: string; // ID da skin de fundo dos matches
  backgroundMatchesUrl?: string; // URL da textura para os matches
  colorPalette?: string; // ID da paleta de cores
  colorPaletteColors?: string[]; // Array de cores da paleta
  font?: string; // ID da fonte
  fontFamily?: string; // Nome da família da fonte
  themePack?: string; // ID do pacote de tema
}

interface SkinContextType {
  activeSkins: ActiveSkinSettings;
  setActiveSkin: (
    type: SkinDefinition['type'],
    skinId: string,
    previewValue?: string | string[] // Pode ser URL da textura/fonte ou array de cores
  ) => void;
  isLoadingSkins: boolean;
  applySkinStyles: (skins: ActiveSkinSettings) => void; // Adicionado para consistência
}

// Nomes das variáveis CSS que vamos usar
const colorVariableNames = [
  '--cor-primaria',               // Cor principal para destaques, títulos importantes
  '--cor-secundaria',             // Cor de apoio, fundos de elementos secundários
  '--cor-fundo-pagina',           // Cor de fundo geral da página/aplicativo
  '--cor-fundo-elemento',         // Cor de fundo para cards, modais, inputs
  '--cor-texto-primario',         // Cor principal para texto sobre fundos claros/escuros
  '--cor-texto-secundario',       // Cor para texto menos importante, placeholders
  '--cor-texto-sobre-primaria',   // Cor do texto em botões/elementos com fundo --cor-primaria
  '--cor-texto-sobre-secundaria', // Cor do texto em botões/elementos com fundo --cor-secundaria
  '--cor-borda',                  // Cor para bordas sutis de elementos
  '--cor-acao-positiva',          // Verde para "Topo!" / Like
  '--cor-texto-acao-positiva',    // Texto sobre o botão de ação positiva
  '--cor-acao-negativa',          // Vermelho para "Não Topo!" / Dislike
  '--cor-texto-acao-negativa',    // Texto sobre o botão de ação negativa
  '--cor-aviso',                  // Amarelo/Laranja para avisos, destaques de atenção
  '--cor-destaque',               // Uma cor extra para destaques específicos, ícones ativos, etc.
  '--cor-texto-sobre-destaque',   // Cor do texto sobre elementos com fundo --cor-destaque
  '--cor-overlay',                // Cor para overlays de modais (agora o 17º item)
];

// Paleta padrão com 17 cores
const defaultPalette: string[] = ['#FF69B4', '#5C5C5C', '#1e1e1e', '#2a2a2a', '#f0f0f0', '#b0b0b0', '#FFFFFF', '#FFFFFF', '#3f3f3f', '#4CAF50', '#FFFFFF', '#F44336', '#FFFFFF', '#FFC107', '#64b5f6', '#111111', 'rgba(0, 0, 0, 0.7)'];

const defaultActiveSkins: ActiveSkinSettings = {
  backgroundPile: 'bg_pile_default',
  backgroundPileUrl: undefined,
  backgroundMatches: 'bg_match_default',
  backgroundMatchesUrl: undefined,
  colorPalette: 'palette_default', // ID da paleta padrão
  colorPaletteColors: defaultPalette, // Cores da paleta padrão
  font: 'font_default',
  themePack: 'pack_default',
};

const SkinContext = createContext<SkinContextType | undefined>(undefined);

export const SkinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSkins, setActiveSkinsState] = useState<ActiveSkinSettings>(defaultActiveSkins);
  const [isLoadingSkins, setIsLoadingSkins] = useState(true);

  const applySkinStyles = useCallback((skins: ActiveSkinSettings) => {
    const root = document.documentElement;

    // Aplicar texturas de fundo
    if (skins.backgroundPileUrl) {
      root.style.setProperty('--bg-pile-url', `url(${skins.backgroundPileUrl})`);
    } else {
      root.style.removeProperty('--bg-pile-url');
    }
    if (skins.backgroundMatchesUrl) {
      root.style.setProperty('--bg-matches-url', `url(${skins.backgroundMatchesUrl})`);
    } else {
      root.style.removeProperty('--bg-matches-url');
    }

    // Aplicar paleta de cores
    const currentPalette = skins.colorPaletteColors || defaultPalette;
    colorVariableNames.forEach((varName, index) => {
      if (currentPalette[index]) {
        root.style.setProperty(varName, currentPalette[index]);
      } else if (defaultPalette[index]) { // Fallback para a cor default se a paleta atual não tiver
        root.style.setProperty(varName, defaultPalette[index]);
      } else {
        root.style.removeProperty(varName); // Remove se nem o default tiver (improvável)
      }
    });
    // console.log('[SkinContext] Paleta aplicada:', currentPalette);

    // Aplicar fonte
    if (skins.fontFamily) {
      root.style.setProperty('--font-family-main', skins.fontFamily);
    } else {
      // Defina uma fonte padrão do sistema se nenhuma for especificada
      root.style.setProperty('--font-family-main', 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif');
    }
  }, []);

  useEffect(() => {
    try {
      const storedSkins = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSkins) {
        const parsedSkins = JSON.parse(storedSkins) as ActiveSkinSettings;
        // Garante que colorPaletteColors seja preenchido ao carregar
        if (parsedSkins.colorPalette) {
          const paletteSkinDef = exampleSkinsData.find(s => s.id === parsedSkins.colorPalette && s.type === 'colorPalette');
          if (paletteSkinDef && Array.isArray(paletteSkinDef.preview)) {
            parsedSkins.colorPaletteColors = paletteSkinDef.preview;
          } else {
            // Se a paleta salva não for encontrada ou não tiver preview, usa a default
            parsedSkins.colorPalette = 'palette_default';
            parsedSkins.colorPaletteColors = defaultPalette;
          }
        } else { // Se não houver colorPalette salva, define a padrão
            parsedSkins.colorPalette = 'palette_default';
            parsedSkins.colorPaletteColors = defaultPalette;
        }

        setActiveSkinsState(parsedSkins);
        applySkinStyles(parsedSkins);
      } else {
        // Aplica a paleta padrão inicial se nada estiver salvo
        applySkinStyles(defaultActiveSkins);
      }
    } catch (error) {
      console.error("Failed to load skins from localStorage", error);
      applySkinStyles(defaultActiveSkins); // Aplica defaults em caso de erro
    }
    setIsLoadingSkins(false);
  }, [applySkinStyles]);

  const setActiveSkin = useCallback((
    type: SkinDefinition['type'],
    skinId: string,
    previewValue?: string | string[] // Aceita string (URL/font-family) ou string[] (cores)
  ) => {
    setActiveSkinsState(prevSkins => {
      const newSkins: ActiveSkinSettings = { ...prevSkins };
      const isDefaultSkin = skinId.endsWith('_default');
      const skinDefinition = exampleSkinsData.find(s => s.id === skinId && s.type === type);

      switch (type) {
        case 'backgroundPile':
          newSkins.backgroundPile = skinId;
          newSkins.backgroundPileUrl = isDefaultSkin ? undefined : (typeof previewValue === 'string' ? previewValue : undefined);
          break;
        case 'backgroundMatches':
          newSkins.backgroundMatches = skinId;
          newSkins.backgroundMatchesUrl = isDefaultSkin ? undefined : (typeof previewValue === 'string' ? previewValue : undefined);
          break;
        case 'colorPalette':
          newSkins.colorPalette = skinId;
          if (skinDefinition && Array.isArray(skinDefinition.preview)) {
            newSkins.colorPaletteColors = skinDefinition.preview;
          } else {
            console.warn(`[SkinContext] Preview da paleta ${skinId} não é um array de cores ou skin não encontrada. Usando default.`);
            newSkins.colorPaletteColors = defaultPalette; // Fallback para a paleta padrão
          }
          break;
        case 'font':
          newSkins.font = skinId;
          newSkins.fontFamily = typeof previewValue === 'string' ? previewValue : undefined;
          break;
        case 'themePack':
          newSkins.themePack = skinId;
          // Lógica para aplicar pacote de tema (poderia setar múltiplos valores) viria aqui
          break;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSkins));
      applySkinStyles(newSkins); // Aplica os estilos imediatamente
      return newSkins;
    });
  }, [applySkinStyles]);

  return (
    <SkinContext.Provider value={{ activeSkins, setActiveSkin, isLoadingSkins, applySkinStyles }}>
      {children}
    </SkinContext.Provider>
  );
};

export const useSkin = (): SkinContextType => {
  const context = useContext(SkinContext);
  if (context === undefined) {
    throw new Error('useSkin must be used within a SkinProvider');
  }
  return context;
};
