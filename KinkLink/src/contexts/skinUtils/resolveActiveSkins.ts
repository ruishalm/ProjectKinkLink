// src/contexts/skinUtils/resolveActiveSkins.ts
import type { SkinDefinition, ActiveSkinSettings } from '../../config/skins/skinTypes';
import { defaultActiveSkins, defaultPalette, colorVariableNames, LOCAL_STORAGE_KEY } from './skinConstants';
// exampleSkinsData será passado como argumento para loadAndResolveInitialSkins

// Função auxiliar interna para encontrar uma skin e seu preview
const findSkinPreview = (
    skinId: string | undefined,
    type: SkinDefinition['type'],
    allSkins: SkinDefinition[]
): { definition?: SkinDefinition, preview?: string | string[] } => {
  if (!skinId) return {};
  const definition = allSkins.find(s => s.id === skinId && s.type === type);
  return { definition, preview: definition?.preview };
};

// Determina a paleta de cores ativa
const resolveActivePaletteDetails = (
  savedPaletteId: string | undefined,
  activeThemePackDef: SkinDefinition | undefined,
  allSkins: SkinDefinition[]
): { id: string; colors: string[] } => {
  let chosenPaletteId = defaultActiveSkins.colorPalette!;
  let chosenColors = [...defaultPalette];

  const themePaletteId = activeThemePackDef?.associatedPaletteId;
  if (themePaletteId) {
    const { definition: themePaletteDef, preview: themePreview } = findSkinPreview(themePaletteId, 'colorPalette', allSkins);
    if (themePaletteDef && Array.isArray(themePreview)) {
      chosenPaletteId = themePaletteDef.id;
      const tempColors = themePreview.slice(0, colorVariableNames.length);
      chosenColors = tempColors.concat(defaultPalette.slice(tempColors.length));
    }
  }

  if (savedPaletteId && savedPaletteId !== chosenPaletteId) {
    const { definition: savedPaletteDef, preview: savedPreview } = findSkinPreview(savedPaletteId, 'colorPalette', allSkins);
    if (savedPaletteDef && Array.isArray(savedPreview)) {
        chosenPaletteId = savedPaletteDef.id;
        const tempColors = savedPreview.slice(0, colorVariableNames.length);
        chosenColors = tempColors.concat(defaultPalette.slice(tempColors.length));
    } else if (!themePaletteId) {
        chosenPaletteId = defaultActiveSkins.colorPalette!;
        chosenColors = [...defaultPalette];
    }
  }
  return { id: chosenPaletteId, colors: chosenColors };
};

// Determina a fonte ativa
const resolveActiveFontDetails = (
  savedFontId: string | undefined,
  activeThemePackDef: SkinDefinition | undefined,
  allSkins: SkinDefinition[]
): { id: string; fontFamily: string | undefined } => {
  let chosenFontId = defaultActiveSkins.font!;
  let chosenFontFamily = defaultActiveSkins.fontFamily;

  const themeFontId = activeThemePackDef?.associatedFontId;
  if (themeFontId) {
    const { definition: themeFontDef, preview: themePreview } = findSkinPreview(themeFontId, 'font', allSkins);
    if (themeFontDef && typeof themePreview === 'string') {
      chosenFontId = themeFontDef.id;
      chosenFontFamily = themePreview;
    }
  }

  if (savedFontId && savedFontId !== chosenFontId) {
    const { definition: savedFontDef, preview: savedPreview } = findSkinPreview(savedFontId, 'font', allSkins);
    if (savedFontDef && typeof savedPreview === 'string') {
        chosenFontId = savedFontDef.id;
        chosenFontFamily = savedPreview;
    } else if (!themeFontId) {
        chosenFontId = defaultActiveSkins.font!;
        chosenFontFamily = defaultActiveSkins.fontFamily;
    }
  }
  return { id: chosenFontId, fontFamily: chosenFontFamily };
};

// Determina o estilo ativo (botão ou painel)
const resolveActiveStyleDetails = (
  styleType: 'buttonStyle' | 'panelStyle',
  savedStyleId: string | undefined,
  savedStyleClassFromStorage: string | undefined,
  activeThemePackDef: SkinDefinition | undefined,
  allSkins: SkinDefinition[]
): { id: string; className: string } => {
  const defaultId = (styleType === 'buttonStyle' ? defaultActiveSkins.buttonStyleId : defaultActiveSkins.panelStyleId)!;
  const defaultClassName = (styleType === 'buttonStyle' ? defaultActiveSkins.buttonStyleClass : defaultActiveSkins.panelStyleClass)!;

  let chosenStyleId = defaultId;
  let chosenClassName = defaultClassName;

  const themeStyleId = styleType === 'buttonStyle'
    ? activeThemePackDef?.associatedButtonStyleId
    : activeThemePackDef?.associatedPanelStyleId;

  if (themeStyleId) {
    const { definition: themeStyleDef, preview: themePreview } = findSkinPreview(themeStyleId, styleType, allSkins);
    if (themeStyleDef && typeof themePreview === 'string') {
      chosenStyleId = themeStyleDef.id;
      chosenClassName = themePreview;
    }
  }

  if (savedStyleId && savedStyleId !== chosenStyleId) {
      const finalSavedStyleClass = savedStyleClassFromStorage || (findSkinPreview(savedStyleId, styleType, allSkins).preview as string | undefined);
      if (finalSavedStyleClass) {
          chosenStyleId = savedStyleId;
          chosenClassName = finalSavedStyleClass;
      } else if (!themeStyleId) {
          chosenStyleId = defaultId;
          chosenClassName = defaultClassName;
      }
  }
  return { id: chosenStyleId, className: chosenClassName };
};

