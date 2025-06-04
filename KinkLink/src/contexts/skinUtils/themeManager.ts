// src/contexts/skinUtils/themeManager.ts
import type { SkinDefinition, ActiveSkinSettings } from '../../config/skins/skinTypes';
import { defaultActiveSkins, defaultPalette, colorVariableNames, CUSTOM_THEME_ID } from './skinConstants';
// exampleSkinsData é esperado como parâmetro nas funções

export const getThemeAppliedSettings = (
  themeId: string | undefined,
  allSkins: SkinDefinition[]
): Partial<ActiveSkinSettings> => {
  const actualThemeId = themeId || defaultActiveSkins.themePack; // Se themeId for undefined, usa o defaultActiveSkins.themePack
  const themeDef = allSkins.find(s => s.id === actualThemeId && s.type === 'themePack');

  if (!themeDef) {
    console.warn(`[ThemeManager] Definição do pacote de tema "${actualThemeId}" não encontrada. Aplicando defaults completos.`);
    return {
        themePack: defaultActiveSkins.themePack, // Retorna o ID do tema padrão
        colorPalette: defaultActiveSkins.colorPalette,
        colorPaletteColors: [...defaultPalette],
        font: defaultActiveSkins.font,
        fontFamily: defaultActiveSkins.fontFamily,
        buttonStyleId: defaultActiveSkins.buttonStyleId,
        buttonStyleClass: defaultActiveSkins.buttonStyleClass,
        panelStyleId: defaultActiveSkins.panelStyleId,
        panelStyleClass: defaultActiveSkins.panelStyleClass,
        backgroundPile: defaultActiveSkins.backgroundPile,
        backgroundPileUrl: defaultActiveSkins.backgroundPileUrl,
        backgroundMatches: defaultActiveSkins.backgroundMatches,
        backgroundMatchesUrl: defaultActiveSkins.backgroundMatchesUrl,
    };
  }

  const settings: Partial<ActiveSkinSettings> = { themePack: themeDef.id };

  const findSkinDef = (id: string | undefined, type: SkinDefinition['type']) => {
    if (!id) return undefined;
    return allSkins.find(s => s.id === id && s.type === type);
  };

  // Paleta
  const paletteDef = findSkinDef(themeDef.associatedPaletteId, 'colorPalette');
  if (paletteDef && Array.isArray(paletteDef.preview)) {
    settings.colorPalette = paletteDef.id;
    const colors = paletteDef.preview.slice(0, colorVariableNames.length);
    settings.colorPaletteColors = colors.concat(defaultPalette.slice(colors.length));
  } else {
    settings.colorPalette = defaultActiveSkins.colorPalette;
    settings.colorPaletteColors = [...defaultPalette];
  }

  // Fonte
  const fontDef = findSkinDef(themeDef.associatedFontId, 'font');
  if (fontDef && typeof fontDef.preview === 'string') {
    settings.font = fontDef.id;
    settings.fontFamily = fontDef.preview;
  } else {
    settings.font = defaultActiveSkins.font;
    settings.fontFamily = defaultActiveSkins.fontFamily;
  }

  // Estilo de Botão
  const buttonDef = findSkinDef(themeDef.associatedButtonStyleId, 'buttonStyle');
  if (buttonDef && typeof buttonDef.preview === 'string') {
    settings.buttonStyleId = buttonDef.id;
    settings.buttonStyleClass = buttonDef.preview;
  } else {
    settings.buttonStyleId = defaultActiveSkins.buttonStyleId;
    settings.buttonStyleClass = defaultActiveSkins.buttonStyleClass;
  }

  // Estilo de Painel
  const panelDef = findSkinDef(themeDef.associatedPanelStyleId, 'panelStyle');
  if (panelDef && typeof panelDef.preview === 'string') {
    settings.panelStyleId = panelDef.id;
    settings.panelStyleClass = panelDef.preview;
  } else {
    settings.panelStyleId = defaultActiveSkins.panelStyleId;
    settings.panelStyleClass = defaultActiveSkins.panelStyleClass;
  }

  // Background Pile
  const pileBgDef = findSkinDef(themeDef.associatedPileBackgroundId, 'backgroundPile');
  if (pileBgDef && typeof pileBgDef.preview === 'string') {
    settings.backgroundPile = pileBgDef.id;
    settings.backgroundPileUrl = pileBgDef.preview;
  } else {
    settings.backgroundPile = defaultActiveSkins.backgroundPile;
    settings.backgroundPileUrl = defaultActiveSkins.backgroundPileUrl;
  }

  // Background Matches
  const matchesBgDef = findSkinDef(themeDef.associatedMatchesBackgroundId, 'backgroundMatches');
  if (matchesBgDef && typeof matchesBgDef.preview === 'string') {
    settings.backgroundMatches = matchesBgDef.id;
    settings.backgroundMatchesUrl = matchesBgDef.preview;
  } else {
    settings.backgroundMatches = defaultActiveSkins.backgroundMatches;
    settings.backgroundMatchesUrl = defaultActiveSkins.backgroundMatchesUrl;
  }
  return settings;
};

export const checkThemeIntegrity = (
  currentSkins: ActiveSkinSettings,
  allSkins: SkinDefinition[]
): ActiveSkinSettings => {
  if (currentSkins.themePack === CUSTOM_THEME_ID ||
      !currentSkins.themePack // Se themePack for undefined ou null
     ) {
    // Se já é customizado ou não tem tema definido, está "integro" ou não aplicável.
    return currentSkins;
  }
  // Se é o tema padrão, ele é sempre considerado "íntegro" em relação a si mesmo.
  // A modificação de um tema padrão o tornará CUSTOM_THEME_ID em setActiveSkin.
  if (currentSkins.themePack === defaultActiveSkins.themePack) {
      return currentSkins;
  }


  const themeDef = allSkins.find(s => s.id === currentSkins.themePack && s.type === 'themePack');
  if (!themeDef) {
    console.warn(`[ThemeManager] checkThemeIntegrity: Tema ativo "${currentSkins.themePack}" não encontrado. Alterando para "${CUSTOM_THEME_ID}".`);
    return { ...currentSkins, themePack: CUSTOM_THEME_ID };
  }

  let themeIsIntact = true;
  if (themeDef.associatedPaletteId && themeDef.associatedPaletteId !== currentSkins.colorPalette) themeIsIntact = false;
  if (themeDef.associatedFontId && themeDef.associatedFontId !== currentSkins.font) themeIsIntact = false;
  if (themeDef.associatedButtonStyleId && themeDef.associatedButtonStyleId !== currentSkins.buttonStyleId) themeIsIntact = false;
  if (themeDef.associatedPanelStyleId && themeDef.associatedPanelStyleId !== currentSkins.panelStyleId) themeIsIntact = false;
  if (themeDef.associatedPileBackgroundId && themeDef.associatedPileBackgroundId !== currentSkins.backgroundPile) themeIsIntact = false;
  if (themeDef.associatedMatchesBackgroundId && themeDef.associatedMatchesBackgroundId !== currentSkins.backgroundMatches) themeIsIntact = false;

  if (!themeIsIntact) {
    console.log(`[ThemeManager] checkThemeIntegrity: Tema "${currentSkins.themePack}" quebrado. Alterando para "${CUSTOM_THEME_ID}".`);
    return { ...currentSkins, themePack: CUSTOM_THEME_ID };
  }
  return currentSkins;
};