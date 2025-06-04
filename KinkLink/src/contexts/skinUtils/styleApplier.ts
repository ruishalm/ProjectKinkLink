// src/contexts/skinUtils/styleApplier.ts
import type { ActiveSkinSettings } from '../../config/skins/skinTypes';
import { defaultActiveSkins, colorVariableNames, defaultPalette } from './skinConstants';

// eslint-disable-next-line prefer-const
let previouslyAppliedClasses = {
    theme: '',
    button: defaultActiveSkins.buttonStyleClass || '',
    panel: defaultActiveSkins.panelStyleClass || '',
};

export const applyStylesAndClasses = (newSkins: ActiveSkinSettings): void => {
  const root = document.documentElement;

  const newThemeClass = newSkins.themePack && newSkins.themePack !== defaultActiveSkins.themePack
    ? `theme-pack-${newSkins.themePack.replace(/_/g, '-')}`
    : '';

  if (previouslyAppliedClasses.theme && previouslyAppliedClasses.theme !== newThemeClass) {
    root.classList.remove(previouslyAppliedClasses.theme);
  }
  if (newThemeClass && !root.classList.contains(newThemeClass)) {
    root.classList.add(newThemeClass);
  }
  previouslyAppliedClasses.theme = newThemeClass;

  const newButtonClass = newSkins.buttonStyleClass || defaultActiveSkins.buttonStyleClass!;
  if (previouslyAppliedClasses.button && previouslyAppliedClasses.button !== newButtonClass) {
    root.classList.remove(previouslyAppliedClasses.button);
  }
  if (newButtonClass && !root.classList.contains(newButtonClass)) {
    root.classList.add(newButtonClass);
  }
  previouslyAppliedClasses.button = newButtonClass;

  const newPanelClass = newSkins.panelStyleClass || defaultActiveSkins.panelStyleClass!;
  if (previouslyAppliedClasses.panel && previouslyAppliedClasses.panel !== newPanelClass) {
    root.classList.remove(previouslyAppliedClasses.panel);
  }
  if (newPanelClass && !root.classList.contains(newPanelClass)) {
    root.classList.add(newPanelClass);
  }
  previouslyAppliedClasses.panel = newPanelClass;

  if (newSkins.backgroundPileUrl) root.style.setProperty('--bg-pile-url', `url("${newSkins.backgroundPileUrl}")`);
  else root.style.removeProperty('--bg-pile-url');

  if (newSkins.backgroundMatchesUrl) root.style.setProperty('--bg-matches-url', `url("${newSkins.backgroundMatchesUrl}")`);
  else root.style.removeProperty('--bg-matches-url');

  const currentPalette = newSkins.colorPaletteColors && newSkins.colorPaletteColors.length === colorVariableNames.length
    ? newSkins.colorPaletteColors
    : defaultPalette;
  colorVariableNames.forEach((varName, index) => {
    const colorValue = currentPalette[index] !== undefined ? currentPalette[index] : defaultPalette[index];
    if (colorValue !== undefined) {
      root.style.setProperty(varName, colorValue);
    } else {
      root.style.removeProperty(varName);
    }
  });

  const defaultSystemFontStack = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif';
  const fontFamilyToApply = newSkins.fontFamily || defaultActiveSkins.fontFamily || defaultSystemFontStack;
  root.style.setProperty('--font-family-main', fontFamilyToApply);
};