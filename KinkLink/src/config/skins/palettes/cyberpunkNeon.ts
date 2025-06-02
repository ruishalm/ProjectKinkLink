// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\palettes\cyberpunkNeon.ts
import { type SkinDefinition } from '../skinTypes';

export const paletteCyberpunkNeon: SkinDefinition = {
  id: 'palette_cyberpunk_neon',
  name: 'Cyberpunk Neon (Paleta)',
  type: 'colorPalette',
  preview: [
    '#39FF14', // --cor-primaria (Verde Neon)
    '#FF00FF', // --cor-secundaria (Magenta Neon - Rosa)
    '#2B0000', // --cor-fundo-pagina (Vermelho Sangue Muito Escuro)
    '#1A1A1A', // --cor-fundo-elemento (Preto Brilhante / Cinza Muito Escuro)
    '#FFFFFF', // --cor-texto-primario (Branco Puro) - Mantido
    '#CCCCCC', // --cor-texto-secundario (Cinza Claro) - Mantido
    '#000000', // --cor-texto-sobre-primaria (Preto para contraste com Verde Neon)
    '#000000', // --cor-texto-sobre-secundaria (Preto para contraste com Magenta Neon)
    '#333333', // --cor-borda (Cinza Escuro para bordas sutis) - Mantido
    '#FFFF00', // --cor-acao-positiva (Amarelo Neon)
    '#000000', // --cor-texto-acao-positiva (Preto) - Mantido (sobre Amarelo Neon)
    '#9D00FF', // --cor-acao-negativa (Roxo Neon Intenso) - Mantido
    '#FFFFFF', // --cor-texto-acao-negativa (Branco)
    '#00FFFF', // --cor-aviso (Ciano Neon)
    '#FF5F00', // --cor-destaque (Laranja Neon)
    '#000000', // --cor-texto-sobre-destaque (Preto)
    'rgba(0,0,0,0.85)' // --cor-overlay (Overlay Preto Transparente) - Mantido
  ]
};