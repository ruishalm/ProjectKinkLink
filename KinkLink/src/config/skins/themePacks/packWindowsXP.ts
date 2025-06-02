// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\themePacks\packWindowsXP.ts
import { type SkinDefinition } from '../skinTypes';

const packWindowsXP: SkinDefinition = {
  id: 'pack-windows-xp',
  name: 'Windows XP Experience',
  type: 'themePack',
  description: 'Reviva a era clássica do Windows XP em sua interface.',
  preview: 'pack-windows-xp-preview', // Pode ser uma imagem representativa ou apenas um identificador
  
  // IDs das skins individuais que compõem este pacote
  associatedPaletteId: 'palette-windows-xp',
  associatedFontId: 'font-windows-xp',
  associatedButtonStyleId: 'button-style-windows-xp', // O ID da skin permanece o mesmo, o que importa é o arquivo de definição
  associatedPanelStyleId: 'panel_style_windows_xp', // Novo
  // Agora, o pacote aplicará os fundos CSS para as áreas da pilha e dos matches.
  // O fundo global "Bliss" precisará ser tratado pelo SkinContext ao detectar este pacote.
  associatedPileBackgroundId: 'bg-pile-windows-xp', // Corrigido: Aponta para a skin com 'xp-pile-background-skin'
  associatedMatchesBackgroundId: 'bg-matches-windows-xp', // Corrigido para corresponder à SkinDefinition
};

export default packWindowsXP;