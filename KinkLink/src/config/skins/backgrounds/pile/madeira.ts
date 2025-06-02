// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\backgrounds\pile\madeira.ts
import { type SkinDefinition } from '../../skinTypes';

export const bgPileMadeira: SkinDefinition = {
  id: 'bg_pile_madeira',
  name: 'Madeira (Pilha)',
  type: 'backgroundPile',
  preview: '/assets/skins/textures/madeira.jpg',
  unlockCriteria: { type: 'seenCards', count: 50, description: 'Veja 50 cartas' }
};