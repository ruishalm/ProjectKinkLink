import { useAuth } from '../contexts/AuthContext';
import type { Card } from '../data/cards';
import type { MatchedCard } from '../contexts/AuthContext'; // Reutiliza a interface

export function useUserCardInteractions() {
  const { user, updateUser } = useAuth();

  // Deriva os estados diretamente do objeto 'user' do AuthContext
  const matchedCards = user?.matchedCards || [];
  const seenCards = user?.seenCards || [];
  const conexaoAcceptedCount = user?.conexaoAccepted || 0;
  const conexaoRejectedCount = user?.conexaoRejected || 0;

  const markCardAsSeen = (cardId: string) => {
    if (!user || (user.seenCards && user.seenCards.includes(cardId))) {
      // Não faz nada se não houver usuário ou se a carta já foi vista
      return;
    }
    const updatedSeenCards = Array.from(new Set([...(user.seenCards || []), cardId]));
    updateUser({ seenCards: updatedSeenCards });
  };

  const addMatch = (card: Card) => {
    if (!user) return;
    const currentMatches = user.matchedCards || [];
    // Adiciona apenas se a carta ainda não estiver nos matches
    if (!currentMatches.some(mc => mc.id === card.id)) {
      const newMatch: MatchedCard = { ...card, isHot: false }; // Novo match começa como não "hot"
      updateUser({ matchedCards: [...currentMatches, newMatch] });
    }
  };

  const toggleHotStatus = (cardId: string) => {
    if (!user || !user.matchedCards) return;
    const updatedMatches = user.matchedCards.map(mc =>
      mc.id === cardId ? { ...mc, isHot: !mc.isHot } : mc
    );
    updateUser({ matchedCards: updatedMatches });
  };

  const handleConexaoCardInteraction = (cardId: string, accepted: boolean) => {
    if (!user) return;

    // Atualiza os contadores de conexão e marca a carta como vista
    const updatedUserData = {
      conexaoAccepted: accepted ? (user.conexaoAccepted || 0) + 1 : (user.conexaoAccepted || 0),
      conexaoRejected: !accepted ? (user.conexaoRejected || 0) + 1 : (user.conexaoRejected || 0),
      seenCards: Array.from(new Set([...(user.seenCards || []), cardId])), // Garante que a carta de conexão seja marcada como vista
    };
    updateUser(updatedUserData);
    // TODO M4: Persistir no Firestore (aqui ou no updateUser do AuthContext se ele chamar o backend)
  };

  // Função para lidar com a criação de uma nova carta pelo usuário
  const handleCreateUserCard = (category: Card['category'], text: string, intensity: number) => {
    if (!user || !text.trim()) {
        console.warn("Tentativa de criar carta sem usuário ou texto.");
        return;
    }

    // Para M3 (simulado): Apenas marca um ID fictício como visto e loga os dados.
    // Em M5, esta lógica envolveria:
    // 1. Gerar um ID real (Firestore document ID).
    // 2. Criar o objeto Card completo com category, text, intensity e o novo ID.
    // 3. Salvar esta carta na coleção 'userCards' no Firestore, associada ao coupleId do usuário.
    // 4. Atualizar o objeto 'user' no AuthContext para incluir esta carta em uma lista de 'userCreatedCards' ou similar.
    // 5. Marcar a carta como vista para o usuário criador.

    const tempCardId = `user-card-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    markCardAsSeen(tempCardId); // Marca um ID fictício como visto para simular no M3
    console.log(`M3 Simulação: Carta criada (ID fictício: ${tempCardId}, Categoria: ${category}, Texto: "${text}", Intensidade: ${intensity}). Marcada como vista para o criador.`);
    // Futuramente (M5), você adicionaria a carta a uma lista de user.userCreatedCards ou similar
    // updateUser({ userCreatedCards: [...(user.userCreatedCards || []), newCardData] });
  };

  return {
    matchedCards,
    seenCards,
    conexaoAcceptedCount,
    conexaoRejectedCount,
    markCardAsSeen,
    addMatch,
    toggleHotStatus,
    handleConexaoCardInteraction,
    handleCreateUserCard, // Exporta a nova função
  };
}
