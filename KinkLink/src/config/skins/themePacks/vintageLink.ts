// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\themePacks\vintageLink.ts
import { type SkinDefinition } from '../skinTypes';

export const packVintageLink: SkinDefinition = {
  id: 'pack_vintage_link',
  name: 'Vintage Link',
  type: 'themePack',
  description: ' ',
  associatedPaletteId: 'palette_vintage_sepia',
  associatedFontId: 'font_merriweather',
  associatedButtonStyleId: 'btn_style_vintage',
  associatedPanelStyleId: 'panel_style_default', // Adicionado
  unlockCriteria: { type: 'matches', count: 25, description: 'Consiga 25 Links' }
};