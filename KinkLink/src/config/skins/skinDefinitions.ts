// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skinDefinitions.ts
// Este arquivo agora centraliza as definições de skins e pacotes de tema.

export interface SkinDefinition {
  id: string;
  name: string;
  type: 'backgroundPile' | 'backgroundMatches' | 'colorPalette' | 'font' | 'themePack';
  description?: string;
  preview?: string | string[]; // URL para textura/fonte, ou array de cores para paleta
  associatedPaletteId?: string; // ID da paleta para themePacks
  associatedFontId?: string; // ID da fonte para themePacks
  unlockCriteria?: {
    type: 'matches' | 'seenCards' | 'userCreatedCards';
    count: number;
    description?: string;
  };
}

export const exampleSkinsData: SkinDefinition[] = [
  { id: 'bg_pile_default', name: 'Padrão (Pilha)', type: 'backgroundPile' },
  { id: 'bg_pile_azul_nipes', name: 'Azul Naipes (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/azulNipes.jpg', unlockCriteria: { type: 'matches', count: 5, description: 'Consiga 5 Links' } },
  { id: 'bg_pile_madeira', name: 'Madeira (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/madeira.jpg', unlockCriteria: { type: 'seenCards', count: 50, description: 'Veja 50 cartas' } },
  { id: 'bg_pile_verde_flor', name: 'Verde Flor (Pilha)', type: 'backgroundPile', preview: '/assets/skins/textures/verdeFlor.jpg', unlockCriteria: { type: 'matches', count: 15, description: 'Consiga 15 Links' } },


  { id: 'bg_match_default', name: 'Padrão (Matches)', type: 'backgroundMatches' },
  { id: 'bg_match_cafe', name: 'Café (Matches)', type: 'backgroundMatches', preview: '/assets/skins/textures/cafe.jpg', unlockCriteria: { type: 'matches', count: 10, description: 'Consiga 10 Links' } },
  { id: 'bg_match_verde_claro', name: 'Verde Claro (Matches)', type: 'backgroundMatches', preview: '/assets/skins/textures/verdeClaro.jpg', unlockCriteria: { type: 'seenCards', count: 100, description: 'Veja 100 cartas' } },


  {
    id: 'palette_default',
    name: 'KinkLink Padrão',
    type: 'colorPalette',
    preview: [
      '#FF69B4', '#5C5C5C', '#1e1e1e', '#2a2a2a', '#f0f0f0', '#b0b0b0', '#FFFFFF', '#FFFFFF',
      '#3f3f3f', '#4CAF50', '#FFFFFF', '#F44336', '#FFFFFF', '#FFC107', '#64b5f6', '#111111',
      'rgba(0, 0, 0, 0.7)'
    ]
  },
  {
    id: 'palette_ocean_deep',
    name: 'Oceano Profundo',
    type: 'colorPalette',
    preview: [
      '#1E90FF', '#1976D2', '#000033', '#0D47A1', '#E0FFFF', '#ADD8E6', '#FFFFFF', '#E0FFFF',
      '#00BFFF', '#32CD32', '#FFFFFF', '#FF6347', '#FFFFFF', '#FFD700', '#90CAF9', '#000033',
      'rgba(0,0,51,0.85)'
    ],
    unlockCriteria: { type: 'seenCards', count: 25, description: 'Veja 25 cartas' }
  },
  {
    id: 'palette_forest_mist',
    name: 'Névoa da Floresta',
    type: 'colorPalette',
    preview: [
      '#2E7D32', '#1B5E20', '#0A1F08', '#10350E', '#A5D6A7', '#81C784', '#FFFFFF', '#E8F5E9',
      '#66BB6A', '#69F0AE', '#000000', '#FF8A80', '#000000', '#FFEB3B', '#C8E6C9', '#0A1F08',
      'rgba(10, 31, 8, 0.9)'
    ],
    unlockCriteria: { type: 'matches', count: 20, description: 'Consiga 20 Links' }
  },
  {
    id: 'palette_vamp_night',
    name: 'Kink',
    type: 'colorPalette',
    preview: [
      '#D32F2F', '#424242', '#121212', '#212121', '#E0E0E0', '#9E9E9E', '#FFFFFF', '#E0E0E0',
      '#616161', '#7B1FA2', '#FFFFFF', '#5E35B1', '#FFFFFF', '#FF6F00', '#E91E63', '#FFFFFF',
      'rgba(10, 0, 20, 0.85)'
    ],
  },
  {
    id: 'palette_candy_sky',
    name: 'Link',
    type: 'colorPalette',
    preview: [
      '#FFC0CB', '#ADD8E6', '#FAF3F7', '#FFFFFF', '#5D5463', '#A89FAC', '#4A4A4A', '#4A4A4A',
      '#E0D8E0', '#98FB98', '#2F4F4F', '#FFB6C1', '#2F4F4F', '#FFFACD', '#D8BFD8', '#2F4F4F',
      'rgba(240, 248, 255, 0.7)'
    ],
  },

  { id: 'font_default', name: 'Padrão App', type: 'font' },
  { id: 'font_comicsans', name: 'Comic Sans', type: 'font', preview: '"Comic Sans MS", "Comic Sans", cursive' },
  { id: 'font_dancing_script', name: 'Dancing Script', type: 'font', preview: '"Dancing Script", cursive' },
  { id: 'font_montserrat', name: 'Montserrat', type: 'font', preview: '"Montserrat", sans-serif' },
  { id: 'font_merriweather', name: 'Merriweather', type: 'font', preview: '"Merriweather", serif' },

  {
    id: 'palette_cyberpunk_neon',
    name: 'Cyberpunk Neon (Paleta)',
    type: 'colorPalette',
    preview: [
      '#FF00FF', '#00FFFF', '#0A0A0A', '#1A1A1A', '#FFFFFF', '#CCCCCC', '#000000', '#000000',
      '#333333', '#39FF14', '#000000', '#9D00FF', '#FFFFFF', '#FFFF00', '#FF5F00', '#000000',
      'rgba(0,0,0,0.85)'
    ]
  },
  {
    id: 'palette_vintage_sepia',
    name: 'Vintage Sépia (Paleta)',
    type: 'colorPalette',
    preview: [
      '#800020', '#778899', '#F5F5DC', '#FAF0E6', '#5D4037', '#696969', '#FFF8DC', '#FFFFFF',
      '#B8860B', '#556B2F', '#FFF8DC', '#CD5C5C', '#FFF8DC', '#FFDB58', '#5F9EA0', '#FFF8DC',
      'rgba(112, 66, 20, 0.7)'
    ]
  },

  {
    id: 'pack_default',
    name: 'Tema Padrão KinkLink',
    type: 'themePack',
    description: 'O visual clássico do KinkLink.',
    associatedPaletteId: 'palette_default',
    associatedFontId: 'font_default'
  },
  {
    id: 'pack_cyberpunk_kink',
    name: 'Cyberpunk Kink',
    type: 'themePack',
    description: 'Neon, tecnologia e atitude. Botões com chanfros em breve!',
    associatedPaletteId: 'palette_cyberpunk_neon',
    associatedFontId: 'font_montserrat',
    unlockCriteria: { type: 'userCreatedCards', count: 5, description: 'Crie 5 cartas personalizadas' }
  },
  {
    id: 'pack_vintage_link',
    name: 'Vintage Link',
    type: 'themePack',
    description: 'Charme nostálgico e elegância atemporal. Botões com estilo clássico em breve!',
    associatedPaletteId: 'palette_vintage_sepia',
    associatedFontId: 'font_merriweather',
    unlockCriteria: { type: 'matches', count: 25, description: 'Consiga 25 Links' }
  },
  { id: 'pack_romantic_night', name: 'Noite Romântica', type: 'themePack', description: 'Um tema completo para noites especiais. (Paleta e fonte a definir)' },
];
