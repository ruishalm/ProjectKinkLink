// src/contexts/skinUtils/skinConstants.ts
import type { ActiveSkinSettings } from '../../config/skins/skinTypes';

export const LOCAL_STORAGE_KEY = 'kinklink_active_skins';

export const CUSTOM_THEME_ID = 'pack_custom'; // Novo ID para temas personalizados

export const colorVariableNames = [
  '--cor-primaria',
  '--cor-secundaria',
  '--cor-fundo-pagina',
  '--cor-fundo-elemento',
  '--cor-texto-primario',
  '--cor-texto-secundario',
  '--cor-texto-sobre-primaria',
  '--cor-texto-sobre-secundaria',
  '--cor-borda',
  '--cor-acao-positiva',
  '--cor-texto-acao-positiva',
  '--cor-acao-negativa',
  '--cor-texto-acao-negativa',
  '--cor-aviso',
  '--cor-destaque',
  '--cor-texto-sobre-destaque',
  '--cor-overlay',
];

export const defaultPalette: string[] = [
    '#FF69B4', '#5C5C5C', '#1e1e1e', '#2a2a2a', '#f0f0f0', '#b0b0b0', '#FFFFFF', '#FFFFFF',
    '#3f3f3f', '#4CAF50', '#FFFFFF', '#F44336', '#FFFFFF', '#FFC107', '#64b5f6', '#111111',
    'rgba(0, 0, 0, 0.7)'
];

export const defaultActiveSkins: ActiveSkinSettings = {
  backgroundPile: 'bg_pile_default',
  backgroundPileUrl: undefined,
  backgroundMatches: 'bg_match_default',
  backgroundMatchesUrl: undefined,
  colorPalette: 'palette_default',
  colorPaletteColors: [...defaultPalette],
  font: 'font_default',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif',
  themePack: 'pack_default', // O tema padrão que pode ser explicitamente selecionado
  buttonStyleId: 'btn_style_default',
  buttonStyleClass: 'klnkl-btn-style-default',
  panelStyleId: 'panel_style_default',
  panelStyleClass: 'klnkl-panel-default-active',
};