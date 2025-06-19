// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\HomePageDemo\demoCardData.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DemoCardData {
  id: string;
  text: string;
  category: string;
  intensity: number;
}

export const demoCards: DemoCardData[] = [
  { id: 'c1', text: 'Intimidade com venda nos olhos entre o casal.', category: 'sensorial', intensity: 1 },
  { id: 'c2', text: 'Brincadeiras com gelo.', category: 'sensorial', intensity: 2 },
  { id: 'c3', text: 'Um comando sensual para eu obedecer.', category: 'poder', intensity: 2 },
  // { id: 'c4', text: 'Spanking! Tapas leves no bumbum!', category: 'poder', intensity: 2 }, // Removida para dar espaço à nova
  { id: 'c5', text: 'Encenar um primeiro encontro às escondidas.', category: 'fantasia', intensity: 1 },
  { id: 'c6', text: 'Roleplay: massagista profisional e seu cliente', category: 'fantasia', intensity: 2 },
  { id: 'c7', text: 'Fazer striptease particular para o(a) parceiro(a).', category: 'exposicao', intensity: 1 },
  // { id: 'c8', text: 'O parceiro (a) assite durante o banho.', category: 'exposicao', intensity: 1 }, // Removida para dar espaço à nova
  { id: 'd_custom', text: 'Você também pode criar suas próprias cartas!', category: 'voceescolhe', intensity: 1 } // Nova carta especial
];

// DEMO_USER_SQUARE e DEMO_USER_CIRCLE não são mais necessários aqui se não forem usados em InteractiveDemo.tsx
// Se precisar deles para alguma lógica futura, pode mantê-los. Por ora, comentei.
// export const DEMO_USER_SQUARE = { id: 'quadrado', name: 'Usuário Quadrado 🔲', colorClass: 'demoBgQuadrado' };
// export const DEMO_USER_CIRCLE = { id: 'bolinha', name: 'Usuário Bolinha ⚪', colorClass: 'demoBgBolinha' };
