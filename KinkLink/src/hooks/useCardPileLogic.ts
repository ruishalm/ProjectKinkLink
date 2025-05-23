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
    markCardAsSeen,
    handleRegularCardInteraction, // Usaremos esta para interações normais e detecção de match
    handleConexaoCardInteraction: authHandleConexaoInteraction
  } = useUserCardInteractions();

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatchCard, setCurrentMatchCard] = useState<Card | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);

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

  }, [user, conexaoCardsPool, seenCards, matchedCards.length]);

  // Inicializa o pool de cartas de conexão (apenas uma vez)
  useEffect(() => {
    setConexaoCardsPool(allConexaoCards);
  }, [allConexaoCards]);

  // Filtra as cartas swipeáveis não vistas.
  // Sem mockPartnerInteractions, não há mais "prioritizedUnseen" da mesma forma.
  // Todas as não vistas são "generalUnseen" por enquanto.
  const { generalUnseen } = useMemo(() => { // Removido prioritizedUnseen da desestruturação
    const unseen = swipableCards.filter(card => !seenCards.includes(card.id));
    return { prioritizedUnseen: [], generalUnseen: unseen }; // Simplificado: todas são gerais
  }, [swipableCards, seenCards]);

  // Seleciona a próxima carta para exibir
  const selectNextCard = useCallback(() => {
    let nextCard: Card | null = null;
    const availableGeneral = [...generalUnseen]; // Única fonte de cartas agora

    if (availableGeneral.length > 0) {
      nextCard = availableGeneral[0]; // Pega a primeira carta geral
    }
    setCurrentCard(nextCard);
  }, [generalUnseen]);

  // Efeito para selecionar a primeira carta ao carregar ou quando as listas mudam
  useEffect(() => {
    selectNextCard();
  }, [selectNextCard]); // Depende da função selectNextCard

  // Lida com a interação do usuário (like/dislike)
  const handleInteraction = async (liked: boolean) => { // Tornar async
    if (!currentCard) return;

    const interactedCard = currentCard;

    // Marca a carta atual como vista imediatamente
    await markCardAsSeen(interactedCard.id); // markCardAsSeen agora é async

    let matchOccurredThisInteraction = false; // Renomeado para clareza

    if (interactedCard.category === 'conexao') {
      // Lógica específica para cartas de conexão
      await authHandleConexaoInteraction(interactedCard.id, liked); // authHandleConexaoInteraction agora é async
      // Cartas de conexão não geram "match" no sentido tradicional
    } else {
      // Lógica para cartas normais (chama o backend para registrar interação e verificar match)
      const didMatch = await handleRegularCardInteraction(interactedCard, liked);
      if (didMatch) {
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
    selectNextCard(); // Chama depois de toda a lógica de interação e gatilho
  };

  // Lida com a interação dentro do modal de carta "Conexão"
  const handleConexaoInteractionInModal = async (accepted: boolean) => { // Tornar async
    if (!currentConexaoCardForModal) return;

    // Chama a função do hook de interações para atualizar o usuário (contadores e seenCards)
    await authHandleConexaoInteraction(currentConexaoCardForModal.id, accepted);

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
  const unseenCardsCount = generalUnseen.length; // Agora apenas generalUnseen

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
