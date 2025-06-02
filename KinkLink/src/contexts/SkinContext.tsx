// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\SkinContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { panelStyleDefault, exampleSkinsData, type SkinDefinition } from '../config/skins'; // Importar tudo de config/skins

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
  buttonStyleId?: string; // ID do estilo de botão ativo
  buttonStyleClass?: string; // Classe CSS do estilo de botão ativo
  panelStyleId?: string; // ID da skin de estilo de painel ativa
  panelStyleClass?: string; // Classe CSS para o estilo de painel
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
  panelStyleId?: string; // Expor o ID do painel ativo
  panelStyleClass?: string; // Expor a classe do painel ativo
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
export const defaultPalette: string[] = ['#FF69B4', '#5C5C5C', '#1e1e1e', '#2a2a2a', '#f0f0f0', '#b0b0b0', '#FFFFFF', '#FFFFFF', '#3f3f3f', '#4CAF50', '#FFFFFF', '#F44336', '#FFFFFF', '#FFC107', '#64b5f6', '#111111', 'rgba(0, 0, 0, 0.7)'];

const defaultActiveSkins: ActiveSkinSettings = {
  backgroundPile: 'bg_pile_default',
  backgroundPileUrl: undefined,
  backgroundMatches: 'bg_match_default',
  backgroundMatchesUrl: undefined,
  colorPalette: 'palette_default', // ID da paleta padrão
  colorPaletteColors: [...defaultPalette], // Cores da paleta padrão (usando cópia)
  font: 'font_default',
  fontFamily: undefined, // Será definido pelo applySkinStyles
  themePack: 'pack_default',
  buttonStyleId: 'btn_style_default', // ID do estilo de botão padrão
  buttonStyleClass: 'klnkl-btn-style-default', // Classe do estilo de botão padrão
  panelStyleId: panelStyleDefault.id, // ID do estilo de painel padrão
  panelStyleClass: panelStyleDefault.preview as string, // Classe do estilo de painel padrão
};

// Variável para manter o controle da classe de tema aplicada anteriormente
let currentThemePackClass = '';

const SkinContext = createContext<SkinContextType | undefined>(undefined);

