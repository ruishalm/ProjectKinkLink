// d:\Projetos\Github\app\KinkLink\KinkLink\src\hooks\useCardPileLogic.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { miniKinkCards, type Card } from '../data/cards';
import { useUserCardInteractions } from './useUserCardInteractions'; // Importa o novo hook

// Interface para o tipo de retorno do hook (para clareza e melhor tipagem)
interface UseCardPileLogicReturn {
  currentCard: Card | null;
  handleInteraction: (liked: boolean) => void;
  showMatchModal: boolean;
  currentMatchCard: Card | null;
  setShowMatchModal: React.Dispatch<React.SetStateAction<boolean>>;
  unseenCardsCount: number;
  // Para o modal de Conexão (apenas exibição)
  showConexaoModal: boolean;
  currentConexaoCardForModal: Card | null;
  handleConexaoInteractionInModal: (accepted: boolean) => void;
  // A lógica e estados para o modal de criação de conexão foram removidos
}

export function useCardPileLogic(): UseCardPileLogicReturn {
  const { user } = useAuth(); // useAuth ainda é necessário para o objeto 'user'
  // Usa o novo hook para interações com cartas e matches
  const {
    matchedCards, // Obtém matchedCards do hook de interações
    seenCards, // Obtém seenCards do hook de interações
    addMatch,
    markCardAsSeen,
    handleConexaoCardInteraction: authHandleConexaoInteraction // Função para lidar com interação de conexão
  } = useUserCardInteractions();

  const [mockPartnerInteractions, setMockPartnerInteractions] = useState<Record<string, boolean>>({});
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatchCard, setCurrentMatchCard] = useState<Card | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [preferPrioritizedCardNext, setPreferPrioritizedCardNext] = useState(true);

  // Estados para cartas "Conexão" e lógica de gatilho (apenas exibição)
  const [conexaoCardsPool, setConexaoCardsPool] = useState<Card[]>([]);
  const [unseenConexaoCards, setUnseenConexaoCards] = useState<Card[]>([]);
  const [showConexaoModal, setShowConexaoModal] = useState(false);
  const [currentConexaoCardForModal, setCurrentConexaoCardForModal] = useState<Card | null>(null);
  // Contadores e flag para gatilhos (simulados por sessão para M3)
  const [userLikesForInitialConexao, setUserLikesForInitialConexao] = useState(0);
  const [initialConexaoTriggered, setInitialConexaoTriggered] = useState(false);
  // Estado para rastrear o último marco de gatilho por match
  const [lastConexaoMatchTriggerCount, setLastConexaoMatchTriggerCount] = useState(0);


  // Separa as cartas normais das de conexão e define um fallback
  const { swipableCards, allConexaoCards } = useMemo(() => {
    const all = miniKinkCards.length > 0 ? miniKinkCards : [{ id: 'fallback', text: 'Adicione cartas.', category: 'sensorial' as Card['category'], intensity: 0 }];
    const conexao = all.filter(card => card.category === 'conexao');
    const swipable = all.filter(card => card.category !== 'conexao');
    return { swipableCards: swipable, allConexaoCards: conexao };
  }, []);

  // Inicializa interações simuladas e pool de cartas de conexão
  useEffect(() => {
    const generateMockInteractions = (cards: Card[], percentage: number): Record<string, boolean> => {
      const interactions: Record<string, boolean> = {};
      const cardsToLike = Math.floor(cards.length * (percentage / 100));
      const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
      shuffledCards.slice(0, cardsToLike).forEach(card => {
        interactions[card.id] = true;
      });
      return interactions;
    };

    if (swipableCards.length > 0 && swipableCards[0].id !== 'fallback') {
      // Gera interações simuladas apenas para cartas que não são de conexão (60% de likes)
      setMockPartnerInteractions(generateMockInteractions(swipableCards, 60));
    }
    setConexaoCardsPool(allConexaoCards);
  }, [swipableCards, allConexaoCards]);

  // Atualiza a lista de cartas de conexão não vistas quando o usuário ou o pool mudar
  useEffect(() => {
    if (user && conexaoCardsPool.length > 0) {
      const unseen = conexaoCardsPool.filter(card => !seenCards.includes(card.id));
      setUnseenConexaoCards(unseen);
    } else if (!user) {
       // Limpa estados se o usuário deslogar
       setUnseenConexaoCards([]);
       setUserLikesForInitialConexao(0);
       setInitialConexaoTriggered(false);
       setLastConexaoMatchTriggerCount(0);
    }
     // TODO M4: Carregar contadores de gatilho e flag initialConexaoTriggered do user (Firestore)
     // Para M3, eles resetam por sessão.
     // Inicializa lastConexaoMatchTriggerCount com o total de matches atuais do usuário
     setLastConexaoMatchTriggerCount(matchedCards.length);

  }, [user, conexaoCardsPool, seenCards, matchedCards.length]); // Depende de user, pool e seenCards/matchedCards do hook de interações

  // Filtra as cartas swipeáveis não vistas com base nas interações simuladas
  const { prioritizedUnseen, generalUnseen } = useMemo(() => {
    const unseen = swipableCards.filter(card => !seenCards.includes(card.id));
    const prioritized = unseen.filter(card => mockPartnerInteractions[card.id] === true);
    const general = unseen.filter(card => mockPartnerInteractions[card.id] !== true);
    return { prioritizedUnseen: prioritized, generalUnseen: general };
  }, [swipableCards, seenCards, mockPartnerInteractions]); // Depende de seenCards do hook de interações

  // Seleciona a próxima carta para exibir
  const selectNextCard = useCallback(() => {
    let nextCard: Card | null = null;
    const availablePrioritized = [...prioritizedUnseen];
    const availableGeneral = [...generalUnseen];

    if (preferPrioritizedCardNext && availablePrioritized.length > 0) {
      nextCard = availablePrioritized[0]; // Pega a primeira carta priorizada
    } else if (availableGeneral.length > 0) {
      nextCard = availableGeneral[0]; // Pega a primeira carta geral
    } else if (availablePrioritized.length > 0) {
      nextCard = availablePrioritized[0]; // Fallback para priorizada se não houver geral
    }

    setCurrentCard(nextCard);
  }, [preferPrioritizedCardNext, prioritizedUnseen, generalUnseen]);

  // Efeito para selecionar a primeira carta ao carregar ou quando as listas mudam
  useEffect(() => {
    selectNextCard();
  }, [selectNextCard]); // Depende da função selectNextCard

  // Lida com a interação do usuário (like/dislike)
  const handleInteraction = (liked: boolean) => {
    if (!currentCard) return;

    const interactedCard = currentCard;

    // Marca a carta atual como vista imediatamente
    markCardAsSeen(interactedCard.id);

    let matchOccurredThisInteraction = false; // Renomeado para clareza

    if (interactedCard.category === 'conexao') {
      // Lógica específica para cartas de conexão
      authHandleConexaoInteraction(interactedCard.id, liked);
      // Cartas de conexão não geram "match" no sentido tradicional
    } else {
      // Lógica para cartas normais (verificar match)
      if (liked && mockPartnerInteractions[interactedCard.id] === true) {
        addMatch(interactedCard);
        setCurrentMatchCard(interactedCard);
        setShowMatchModal(true);
        matchOccurredThisInteraction = true;
      }
    }

    // --- Lógica de Gatilho para cartas "Conexão" ---

    // Gatilho Inicial: 10 likes
    if (!initialConexaoTriggered) {
      if (liked) {
        const newLikesCount = userLikesForInitialConexao + 1;
        setUserLikesForInitialConexao(newLikesCount);
        // Se atingiu 10 likes E há cartas de conexão não vistas
        if (newLikesCount >= 10 && unseenConexaoCards.length > 0) {
          setInitialConexaoTriggered(true); // Marca o gatilho inicial como ocorrido
          setCurrentConexaoCardForModal(unseenConexaoCards[0]); // Pega a primeira carta de conexão não vista
          setShowConexaoModal(true); // Mostra o modal de Conexão
          setUserLikesForInitialConexao(0); // Reseta o contador de likes para este gatilho
        }
      }
    } else {
      // Gatilhos Subsequentes: a cada 5 matches após o gatilho inicial
      if (matchOccurredThisInteraction) { // Usa a flag da interação atual
        const currentTotalMatches = matchedCards.length; // Total de matches do usuário (do hook de interações)

        // Verifica se o número total de matches é um múltiplo de 5 desde o último gatilho de match
        // E se o total atual é maior que o último ponto de gatilho registrado
        if (currentTotalMatches > lastConexaoMatchTriggerCount &&
            (currentTotalMatches % 5 === 0 || (currentTotalMatches - lastConexaoMatchTriggerCount) >= 5) ) { // Ajuste na lógica do gatilho de match

           // Se há cartas de conexão não vistas E o gatilho ocorreu
           if (unseenConexaoCards.length > 0) {
              setCurrentConexaoCardForModal(unseenConexaoCards[0]); // Pega a próxima carta de conexão não vista
              setShowConexaoModal(true); // Mostra o modal de Conexão
           }
           // Atualiza o ponto de gatilho para o total de matches atual APENAS se um gatilho de match ocorreu
           // e uma carta de conexão foi mostrada ou poderia ter sido mostrada.
           // Ou simplesmente atualiza para o total atual para garantir que o próximo gatilho seja +5.
           setLastConexaoMatchTriggerCount(currentTotalMatches); 
        }
      }
    }
    // --- Fim da Lógica de Gatilho ---


    // Seleciona a próxima carta para a pilha principal
    selectNextCard();
    // Alterna a preferência entre cartas priorizadas e gerais
    setPreferPrioritizedCardNext(prev => !prev);
  };

  // Lida com a interação dentro do modal de carta "Conexão"
  const handleConexaoInteractionInModal = (accepted: boolean) => {
    if (!currentConexaoCardForModal) return;

    // Chama a função do hook de interações para atualizar o usuário (contadores e seenCards)
    authHandleConexaoInteraction(currentConexaoCardForModal.id, accepted);

    // Remove a carta do pool de não vistas localmente no hook
    setUnseenConexaoCards(prev => prev.filter(card => card.id !== currentConexaoCardForModal.id));

    // Fecha o modal e limpa a carta exibida
    setShowConexaoModal(false);
    setCurrentConexaoCardForModal(null);

    // Nota: Não selecionamos uma nova carta principal aqui, pois a interação ocorreu no modal,
    // não na pilha principal. O usuário voltará para a carta que estava antes do modal aparecer.
  };

  // A função handleCreateConexaoCard e o estado showCreateConexaoModal foram removidos

  // Calcula o número total de cartas swipeáveis não vistas
  const unseenCardsCount = prioritizedUnseen.length + generalUnseen.length;

  return {
    currentCard,
    handleInteraction,
    showMatchModal,
    currentMatchCard,
    setShowMatchModal,
    unseenCardsCount,
    // Para o modal de Conexão
    showConexaoModal,
    currentConexaoCardForModal,
    handleConexaoInteractionInModal,
    
  };
}
