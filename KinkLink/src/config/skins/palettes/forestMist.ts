// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\palettes\forestMist.ts
import { type SkinDefinition } from '../skinTypes';

export const paletteForestMist: SkinDefinition = {
  id: 'palette_forest_mist',
  name: 'Névoa da Floresta',
  type: 'colorPalette',
  preview: [
    '#2E7D32', // --cor-primaria (Verde Escuro)
    '#1B5E20', // --cor-secundaria (Verde Mais Escuro)
    '#0A1F08', // --cor-fundo-pagina (Verde Quase Preto)
    '#10350E', // --cor-fundo-elemento (Verde Bem Escuro)
    '#A5D6A7', // --cor-texto-primario (Verde Claro)
    '#81C784', // --cor-texto-secundario (Verde Médio Claro)
    '#FFFFFF', // --cor-texto-sobre-primaria
    '#E8F5E9', // --cor-texto-sobre-secundaria
    '#66BB6A', // --cor-borda (Verde Médio)
    '#69F0AE', // --cor-acao-positiva (Verde Água Brilhante)
    '#000000', // --cor-texto-acao-positiva
    '#FF8A80', // --cor-acao-negativa (Vermelho Salmão Claro)
    '#000000', // --cor-texto-acao-negativa
    '#FFEB3B', // --cor-aviso (Amarelo)
    '#C8E6C9', // --cor-destaque (Verde Muito Claro)
    '#0A1F08', // --cor-texto-sobre-destaque (Verde Quase Preto para contraste com o destaque claro)
    'rgba(10, 31, 8, 0.9)' // --cor-overlay
  ],
  unlockCriteria: { type: 'matches', count: 20, description: 'Consiga 20 Links' }
};