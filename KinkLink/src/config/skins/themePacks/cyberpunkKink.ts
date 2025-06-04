// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\themePacks\cyberpunkKink.ts
import { type SkinDefinition } from '../skinTypes';

export const packCyberpunkKink: SkinDefinition = {
  id: 'pack_cyberpunk_kink',
  name: 'Cyberpunk Kink',
  type: 'themePack',
  description: 'Neon, tecnologia e atitude. Botões com chanfros em breve!',
  associatedPaletteId: 'palette_cyberpunk_neon',
  associatedFontId: 'font_chakra_petch', // Atualizado para Chakra Petch
  associatedButtonStyleId: 'btn_style_cyberpunk',
  associatedPileBackgroundId: 'bg_pile_cyberpunk_panos', // Novo
  associatedMatchesBackgroundId: 'bg_matches_cyberpunk_panos', // Novo
  associatedPanelStyleId: 'panel_style_cyberpunk', // CORRIGIDO para usar o painel Cyberpunk
  unlockCriteria: { type: 'userCreatedCards', count: 5, description: 'Crie 5 cartas personalizadas' }
};