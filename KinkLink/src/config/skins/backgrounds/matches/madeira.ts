// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\backgrounds\matches\madeira.ts
import { type SkinDefinition } from '../../skinTypes';

export const bgMatchesMadeira: SkinDefinition = {
  id: 'bg_match_madeira',
  name: 'Madeira (Matches)',
  type: 'backgroundMatches',
  preview: '/assets/skins/textures/madeira.jpg', // Mesmo preview do pile
  unlockCriteria: { type: 'seenCards', count: 50, description: 'Veja 50 cartas' } // Mesmo critério do pile
};