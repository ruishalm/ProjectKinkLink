// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\palettes\oceanDeep.ts
import { type SkinDefinition } from '../skinTypes';

export const paletteOceanDeep: SkinDefinition = {
  id: 'palette_ocean_deep',
  name: 'Oceano Profundo',
  type: 'colorPalette',
  preview: [
    '#1E90FF', // --cor-primaria (Azul Dodger)
    '#1976D2', // --cor-secundaria (Azul Escuro)
    '#000033', // --cor-fundo-pagina (Azul Marinho Muito Escuro)
    '#0D47A1', // --cor-fundo-elemento (Azul Mais Escuro)
    '#E0FFFF', // --cor-texto-primario (Azul Claro Quase Branco)
    '#ADD8E6', // --cor-texto-secundario (Azul Claro)
    '#FFFFFF', // --cor-texto-sobre-primaria (Branco)
    '#E0FFFF', // --cor-texto-sobre-secundaria (Azul Claro Quase Branco)
    '#00BFFF', // --cor-borda (Azul Céu Profundo)
    '#32CD32', // --cor-acao-positiva (Verde Lima)
    '#FFFFFF', // --cor-texto-acao-positiva (Branco)
    '#FF6347', // --cor-acao-negativa (Tomate)
    '#FFFFFF', // --cor-texto-acao-negativa (Branco)
    '#FFD700', // --cor-aviso (Dourado)
    '#90CAF9', // --cor-destaque (Azul Bebê)
    '#000033', // --cor-texto-sobre-destaque (Azul Marinho Muito Escuro)
    'rgba(0,0,51,0.85)' // --cor-overlay (Overlay Azul Escuro Transparente)
  ],
  unlockCriteria: { type: 'seenCards', count: 25, description: 'Veja 25 cartas' }
};