// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\config\skins\index.ts
import { type SkinDefinition } from './skinTypes';

// Paletas
import { paletteDefault } from './palettes/default';
import { paletteOceanDeep } from './palettes/oceanDeep';
import { paletteForestMist } from './palettes/forestMist';
import { paletteVampNight } from './palettes/vampNight';
import { paletteCandySky } from './palettes/candySky';
import { paletteCyberpunkNeon } from './palettes/cyberpunkNeon';
import { paletteVintageSepia } from './palettes/vintageSepia';
// import paletteWindowsXP from './palettes/paletteWindowsXP'; // Comentado

// Fontes
import { fontDefault } from './fonts/default';
import { fontComicSans } from './fonts/comicSans';
import { fontDancingScript } from './fonts/dancingScript';
import { fontMontserrat } from './fonts/montserrat';
import { fontMerriweather } from './fonts/merriweather';
import { fontChakraPetch } from './fonts/chakraPetch'; // Nova fonte
// import fontWindowsXP from './fonts/fontWindowsXP'; // Comentado

// Backgrounds da Pilha
import { bgPileDefault } from './backgrounds/pile/default';
import { bgPileAzulNipes } from './backgrounds/pile/azulNipes';
import { bgPileMadeira } from './backgrounds/pile/madeira';
import { bgPileVerdeFlor } from './backgrounds/pile/verdeFlor';
import { bgPileCafe } from './backgrounds/pile/cafe';
import { bgPileVerdeClaro } from './backgrounds/pile/verdeClaro';
import { bgPileCyberpunkPanos } from './backgrounds/pile/cyberpunkPanos'; // Novo fundo de pilha
// import bgPileWindowsXP from './backgrounds/pile/bgPileWindowsXP'; // Comentado - "Desktop Azul XP (Pilha)"

// Backgrounds dos Matches
import { bgMatchesDefault } from './backgrounds/matches/default';
import { bgMatchesCafe } from './backgrounds/matches/cafe';
import { bgMatchesVerdeClaro } from './backgrounds/matches/verdeClaro';
import { bgMatchesAzulNipes } from './backgrounds/matches/azulNipes';
import { bgMatchesMadeira } from './backgrounds/matches/madeira';
import { bgMatchesVerdeFlor } from './backgrounds/matches/verdeFlor';
import { bgMatchesCyberpunkPanos } from './backgrounds/matches/cyberpunkPanos'; // Novo fundo de matches
// import bgMatchesWindowsXP from './backgrounds/matches/bgMatchesWindowsXP'; // Comentado - "Janela XP (Links)"


// Pacotes de Tema
import { packDefault } from './themePacks/default';
import { packCyberpunkKink } from './themePacks/cyberpunkKink';
// import { packVintageLink } from './themePacks/vintageLink'; // Ocultado temporariamente
// import { packRomanticNight } from './themePacks/romanticNight'; // Ocultado temporariamente
// import packWindowsXP from './themePacks/packWindowsXP'; // Comentado

// Estilos de Botão
import { buttonStyleDefault } from './buttonStyles/default';
import { buttonStyleCyberpunk } from './buttonStyles/cyberpunk';
import { buttonStyleVintage } from './buttonStyles/vintage';
// import buttonStyleWindowsXP from './buttonStyles/buttonStyleWindowsXP'; // Comentado

// Estilos de Painel (Novo)
import { panelStyleDefault } from './panelStyles/panelStyleDefault';
// import { panelStyleWindowsXP } from './panelStyles/panelStyleWindowsXP'; // Comentado
import { panelStyleCyberpunk } from './panelStyles/panelStyleCyberpunk'; // Novo
export { panelStyleDefault } from './panelStyles/panelStyleDefault'; // Adicione esta linha para re-exportar

// Recriar o array exampleSkinsData
export const exampleSkinsData: SkinDefinition[] = [
  // Backgrounds da Pilha
  bgPileDefault,
  bgPileAzulNipes,
  bgPileMadeira,
  bgPileVerdeFlor,
  bgPileCafe,
  bgPileVerdeClaro,
  bgPileCyberpunkPanos,
  // bgPileWindowsXP, // Comentado

  // Backgrounds dos Matches
  bgMatchesDefault,
  bgMatchesCafe,
  bgMatchesVerdeClaro,
  bgMatchesAzulNipes,
  bgMatchesMadeira,
  bgMatchesVerdeFlor,
  bgMatchesCyberpunkPanos,
  // bgMatchesWindowsXP, // Comentado

  // Paletas
  paletteDefault,
  paletteOceanDeep,
  paletteForestMist,
  paletteVampNight,
  paletteCandySky,
  paletteCyberpunkNeon,
  paletteVintageSepia,
  // paletteWindowsXP, // Comentado

  // Fontes
  fontDefault,
  fontComicSans,
  fontDancingScript,
  fontMontserrat,
  fontMerriweather,
  fontChakraPetch, // Adicionar aqui
  // fontWindowsXP, // Comentado

  // Pacotes de Tema
  packDefault,
  packCyberpunkKink,
  // packVintageLink, // Ocultado temporariamente
  // packRomanticNight, // Ocultado temporariamente
  // packWindowsXP, // Comentado

  // Estilos de Botão
  buttonStyleDefault,
  buttonStyleCyberpunk,
  buttonStyleVintage,
  // buttonStyleWindowsXP, // Comentado

  // Estilos de Painel (Novo)
  panelStyleDefault,
  // panelStyleWindowsXP, // Comentado
  panelStyleCyberpunk,
];

// Re-exportar o tipo para conveniência
export { type SkinDefinition } from './skinTypes';