export const SkinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSkins, setActiveSkinsState] = useState<ActiveSkinSettings>(() => defaultActiveSkins);
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
      console.log('[SkinContext] Aplicando fontFamily à variável CSS:', skins.fontFamily);
      root.style.setProperty('--font-family-main', skins.fontFamily);
    } else {
      // Defina uma fonte padrão do sistema se nenhuma for especificada
      const defaultSystemFontStack = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif';
      console.log('[SkinContext] Aplicando stack de fonte padrão do sistema à variável CSS:', defaultSystemFontStack);
      root.style.setProperty('--font-family-main', defaultSystemFontStack);
    }

    // Gerenciar classes de tema no elemento root (<html>)
    // Remove a classe do tema anterior, se houver
    console.log('[SkinContext] applySkinStyles - Gerenciando classe de tema. currentThemePackClass ANTES:', currentThemePackClass, 'Próximo tema:', skins.themePack);
    if (currentThemePackClass) {
      root.classList.remove(currentThemePackClass);
      console.log('[SkinContext] applySkinStyles - Removida classe de tema anterior:', currentThemePackClass);
    }
    // Adiciona a classe do novo tema, se não for o padrão
    if (skins.themePack && skins.themePack !== 'pack_default') {
      const newThemeClass = `theme-pack-${skins.themePack.replace(/_/g, '-')}`;
      root.classList.add(newThemeClass);
      currentThemePackClass = newThemeClass;
      console.log('[SkinContext] applySkinStyles - Adicionada nova classe de tema:', newThemeClass);
    } else {
      currentThemePackClass = ''; // Reseta se for o tema padrão
      console.log('[SkinContext] applySkinStyles - Tema é padrão ou não definido, currentThemePackClass resetada.');
    }
    console.log('[SkinContext] applySkinStyles - Classe de tema no HTML AGORA:', root.className);

    // Gerenciar classe de estilo de botão no elemento root (<html>) de forma mais robusta
    // 1. Remover todas as classes de estilo de botão conhecidas
    exampleSkinsData.forEach(skin => {
      if (skin.type === 'buttonStyle' && typeof skin.preview === 'string') {
        root.classList.remove(skin.preview);
      }
    });
    if (defaultActiveSkins.buttonStyleClass) { // Também remover a classe padrão explicitamente
      root.classList.remove(defaultActiveSkins.buttonStyleClass);
    }

    // 2. Aplicar a classe correta (a específica ou a padrão se a específica não estiver definida)
    if (skins.buttonStyleClass) {
      root.classList.add(skins.buttonStyleClass);
    } else if (defaultActiveSkins.buttonStyleClass) { // Fallback para a classe padrão
      root.classList.add(defaultActiveSkins.buttonStyleClass);
    }

    // A classe do panelStyle é gerenciada por um useEffect separado que depende de activeSkins.panelStyleClass
  }, []); // currentPanelStyleClass removido das dependências e da lógica interna


  useEffect(() => {
    try {
      const storedSkins = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSkins) {
        const parsedSkins = JSON.parse(storedSkins) as ActiveSkinSettings;

        // 1. Paleta de Cores
        if (parsedSkins.colorPalette) {
          const paletteSkinDef = exampleSkinsData.find(s => s.id === parsedSkins.colorPalette && (s.type === 'colorPalette' || s.type === 'themePack'));
          if (paletteSkinDef?.type === 'colorPalette' && Array.isArray(paletteSkinDef.preview)) {
            // Certifique-se de que a paleta tenha o número correto de cores
            parsedSkins.colorPaletteColors = paletteSkinDef.preview.slice(0, colorVariableNames.length);
            if (paletteSkinDef.preview.length < colorVariableNames.length) {
                // Preenche com cores padrão se a paleta salva for menor
                for (let i = paletteSkinDef.preview.length; i < colorVariableNames.length; i++) {
                    parsedSkins.colorPaletteColors.push(defaultPalette[i]);
                }
            }
          } else {
            parsedSkins.colorPalette = defaultActiveSkins.colorPalette; // Fallback para ID da paleta padrão
            parsedSkins.colorPaletteColors = [...defaultPalette]; // Fallback para cores da paleta padrão
          }
        } else if (parsedSkins.themePack) { // Se um themePack estiver ativo, carrega sua paleta associada
          const themePackDef = exampleSkinsData.find(s => s.id === parsedSkins.themePack);
          const paletteId = themePackDef?.associatedPaletteId;
          const paletteDef = paletteId ? exampleSkinsData.find(s => s.id === paletteId && s.type === 'colorPalette') : undefined;
          if (paletteDef && Array.isArray(paletteDef.preview)) {
            parsedSkins.colorPalette = paletteId; // Define o ID da paleta do tema
            parsedSkins.colorPaletteColors = paletteDef.preview.slice(0, colorVariableNames.length);
            if (paletteDef.preview.length < colorVariableNames.length) {
                for (let i = paletteDef.preview.length; i < colorVariableNames.length; i++) {
                    parsedSkins.colorPaletteColors.push(defaultPalette[i]);
                }
            }
          } else { // Fallback se a paleta do tema não for encontrada
            parsedSkins.colorPalette = defaultActiveSkins.colorPalette; // Fallback para ID da paleta padrão
            parsedSkins.colorPaletteColors = [...defaultPalette]; // Fallback para cores da paleta padrão
          }
        } else { // Se não houver colorPalette salva, define a padrão
          parsedSkins.colorPalette = defaultActiveSkins.colorPalette;
          parsedSkins.colorPaletteColors = [...defaultPalette];
        }

        // 2. Fonte (se um themePack estiver ativo, sua fonte associada tem prioridade)
        if (parsedSkins.themePack) {
          const themePackDef = exampleSkinsData.find(s => s.id === parsedSkins.themePack);
          const fontId = themePackDef?.associatedFontId;
          const fontDef = fontId ? exampleSkinsData.find(s => s.id === fontId && s.type === 'font') : undefined;
          if (fontDef && typeof fontDef.preview === 'string') {
            parsedSkins.font = fontId;
            parsedSkins.fontFamily = fontDef.preview;
          }
        } else if (parsedSkins.font) { // Se não houver themePack, usa a fonte individual salva
          const fontDef = exampleSkinsData.find(s => s.id === parsedSkins.font && s.type === 'font');
          if (fontDef && typeof fontDef.preview === 'string') {
            parsedSkins.fontFamily = fontDef.preview;
          }
        }

        // 3. Estilo de Botão (se um themePack estiver ativo, seu estilo associado tem prioridade)
        // a menos que o usuário tenha feito uma escolha individual específica diferente do tema e do default)
        let finalButtonStyleId = parsedSkins.buttonStyleId || defaultActiveSkins.buttonStyleId;
        let finalButtonStyleClass = parsedSkins.buttonStyleClass;

        // Se uma classe não foi carregada do localStorage mas um ID sim (ou se o ID é o default e não havia classe),
        // tenta buscar a classe correspondente ao ID.
        if (!finalButtonStyleClass && finalButtonStyleId) {
            const skinDef = exampleSkinsData.find(s => s.id === finalButtonStyleId && s.type === 'buttonStyle');
            if (skinDef && typeof skinDef.preview === 'string') {
                finalButtonStyleClass = skinDef.preview;
            }
        }
        // Se, após a tentativa acima, ainda não há classe (ex: ID inválido no localStorage),
        // ou se o ID inicial era o default mas a classe não foi carregada,
        // reverte para o estilo de botão padrão completo.
        if (!finalButtonStyleClass) {
            finalButtonStyleId = defaultActiveSkins.buttonStyleId;
            finalButtonStyleClass = defaultActiveSkins.buttonStyleClass;
        }

        // Agora, considera o themePack, se houver um ativo e não for o default.
        if (parsedSkins.themePack && parsedSkins.themePack !== defaultActiveSkins.themePack) {
          const themePackDef = exampleSkinsData.find(s => s.id === parsedSkins.themePack);
          const themeButtonStyleId = themePackDef?.associatedButtonStyleId;

          if (themeButtonStyleId) {
            // O tema tem um estilo de botão associado.
            // Verificamos se a escolha atual do usuário (finalButtonStyleId) é uma escolha específica
            // que difere tanto do botão associado ao tema quanto do botão padrão global.
            const userMadeSpecificChoiceDifferentFromThemeAndDefault =
                finalButtonStyleId !== themeButtonStyleId &&
                finalButtonStyleId !== defaultActiveSkins.buttonStyleId;

            if (!userMadeSpecificChoiceDifferentFromThemeAndDefault) {
              // Se a escolha do usuário não foi específica e diferente, o tema dita o estilo.
              const themeButtonStyleDef = exampleSkinsData.find(s => s.id === themeButtonStyleId && s.type === 'buttonStyle');
              if (themeButtonStyleDef && typeof themeButtonStyleDef.preview === 'string') {
                finalButtonStyleId = themeButtonStyleId;
                finalButtonStyleClass = themeButtonStyleDef.preview;
              } else {
                // Tema especificou um ID, mas não foi encontrado/válido. Reverte para o default global.
                console.warn(`[SkinContext] Botão associado ao tema ${parsedSkins.themePack} (ID: ${themeButtonStyleId}) não encontrado. Usando default.`);
                finalButtonStyleId = defaultActiveSkins.buttonStyleId;
                finalButtonStyleClass = defaultActiveSkins.buttonStyleClass;
              }
            }
            // Se userMadeSpecificChoiceDifferentFromThemeAndDefault é true,
            // finalButtonStyleId/Class (da escolha individual do usuário) são mantidos.
          }
          // Se o tema não tem um associatedButtonStyleId, finalButtonStyleId/Class (da escolha individual ou default) são mantidos.
        }

        // Ensure parsedSkins reflects the determined button style
        parsedSkins.buttonStyleId = finalButtonStyleId;
        parsedSkins.buttonStyleClass = finalButtonStyleClass; // This might still be undefined if all fallbacks fail

        // 3.5. Estilo de Painel (similar ao de botão)
        let finalPanelStyleId = parsedSkins.panelStyleId || defaultActiveSkins.panelStyleId;
        let finalPanelStyleClass = parsedSkins.panelStyleClass;

        if (!finalPanelStyleClass && finalPanelStyleId) {
            const panelSkinDef = exampleSkinsData.find(s => s.id === finalPanelStyleId && s.type === 'panelStyle');
            if (panelSkinDef && typeof panelSkinDef.preview === 'string') {
                finalPanelStyleClass = panelSkinDef.preview;
            }
        }
        if (!finalPanelStyleClass) { // Fallback final para o default
            finalPanelStyleId = defaultActiveSkins.panelStyleId;
            finalPanelStyleClass = defaultActiveSkins.panelStyleClass;
        }

        // 4. Backgrounds (Pile e Matches) - Carregar individuais primeiro, depois o tema pode sobrescrever se estiver ativo e intacto
        // Pile Background (individual)
        const loadedPileBgDef = exampleSkinsData.find(s => s.id === parsedSkins.backgroundPile && s.type === 'backgroundPile');
        if (loadedPileBgDef && typeof loadedPileBgDef.preview === 'string' && parsedSkins.backgroundPile !== defaultActiveSkins.backgroundPile) {
            parsedSkins.backgroundPileUrl = loadedPileBgDef.preview;
        } else {
            parsedSkins.backgroundPile = defaultActiveSkins.backgroundPile;
            parsedSkins.backgroundPileUrl = defaultActiveSkins.backgroundPileUrl;
        }
        // Matches Background (individual)
        const loadedMatchesBgDef = exampleSkinsData.find(s => s.id === parsedSkins.backgroundMatches && s.type === 'backgroundMatches');
        if (loadedMatchesBgDef && typeof loadedMatchesBgDef.preview === 'string' && parsedSkins.backgroundMatches !== defaultActiveSkins.backgroundMatches) {
            parsedSkins.backgroundMatchesUrl = loadedMatchesBgDef.preview;
        } else {
            parsedSkins.backgroundMatches = defaultActiveSkins.backgroundMatches;
            parsedSkins.backgroundMatchesUrl = defaultActiveSkins.backgroundMatchesUrl;
        }

        // Se um themePack estiver ativo, seus estilos associados (incluindo painel) têm prioridade
        if (parsedSkins.themePack && parsedSkins.themePack !== defaultActiveSkins.themePack) {
          const themePackDef = exampleSkinsData.find(s => s.id === parsedSkins.themePack);
          // ... (lógica existente para paleta, fonte, botão, backgrounds do tema) ...

          // Estilo de Painel do Tema
          const themePanelStyleId = themePackDef?.associatedPanelStyleId;
          const userMadeSpecificPanelChoice =
            finalPanelStyleId !== themePanelStyleId &&
            finalPanelStyleId !== defaultActiveSkins.panelStyleId;

          if (themePanelStyleId && !userMadeSpecificPanelChoice) {
            const themePanelStyleDef = exampleSkinsData.find(s => s.id === themePanelStyleId && s.type === 'panelStyle');
            if (themePanelStyleDef && typeof themePanelStyleDef.preview === 'string') {
              finalPanelStyleId = themePanelStyleId;
              finalPanelStyleClass = themePanelStyleDef.preview;
            }
          }
        }
        // Reflete o estilo de painel determinado
        parsedSkins.panelStyleId = finalPanelStyleId;
        parsedSkins.panelStyleClass = finalPanelStyleClass;


        setActiveSkinsState(parsedSkins); // Set the state with potentially updated parsedSkins
        applySkinStyles(parsedSkins); // Apply all determined styles
      } else {
        // Aplica a paleta padrão inicial se nada estiver salvo
        applySkinStyles(defaultActiveSkins);
      }
    } catch (error) {
      console.error("Failed to load skins from localStorage", error);
      applySkinStyles(defaultActiveSkins); // Aplica defaults em caso de erro
    }
    setIsLoadingSkins(false);

    // Lógica de verificação de integridade do tema após o carregamento inicial
    // Isso garante que se o usuário salvou um tema, mas depois escolhas individuais
    // que o "quebram", o tema não seja mostrado como ativo.
    setActiveSkinsState(currentSkins => {
      if (currentSkins.themePack && currentSkins.themePack !== defaultActiveSkins.themePack) {
        const themePackDef = exampleSkinsData.find(s => s.id === currentSkins.themePack);
        let themeIsIntact = true;
        if (themePackDef) {
          if (themePackDef.associatedPaletteId && themePackDef.associatedPaletteId !== currentSkins.colorPalette) themeIsIntact = false;
          if (themePackDef.associatedFontId && themePackDef.associatedFontId !== currentSkins.font) themeIsIntact = false;
          if (themePackDef.associatedButtonStyleId && themePackDef.associatedButtonStyleId !== currentSkins.buttonStyleId) themeIsIntact = false;
          if (themePackDef.associatedPileBackgroundId && themePackDef.associatedPileBackgroundId !== currentSkins.backgroundPile) themeIsIntact = false;
          if (themePackDef.associatedPanelStyleId && themePackDef.associatedPanelStyleId !== currentSkins.panelStyleId) themeIsIntact = false;
          if (themePackDef.associatedMatchesBackgroundId && themePackDef.associatedMatchesBackgroundId !== currentSkins.backgroundMatches) themeIsIntact = false;
        } else {
          themeIsIntact = false; // ID do tema salvo mas definição não encontrada
        }

        if (!themeIsIntact) {
          const updatedSkins = { ...currentSkins, themePack: undefined }; // Ou defaultActiveSkins.themePack
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSkins));
          applySkinStyles(updatedSkins); // Reaplicar estilos com o tema desmarcado
          return updatedSkins;
        }
      }
      return currentSkins; // Nenhuma mudança necessária
    });

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

      // Se uma skin individual está sendo alterada e um tema customizado estava ativo,
      // o tema é "quebrado" (resetado para null).
      if (type !== 'themePack' && prevSkins.themePack && prevSkins.themePack !== defaultActiveSkins.themePack) {
        newSkins.themePack = undefined; // Ou defaultActiveSkins.themePack para reverter ao tema padrão
      }

      switch (type) {
        case 'backgroundPile':
          newSkins.backgroundPile = skinId;
          newSkins.backgroundPileUrl = isDefaultSkin ? undefined : (typeof previewValue === 'string' ? previewValue : undefined);
          break;
        case 'colorPalette':
          newSkins.colorPalette = skinId;
          if (skinDefinition && Array.isArray(skinDefinition.preview)) {
            newSkins.colorPaletteColors = skinDefinition.preview.slice(0, colorVariableNames.length);
            if (skinDefinition.preview.length < colorVariableNames.length) {
                for (let i = skinDefinition.preview.length; i < colorVariableNames.length; i++) {
                    newSkins.colorPaletteColors.push(defaultPalette[i]);
                }
            }
          } else {
            console.warn(`[SkinContext] Preview da paleta ${skinId} não é um array de cores ou skin não encontrada. Usando default.`);
            newSkins.colorPalette = defaultActiveSkins.colorPalette; // Fallback para ID da paleta padrão
            newSkins.colorPaletteColors = [...defaultPalette]; // Fallback para cores da paleta padrão
          }
          break;
        case 'font':
          newSkins.font = skinId;
          newSkins.fontFamily = typeof previewValue === 'string' ? previewValue : undefined;
          break;
        case 'backgroundMatches': // Movido para consistência com a ordem dos tipos
          newSkins.backgroundMatches = skinId;
          newSkins.backgroundMatchesUrl = isDefaultSkin ? undefined : (typeof previewValue === 'string' ? previewValue : undefined);
          break;
        case 'themePack':
          { // Abre um novo bloco de escopo para o case
            // eslint-disable-next-line no-case-declarations
            newSkins.themePack = skinId;
            const themePackDef = exampleSkinsData.find(s => s.id === skinId && s.type === 'themePack');
            if (themePackDef) {
              // Aplicar paleta associada
              const paletteId = themePackDef.associatedPaletteId;
              const paletteDef = paletteId ? exampleSkinsData.find(s => s.id === paletteId && s.type === 'colorPalette') : undefined;
              if (paletteDef && Array.isArray(paletteDef.preview)) {
                newSkins.colorPalette = paletteId; // Define o ID da paleta do tema
                newSkins.colorPaletteColors = paletteDef.preview.slice(0, colorVariableNames.length);
                if (paletteDef.preview.length < colorVariableNames.length) {
                  for (let i = paletteDef.preview.length; i < colorVariableNames.length; i++) {
                      newSkins.colorPaletteColors.push(defaultPalette[i]);
                  }
                }
              } else {
                newSkins.colorPalette = defaultActiveSkins.colorPalette; // Fallback para ID da paleta padrão
                newSkins.colorPaletteColors = [...defaultPalette]; // Fallback para cores da paleta padrão
              }
              // Aplicar fonte associada
              const fontId = themePackDef.associatedFontId;
              const fontDef = fontId ? exampleSkinsData.find(s => s.id === fontId && s.type === 'font') : undefined;
              if (fontDef && typeof fontDef.preview === 'string') {
                newSkins.font = fontId; // Define o ID da fonte do tema
                newSkins.fontFamily = fontDef.preview;
              } else {
                newSkins.font = defaultActiveSkins.font; // Fallback
                newSkins.fontFamily = defaultActiveSkins.fontFamily;
              }
              // Aplicar estilo de botão associado
              const buttonStyleId = themePackDef.associatedButtonStyleId;
              const buttonStyleDef = buttonStyleId ? exampleSkinsData.find(s => s.id === buttonStyleId && s.type === 'buttonStyle') : undefined;
              if (buttonStyleDef && typeof buttonStyleDef.preview === 'string') {
                newSkins.buttonStyleId = buttonStyleId;
                newSkins.buttonStyleClass = buttonStyleDef.preview;
              } else {
                newSkins.buttonStyleId = defaultActiveSkins.buttonStyleId;
                newSkins.buttonStyleClass = defaultActiveSkins.buttonStyleClass;
              }
              // Aplicar backgrounds associados
              // Pile Background
              const pileBgId = themePackDef.associatedPileBackgroundId;
              const pileBgDef = pileBgId ? exampleSkinsData.find(s => s.id === pileBgId && s.type === 'backgroundPile') : undefined;
              if (pileBgDef && typeof pileBgDef.preview === 'string') {
                newSkins.backgroundPile = pileBgId;
                newSkins.backgroundPileUrl = pileBgDef.preview;
              } else { // Fallback se não encontrado ou não definido no tema
                newSkins.backgroundPile = defaultActiveSkins.backgroundPile;
                newSkins.backgroundPileUrl = defaultActiveSkins.backgroundPileUrl;
              }
              // Matches Background
              const matchesBgId = themePackDef.associatedMatchesBackgroundId;
              const matchesBgDef = matchesBgId ? exampleSkinsData.find(s => s.id === matchesBgId && s.type === 'backgroundMatches') : undefined;
              if (matchesBgDef && typeof matchesBgDef.preview === 'string') {
                newSkins.backgroundMatches = matchesBgId;
                newSkins.backgroundMatchesUrl = matchesBgDef.preview;
              } else { // Fallback
                newSkins.backgroundMatches = defaultActiveSkins.backgroundMatches;
                newSkins.backgroundMatchesUrl = defaultActiveSkins.backgroundMatchesUrl;
              }
              // Aplicar estilo de painel associado
              const panelStyleId = themePackDef.associatedPanelStyleId;
              const panelStyleDef = panelStyleId ? exampleSkinsData.find(s => s.id === panelStyleId && s.type === 'panelStyle') : undefined;
              if (panelStyleDef && typeof panelStyleDef.preview === 'string') {
                newSkins.panelStyleId = panelStyleId;
                newSkins.panelStyleClass = panelStyleDef.preview;
              } else { // Fallback para o default
                newSkins.panelStyleId = defaultActiveSkins.panelStyleId;
                newSkins.panelStyleClass = defaultActiveSkins.panelStyleClass;
              }
            }
          } // Fecha o novo bloco de escopo
          break;
        case 'buttonStyle':
          newSkins.buttonStyleId = skinId;
          newSkins.buttonStyleClass = typeof previewValue === 'string' ? previewValue : defaultActiveSkins.buttonStyleClass;
          break;
        case 'panelStyle':
          newSkins.panelStyleId = skinId;
          newSkins.panelStyleClass = typeof previewValue === 'string' ? previewValue : defaultActiveSkins.panelStyleClass;
          break;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSkins));
      applySkinStyles(newSkins); // Aplica os estilos imediatamente
      return newSkins;
    });
  }, [applySkinStyles]);
  
  // Efeito para aplicar/remover a classe de estilo de painel no elemento <html>
  useEffect(() => {
    const htmlElement = document.documentElement;
    // Remover todas as classes de estilo de painel conhecidas
    exampleSkinsData.forEach(skin => {
      if (skin.type === 'panelStyle' && typeof skin.preview === 'string' && skin.preview !== activeSkins.panelStyleClass) {
        htmlElement.classList.remove(skin.preview);
      }
    });
    // Garante que a classe padrão seja removida se não for a ativa
    if (defaultActiveSkins.panelStyleClass && defaultActiveSkins.panelStyleClass !== activeSkins.panelStyleClass) {
      htmlElement.classList.remove(defaultActiveSkins.panelStyleClass);
    }

    // Aplicar a classe correta
    if (activeSkins.panelStyleClass && !htmlElement.classList.contains(activeSkins.panelStyleClass)) {
      htmlElement.classList.add(activeSkins.panelStyleClass);
    }
  }, [activeSkins.panelStyleClass]); // Agora depende diretamente da propriedade em activeSkins

  return (
    <SkinContext.Provider value={{ activeSkins, setActiveSkin, isLoadingSkins, applySkinStyles, panelStyleId: activeSkins.panelStyleId, panelStyleClass: activeSkins.panelStyleClass }}>
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
