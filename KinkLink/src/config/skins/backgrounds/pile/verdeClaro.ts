// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\backgrounds\pile\verdeClaro.ts
import { type SkinDefinition } from '../../skinTypes';

export const bgPileVerdeClaro: SkinDefinition = {
  id: 'bg_pile_verde_claro',
  name: 'Verde Claro (Pilha)',
  type: 'backgroundPile',
  preview: '/assets/skins/textures/verdeClaro.jpg', // Mesmo preview do matches
  unlockCriteria: { type: 'seenCards', count: 100, description: 'Veja 100 cartas' } // Mesmo critério do matches
};