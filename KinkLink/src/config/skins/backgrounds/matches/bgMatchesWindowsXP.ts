// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\backgrounds\matches\bgMatchesWindowsXP.ts
import { type SkinDefinition } from '../../skinTypes'; // Ajustado o caminho para skinTypes

const bgMatchesWindowsXP: SkinDefinition = {
  id: 'bg-matches-windows-xp',
  name: 'Janela XP (Links)', // Nome atualizado para refletir a "janela"
  type: 'backgroundMatches',
  description: 'Um fundo para a tela de links que simula uma janela do Windows XP sobre o desktop azul.',
  preview: 'xp-window-background-skin',
  unlockCriteria: { type: 'matches', count: -1, description: 'Disponível para Apoiadores' } // Nome da classe CSS que criamos em index.css
};

export default bgMatchesWindowsXP;
