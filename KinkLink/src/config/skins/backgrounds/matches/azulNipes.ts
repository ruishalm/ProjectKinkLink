// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\backgrounds\matches\azulNipes.ts
import { type SkinDefinition } from '../../skinTypes';

export const bgMatchesAzulNipes: SkinDefinition = {
  id: 'bg_match_azul_nipes',
  name: 'Azul Naipes (Matches)',
  type: 'backgroundMatches',
  preview: '/assets/skins/textures/azulNipes.jpg', // Mesmo preview do pile
  unlockCriteria: { type: 'matches', count: 5, description: 'Consiga 5 Links' } // Mesmo critério do pile
};