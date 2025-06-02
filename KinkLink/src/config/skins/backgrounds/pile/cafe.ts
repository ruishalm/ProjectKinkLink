// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\backgrounds\pile\cafe.ts
import { type SkinDefinition } from '../../skinTypes';

export const bgPileCafe: SkinDefinition = {
  id: 'bg_pile_cafe',
  name: 'Café (Pilha)',
  type: 'backgroundPile',
  preview: '/assets/skins/textures/cafe.jpg', // Mesmo preview do matches
  unlockCriteria: { type: 'matches', count: 10, description: 'Consiga 10 Links' } // Mesmo critério do matches
};