// KinkLink - Lista de Cartas Mestre Definitiva (250 Cartas)
// Data da última revisão: 26 de maio de 2025

export interface Card {
  id: string; // Formato: 'cX' onde X é o número sequencial de 1 a 250
  category: 'sensorial' | 'poder' | 'fantasia' | 'exposicao' | 'conexao';
  text: string;
  intensity?: number;
  isCreatorSuggestion?: boolean; // Novo campo para identificar sugestão do parceiro
}

export const kinkLinkFinalMasterCardList: Card[] = [

];