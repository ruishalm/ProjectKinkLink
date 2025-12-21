// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\HomePageDemo\demoCardData.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface DemoCardData {
  id: string;
  text: string;
  category: string;
  intensity: number;
}

export const demoCards: DemoCardData[] = [
  { id: 'c1', text: 'demo_card_c1_text', category: 'sensorial', intensity: 1 },
  { id: 'c2', text: 'demo_card_c2_text', category: 'sensorial', intensity: 2 },
  { id: 'c3', text: 'demo_card_c3_text', category: 'poder', intensity: 2 },
  // { id: 'c4', text: 'demo_card_c4_text', category: 'poder', intensity: 2 }, // Removida para dar espaço à nova
  { id: 'c5', text: 'demo_card_c5_text', category: 'fantasia', intensity: 1 },
  { id: 'c6', text: 'demo_card_c6_text', category: 'fantasia', intensity: 2 },
  { id: 'c7', text: 'demo_card_c7_text', category: 'exposicao', intensity: 1 },
  // { id: 'c8', text: 'demo_card_c8_text', category: 'exposicao', intensity: 1 }, // Removida para dar espaço à nova
  { id: 'd_custom', text: 'demo_card_custom_text', category: 'voceescolhe', intensity: 1 } // Nova carta especial
];

// DEMO_USER_SQUARE e DEMO_USER_CIRCLE não são mais necessários aqui se não forem usados em InteractiveDemo.tsx
// Se precisar deles para alguma lógica futura, pode mantê-los. Por ora, comentei.
// export const DEMO_USER_SQUARE = { id: 'quadrado', name: 'Usuário Quadrado 🔲', colorClass: 'demoBgQuadrado' };
// export const DEMO_USER_CIRCLE = { id: 'bolinha', name: 'Usuário Bolinha ⚪', colorClass: 'demoBgBolinha' };
