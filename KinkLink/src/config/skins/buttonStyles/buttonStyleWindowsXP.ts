// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\buttons\buttonStyleWindowsXP.ts
import { type SkinDefinition } from '../skinTypes';

const buttonStyleWindowsXP: SkinDefinition = {
  id: 'button-style-windows-xp',
  name: 'Botão Estilo XP',
  type: 'buttonStyle',
  description: 'Botões com a aparência clássica do Windows XP.',
  preview: 'xp-button-style', // Nome da classe CSS que vamos criar
  unlockCriteria: { type: 'matches', count: -1, description: 'Disponível para Apoiadores' }
};

export default buttonStyleWindowsXP;