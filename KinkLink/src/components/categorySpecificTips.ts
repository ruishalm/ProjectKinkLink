// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\categorySpecificTips.ts
import type { Card } from '../data/cards';

type TipSet = { left: string[]; right: string[] };

// Helper para gerar chaves de tradução
const generateKeys = (category: string, side: 'left' | 'right', count: number) => {
  return Array.from({ length: count }, (_, i) => `tips_${category}_${side}_${i}`);
};

// Agora exportamos CHAVES (ex: tips_poder_left_0) em vez de texto fixo.
// O componente SideTipMessages usará t(chave) para exibir o texto no idioma correto.
export const categorySpecificTips: Record<Card['category'] | 'default', TipSet> = {
    poder: {
      left: generateKeys('poder', 'left', 20),
      right: generateKeys('poder', 'right', 20),
    },
    sensorial: {
      left: generateKeys('sensorial', 'left', 20),
      right: generateKeys('sensorial', 'right', 20),
    },
    fantasia: {
      left: generateKeys('fantasia', 'left', 20),
      right: generateKeys('fantasia', 'right', 20),
    },
    exposicao: {
      left: generateKeys('exposicao', 'left', 20),
      right: generateKeys('exposicao', 'right', 20),
    },
    conexao: {
      left: generateKeys('conexao', 'left', 5),
      right: generateKeys('conexao', 'right', 5),
    },
    default: {
      left: generateKeys('default', 'left', 5),
      right: generateKeys('default', 'right', 5),
    },
};