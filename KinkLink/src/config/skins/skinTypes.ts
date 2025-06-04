// src/config/skins/skinTypes.ts
export interface SkinDefinition {
  id: string;
  name: string;
  type: 'backgroundPile' | 'backgroundMatches' | 'colorPalette' | 'font' | 'themePack' | 'buttonStyle' | 'panelStyle';
  description?: string;
  preview?: string | string[]; // URL para textura/fonte, nome de classe para buttonStyle, ou array de cores para paleta
  associatedPaletteId?: string;
  associatedFontId?: string;
  associatedButtonStyleId?: string;
  associatedPanelStyleId?: string;
  associatedPileBackgroundId?: string;
  associatedMatchesBackgroundId?: string;
  unlockCriteria?: {
    type: 'matches' | 'seenCards' | 'userCreatedCards';
    count: number;
    description?: string;
  };
}

// ADICIONE ESTA INTERFACE AQUI E EXPORTE-A
export interface ActiveSkinSettings {
  backgroundPile?: string; // ID da skin de fundo da pilha
  backgroundPileUrl?: string; // URL da textura para a pilha
  backgroundMatches?: string; // ID da skin de fundo dos matches
  backgroundMatchesUrl?: string; // URL da textura para os matches
  colorPalette?: string; // ID da paleta de cores
  colorPaletteColors?: string[]; // Array de cores da paleta
  font?: string; // ID da fonte
  fontFamily?: string; // Nome da família da fonte
  themePack?: string; // ID do pacote de tema
  buttonStyleId?: string; // ID do estilo de botão ativo
  buttonStyleClass?: string; // Classe CSS do estilo de botão ativo
  panelStyleId?: string; // ID da skin de estilo de painel ativa
  panelStyleClass?: string; // Classe CSS para o estilo de painel
}