// Determina o background ativo (pilha ou matches)
const resolveActiveBackgroundDetails = (
  bgType: 'backgroundPile' | 'backgroundMatches',
  savedBgId: string | undefined,
  activeThemePackDef: SkinDefinition | undefined,
  allSkins: SkinDefinition[]
): { id: string; url: string | undefined } => {
  const defaultId = (bgType === 'backgroundPile' ? defaultActiveSkins.backgroundPile : defaultActiveSkins.backgroundMatches)!;
  const defaultUrl = bgType === 'backgroundPile' ? defaultActiveSkins.backgroundPileUrl : defaultActiveSkins.backgroundMatchesUrl;

  let chosenBgId = defaultId;
  let chosenBgUrl = defaultUrl;

  const themeBgId = bgType === 'backgroundPile'
    ? activeThemePackDef?.associatedPileBackgroundId
    : activeThemePackDef?.associatedMatchesBackgroundId;

  if (themeBgId) {
    const { definition: themeBgDef, preview: themePreview } = findSkinPreview(themeBgId, bgType, allSkins);
    if (themeBgDef && typeof themePreview === 'string') {
      chosenBgId = themeBgDef.id;
      chosenBgUrl = themePreview;
    }
  }

  if (savedBgId && savedBgId !== chosenBgId) {
    const { definition: savedBgDef, preview: savedPreview } = findSkinPreview(savedBgId, bgType, allSkins);
    if (savedBgDef && typeof savedPreview === 'string') {
        chosenBgId = savedBgDef.id;
        chosenBgUrl = savedPreview;
    } else if (!themeBgId) {
        chosenBgId = defaultId;
        chosenBgUrl = defaultUrl;
    }
  }
  return { id: chosenBgId, url: chosenBgUrl };
};

export const loadAndResolveInitialSkins = (
    allSkinsData: SkinDefinition[]
): ActiveSkinSettings => {
    let loadedFromStorage: Partial<ActiveSkinSettings> = {};
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            loadedFromStorage = JSON.parse(stored);
        }
    } catch (error) {
        console.error("Erro ao carregar skins do localStorage:", error);
    }

    const activeThemePackDef = loadedFromStorage.themePack
        ? allSkinsData.find(s => s.id === loadedFromStorage.themePack && s.type === 'themePack')
        : undefined;

    const paletteDetails = resolveActivePaletteDetails(loadedFromStorage.colorPalette, activeThemePackDef, allSkinsData);
    const fontDetails = resolveActiveFontDetails(loadedFromStorage.font, activeThemePackDef, allSkinsData);
    const buttonStyleDetails = resolveActiveStyleDetails('buttonStyle', loadedFromStorage.buttonStyleId, loadedFromStorage.buttonStyleClass, activeThemePackDef, allSkinsData);
    const panelStyleDetails = resolveActiveStyleDetails('panelStyle', loadedFromStorage.panelStyleId, loadedFromStorage.panelStyleClass, activeThemePackDef, allSkinsData);
    const pileBgDetails = resolveActiveBackgroundDetails('backgroundPile', loadedFromStorage.backgroundPile, activeThemePackDef, allSkinsData);
    const matchesBgDetails = resolveActiveBackgroundDetails('backgroundMatches', loadedFromStorage.backgroundMatches, activeThemePackDef, allSkinsData);

    return {
        themePack: loadedFromStorage.themePack || defaultActiveSkins.themePack,
        colorPalette: paletteDetails.id,
        colorPaletteColors: paletteDetails.colors,
        font: fontDetails.id,
        fontFamily: fontDetails.fontFamily,
        buttonStyleId: buttonStyleDetails.id,
        buttonStyleClass: buttonStyleDetails.className,
        panelStyleId: panelStyleDetails.id,
        panelStyleClass: panelStyleDetails.className,
        backgroundPile: pileBgDetails.id,
        backgroundPileUrl: pileBgDetails.url,
        backgroundMatches: matchesBgDetails.id,
        backgroundMatchesUrl: matchesBgDetails.url,
    };
};