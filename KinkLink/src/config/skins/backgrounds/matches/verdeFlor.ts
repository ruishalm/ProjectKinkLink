// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\backgrounds\matches\verdeFlor.ts
import { type SkinDefinition } from '../../skinTypes';

export const bgMatchesVerdeFlor: SkinDefinition = {
  id: 'bg_match_verde_flor',
  name: 'Verde Flor (Matches)',
  type: 'backgroundMatches',
  preview: '/assets/skins/textures/verdeFlor.jpg', // Mesmo preview do pile
  unlockCriteria: { type: 'matches', count: 15, description: 'Consiga 15 Links' } // Mesmo critério do pile
};