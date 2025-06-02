// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\skinTypes.ts
export interface SkinDefinition {
  id: string;
  name: string;
  type: 'backgroundPile' | 'backgroundMatches' | 'colorPalette' | 'font' | 'themePack' | 'buttonStyle' | 'panelStyle';
  description?: string;
  preview?: string | string[]; // URL para textura/fonte, nome de classe para buttonStyle, ou array de cores para paleta
  associatedPaletteId?: string; // ID da paleta para themePacks
  associatedFontId?: string; // ID da fonte para themePacks
  associatedButtonStyleId?: string; // ID do estilo de botão para themePacks
  associatedPanelStyleId?: string; // ID do estilo de painel para themePacks
  associatedPileBackgroundId?: string; // ID do fundo da pilha para themePacks
  associatedMatchesBackgroundId?: string; // ID do fundo dos matches para themePacks
  unlockCriteria?: {
    type: 'matches' | 'seenCards' | 'userCreatedCards';
    count: number;
    description?: string;
  };
}
