// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\palettes\paletteWindowsXP.ts
import { type SkinDefinition } from '../skinTypes';

const paletteWindowsXP: SkinDefinition = {
  id: 'palette-windows-xp',
  name: 'Windows XP Clássico',
  type: 'colorPalette',
  description: 'As cores nostálgicas do Windows XP.',
  preview: [
    '#0058E6', // Azul XP (barra de título, principal)
    '#ECE9D8', // Cinza de Botão/Janela XP (para face de botões, fundos claros, superfície da janela)
    'transparent', // Fundo de Janela/Elemento (Transparente, conforme solicitado)
    '#F5F5F5', // Cinza Escuro (substituindo o verde, conforme solicitado)
    '#000000', // Preto (texto principal)
  ],
};

export default paletteWindowsXP;