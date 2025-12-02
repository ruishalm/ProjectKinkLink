// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useCardPileLogic.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type Card } from '../data/cards';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  onSnapshot,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { useUserCardInteractions } from './useUserCardInteractions';
import { useCardTips } from './useCardTips';
import { exampleSkinsData } from '../config/skins';

// Interface para o tipo de retorno do hook
interface UseCardPileLogicReturn {
  currentCard: Card | null;
  handleInteraction: (liked: boolean) => void;
  showMatchModal: boolean;
  currentMatchCard: Card | null;
  setShowMatchModal: React.Dispatch<React.SetStateAction<boolean>>;
  unseenCardsCount: number;
  showConexaoModal: boolean;
  currentConexaoCardForModal: Card | null;
  handleConexaoInteractionInModal: (accepted: boolean) => void;
  allConexaoCards: Card[];
  undoLastDislike: () => Promise<void>;
  canUndoDislike: boolean;
  cardToPeek: Card | null;
  acceptPeek: () => void;
  rejectPeek: () => void;
}

interface NextCardForPartnerData {
  cardId: string;
  cardData: Omit<Card, 'id'>;
  forUserId: string;
  timestamp: Timestamp;
}

export function useCardPileLogic(): UseCardPileLogicReturn {
  // Hooks de contexto para acesso a dados de usuário e interações.
  const { user, checkAndUnlockSkins, updateUser: authContextUpdateUser } = useAuth();
  const {
    matchedCards,
    seenCards,
    markCardAsSeen,
    handleRegularCardInteraction,
    handleConexaoCardInteraction: authHandleConexaoInteraction
  } = useUserCardInteractions();

  // Estados para armazenar as cartas vindas do banco de dados.
  const [allCardsFromDb, setAllCardsFromDb] = useState<Card[]>([]);
  const [userCreatedCards, setUserCreatedCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  // Estados para controlar a UI e o fluxo de jogo.
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatchCard, setCurrentMatchCard] = useState<Card | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [cardToPeek, setCardToPeek] = useState<Card | null>(null); // Para o modal "espiar".
  const [lastDislikedCard, setLastDislikedCard] = useState<Card | null>(null); // Para a função "Oops!".

  // Estados específicos para a lógica das cartas "Conexão".
  const [conexaoCardsPool, setConexaoCardsPool] = useState<Card[]>([]);
  const [unseenConexaoCards, setUnseenConexaoCards] = useState<Card[]>([]);
  const [showConexaoModal, setShowConexaoModal] = useState(false);
  const [currentConexaoCardForModal, setCurrentConexaoCardForModal] = useState<Card | null>(null);
  const [userLikesForInitialConexao, setUserLikesForInitialConexao] = useState(0);
  const [initialConexaoTriggered, setInitialConexaoTriggered] = useState(false);
  const [lastConexaoMatchTriggerCount, setLastConexaoMatchTriggerCount] = useState(0);

  // Estados para a lógica de priorização de cartas do parceiro.
  const [partnerNewCard, setPartnerNewCard] = useState<Card | null>(null);
  const [partnerLikesQueue, setPartnerLikesQueue] = useState<Card[]>([]);
  const [cardSelectionCycle, setCardSelectionCycle] = useState(0);
  
  const { triggerAnimateTipsIn } = useCardTips(currentCard);

  // Efeito para buscar todas as cartas (padrão e do usuário) do Firestore,
  // respeitando o filtro de intensidade máxima definido pelo usuário.
  useEffect(() => {
    const fetchCards = async () => {
      setIsLoadingCards(true);
      try {
        const maxIntensity = user?.maxIntensity ?? 8;

        const standardCardsQuery = query(
          collection(db, 'cards'),
          where('intensity', '<=', maxIntensity)
        );
        const cardsSnapshot = await getDocs(standardCardsQuery);
        const fetchedStandardCards = cardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
        setAllCardsFromDb(fetchedStandardCards);

        if (user?.coupleId) {
          const userCardsRef = query(
            collection(db, 'userCards'),
            where('coupleId', '==', user.coupleId),
            where('intensity', '<=', maxIntensity)
          );
          const userCardsSnapshot = await getDocs(userCardsRef);
          const fetchedUserCards = userCardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
          setUserCreatedCards(fetchedUserCards);
        } else {
          setUserCreatedCards([]);
        }
      } catch (error) {
        console.error("[useCardPileLogic] Erro ao buscar cartas do Firestore:", error);
        setAllCardsFromDb([]);
        setUserCreatedCards([]);
      } finally {
        setIsLoadingCards(false);
      }
    };
    fetchCards();
  }, [user?.coupleId, user?.maxIntensity]);

  // Efeito para ouvir em tempo real por uma nova carta criada pelo parceiro
  // e destinada a este usuário.
  useEffect(() => {
    if (!user?.id || !user?.coupleId) {
      setPartnerNewCard(null);
      return;
    }
    const coupleDocRef = doc(db, 'couples', user.coupleId);
    const unsubscribe = onSnapshot(coupleDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const coupleData = docSnap.data();
        const nextCardData = coupleData.nextCardForPartner as NextCardForPartnerData | undefined;
        // Verifica se a carta é para o usuário atual.
        if (nextCardData && nextCardData.forUserId === user.id) {
          setPartnerNewCard({ id: nextCardData.cardId, ...nextCardData.cardData });
        } else {
          setPartnerNewCard(null);
        }
      }
    });
    return () => unsubscribe();
  }, [user?.id, user?.coupleId]);

  // Efeito para buscar os "likes" do parceiro em cartas que o usuário atual ainda não viu.
  // Monta uma fila de prioridade para exibir essas cartas com mais frequência.
  useEffect(() => {
    const fetchUnseenPartnerLikes = async () => {
      if (!user?.coupleId || !user?.partnerId || !user?.id || !seenCards) {
        setPartnerLikesQueue([]);
        return;
      }
      try {
        const interactionsRef = collection(db, 'couples', user.coupleId, 'likedInteractions');
        const qPartnerLikes = query(
          interactionsRef,
          where('likedByUIDs', 'array-contains', user.partnerId)
        );
        const snapshot = await getDocs(qPartnerLikes);
        const potentialPartnerLikedCards: Card[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          // Adiciona à fila se a carta foi curtida pelo parceiro, mas não pelo usuário atual,
          // e se o usuário atual ainda não a viu.
          if (data.cardData && !data.likedByUIDs.includes(user.id) && !seenCards.includes(docSnap.id)) {
            potentialPartnerLikedCards.push({ id: docSnap.id, ...data.cardData });
          }
        });
        // Embaralha a fila para adicionar um pouco de aleatoriedade.
        setPartnerLikesQueue(potentialPartnerLikedCards.sort(() => 0.5 - Math.random()));
      } catch (error) {
        console.error("[useCardPileLogic] Erro ao buscar likes do parceiro:", error);
      }
    };
    fetchUnseenPartnerLikes();
  }, [user?.coupleId, user?.partnerId, user?.id, seenCards]);

  // Memoiza a separação das cartas em "swipable" (normais) e "conexao".
  const { swipableCards, allConexaoCards } = useMemo((): { swipableCards: Card[]; allConexaoCards: Card[] } => {
    const combinedSourceCards = [...allCardsFromDb, ...userCreatedCards];
    // Fallback para evitar que a pilha fique vazia durante o carregamento inicial.
    const sourceCards = combinedSourceCards.length > 0 ? combinedSourceCards :
      (isLoadingCards ? [{ id: 'loading', text: 'Carregando cartas...', category: 'sensorial' as Card['category'] }]
                      : [{ id: 'fallback', text: 'Nenhuma carta encontrada.', category: 'sensorial' as Card['category'] }]);
    
    const conexaoResult = sourceCards.filter((card: Card) => card.category === 'conexao');
    const swipableResult = sourceCards.filter((card: Card) => card.category !== 'conexao');
    return { swipableCards: swipableResult, allConexaoCards: conexaoResult };
  }, [allCardsFromDb, userCreatedCards, isLoadingCards]);

  // Efeito para gerenciar o pool de cartas "Conexão" não vistas.
  useEffect(() => {
    if (user && conexaoCardsPool.length > 0) {
      const unseen = conexaoCardsPool.filter((card: Card) => !seenCards.includes(card.id));
      setUnseenConexaoCards(unseen);
    } else if (!user) {
      // Limpa os estados de "Conexão" se o usuário deslogar.
      setUnseenConexaoCards([]);
      setUserLikesForInitialConexao(0);
      setInitialConexaoTriggered(false);
      setLastConexaoMatchTriggerCount(0);
    }
    setLastConexaoMatchTriggerCount(matchedCards.length);
  }, [user, conexaoCardsPool, seenCards, matchedCards.length]);

  // Inicializa o pool de cartas de conexão quando elas são carregadas.
  useEffect(() => {
    setConexaoCardsPool(allConexaoCards);
  }, [allConexaoCards]);

  // Memoiza a lista de cartas "gerais" que o usuário ainda não viu.
  const generalUnseen = useMemo(() => {
    return swipableCards.filter((card: Card) => !seenCards.includes(card.id));
  }, [swipableCards, seenCards]);

  // Função principal que decide qual carta será exibida a seguir.
  const selectNextCard = useCallback((excludeCardId?: string) => {
    let nextCard: Card | null = null;

    // A seleção segue uma ordem de prioridade para tornar a experiência mais dinâmica.
    // Prioridade 1: Uma carta recém-criada pelo parceiro.
    if (partnerNewCard && (!excludeCardId || partnerNewCard.id !== excludeCardId) && !seenCards.includes(partnerNewCard.id)) {
      nextCard = partnerNewCard;
    }

    // Prioridade 2: Uma carta que o parceiro curtiu e o usuário ainda não viu.
    // Isso acontece a cada 3 seleções para não ser muito repetitivo.
    if (!nextCard && cardSelectionCycle === 2 && partnerLikesQueue.length > 0) {
      const partnerLikedCard = partnerLikesQueue.find((card: Card) => card.id !== excludeCardId);
      if (partnerLikedCard) {
        const maxIntensity = user?.maxIntensity ?? 8;
        // Se a carta tiver intensidade maior que o filtro do usuário, aciona o modal "espiar".
        if ((partnerLikedCard.intensity ?? 0) > maxIntensity) {
          setCardToPeek(partnerLikedCard);
          setCurrentCard(null); // Limpa a carta atual para focar no modal.
          return;
        } else {
          nextCard = partnerLikedCard;
          // Remove a carta da fila de prioridade para não mostrá-la novamente por este caminho.
          setPartnerLikesQueue(prev => prev.filter(card => card.id !== nextCard?.id));
        }
      }
    }

    // Prioridade 3: Uma carta aleatória do bolo de cartas gerais não vistas.
    if (!nextCard) {
      const availableGeneral = generalUnseen.filter((card: Card) =>
        card.id !== excludeCardId &&
        card.id !== partnerNewCard?.id
      );
      if (availableGeneral.length > 0) {
        const shuffledGeneral = [...availableGeneral].sort(() => 0.5 - Math.random());
        nextCard = shuffledGeneral[0];
      }
    }

    if (!isLoadingCards) {
      setCurrentCard(nextCard);
    }
    // Avança o ciclo de seleção para a próxima rodada.
    setCardSelectionCycle(prev => (prev + 1) % 3);
  }, [generalUnseen, isLoadingCards, partnerNewCard, seenCards, user?.coupleId, cardSelectionCycle, partnerLikesQueue, user?.maxIntensity]);

  // Efeito para selecionar a primeira carta quando o hook é inicializado e as cartas estão prontas.
  useEffect(() => {
    if (!isLoadingCards && !currentCard && (generalUnseen.length > 0 || partnerNewCard || partnerLikesQueue.length > 0) ) {
        selectNextCard();
    }
  }, [selectNextCard, isLoadingCards, currentCard, generalUnseen.length, partnerNewCard, partnerLikesQueue.length]);


  // Lida com a interação do usuário (like/dislike) na carta principal.
  const handleInteraction = async (liked: boolean) => {
    if (!currentCard || !user?.id) return;

    const interactedCard = currentCard;
    const interactedCardId = interactedCard.id;

    await markCardAsSeen(interactedCardId);
    
    if (!liked) {
      setLastDislikedCard(interactedCard); // Armazena a carta para a função "Oops!".
    } else {
      setLastDislikedCard(null);
    }

    // Se a carta interagida foi a que o parceiro criou, limpa o sinalizador no Firestore.
    if (partnerNewCard && interactedCardId === partnerNewCard.id && user.coupleId) {
      const coupleDocRef = doc(db, 'couples', user.coupleId);
      await updateDoc(coupleDocRef, { nextCardForPartner: null }).catch(err => console.error("Erro ao limpar nextCardForPartner:", err));
      setPartnerNewCard(null);
    }

    let matchOccurredThisInteraction = false;
    if (interactedCard.category === 'conexao') {
      await authHandleConexaoInteraction(interactedCard.id, liked);
    } else {
      const didMatch = await handleRegularCardInteraction(interactedCard, liked);
      if (didMatch) {
        setCurrentMatchCard(interactedCard);
        setShowMatchModal(true);
        matchOccurredThisInteraction = true;
      }
    }

    // Lógica para decidir quando mostrar uma carta "Conexão".
    if (user) {
      // Gatilho inicial: após 10 likes em cartas normais.
      if (!initialConexaoTriggered) {
        if (liked && interactedCard.category !== 'conexao') {
          const newLikesCount = userLikesForInitialConexao + 1;
          setUserLikesForInitialConexao(newLikesCount);
          if (newLikesCount >= 10 && unseenConexaoCards.length > 0) {
            setInitialConexaoTriggered(true);
            setCurrentConexaoCardForModal(unseenConexaoCards[0]);
            setShowConexaoModal(true);
            setUserLikesForInitialConexao(0);
          }
        }
      } else {
        // Gatilhos recorrentes: a cada 5 novos matches.
        if (matchOccurredThisInteraction) {
          const currentTotalMatches = matchedCards.length;
          if (currentTotalMatches > lastConexaoMatchTriggerCount &&
              (currentTotalMatches % 5 === 0 || (currentTotalMatches - lastConexaoMatchTriggerCount) >= 5)) {
            if (unseenConexaoCards.length > 0) {
              setCurrentConexaoCardForModal(unseenConexaoCards[0]);
              setShowConexaoModal(true);
            }
            setLastConexaoMatchTriggerCount(currentTotalMatches);
          }
        }
      }
    }
    selectNextCard(interactedCardId);

    // Após a interação, verifica se o usuário desbloqueou novas skins.
    if (user && checkAndUnlockSkins) {
      try {
        await checkAndUnlockSkins(exampleSkinsData);
      } catch (error) {
        console.error("[useCardPileLogic] Erro ao verificar skins após interação:", error);
      }
    }
  };

  // Lida com a interação (aceitar/rejeitar) dentro do modal de "Conexão".
  const handleConexaoInteractionInModal = async (accepted: boolean) => {
    if (!currentConexaoCardForModal) return;
    await authHandleConexaoInteraction(currentConexaoCardForModal.id, accepted);
    setUnseenConexaoCards(prev => prev.filter((card: Card) => card.id !== currentConexaoCardForModal.id));
    setShowConexaoModal(false);
    setCurrentConexaoCardForModal(null);
  };

  // Funções para o modal "espiar".
  const acceptPeek = useCallback(() => {
    if (!cardToPeek) return;
    setCurrentCard(cardToPeek); // Define a carta "espiada" como a atual.
    setCardToPeek(null);
    setPartnerLikesQueue(prev => prev.filter(card => card.id !== cardToPeek.id));
  }, [cardToPeek]);

  const rejectPeek = useCallback(() => {
    if (!cardToPeek) return;
    const rejectedCardId = cardToPeek.id;
    setCardToPeek(null);
    selectNextCard(rejectedCardId); // Pula a carta "espiada" e seleciona a próxima.
  }, [cardToPeek, selectNextCard]);

  // Desfaz a última ação de "Não Topo!".
  const undoLastDislike = useCallback(async () => {
    if (!lastDislikedCard || !user?.id) return;

    const cardToRestore = lastDislikedCard;
    const currentSeenCards = user.seenCards || [];
    const newSeenCards = currentSeenCards.filter(id => id !== cardToRestore.id);

    try {
      // Remove a carta da lista de "vistas" no Firestore e no contexto.
      await authContextUpdateUser({ seenCards: newSeenCards });

      // Recoloca a carta na pilha para ser jogada novamente.
      setCurrentCard(cardToRestore);
      setLastDislikedCard(null);
      
      if (typeof triggerAnimateTipsIn === 'function') {
        triggerAnimateTipsIn();
      }
    } catch (error) {
      console.error("[useCardPileLogic] Erro ao desfazer 'Não Topo!':", error);
    }
  }, [lastDislikedCard, user, authContextUpdateUser, triggerAnimateTipsIn]);

  // Calcula o número total de cartas não vistas para exibição na UI.
  const unseenCardsCount = generalUnseen.length + partnerLikesQueue.filter(c => !seenCards.includes(c.id)).length + (partnerNewCard && !seenCards.includes(partnerNewCard.id) ? 1 : 0);


  return {
    currentCard,
    handleInteraction,
    showMatchModal,
    currentMatchCard,
    setShowMatchModal,
    unseenCardsCount,
    showConexaoModal,
    currentConexaoCardForModal,
    handleConexaoInteractionInModal,
    allConexaoCards,
    undoLastDislike,
    canUndoDislike: !!lastDislikedCard,
    cardToPeek,
    acceptPeek,
    rejectPeek,
  };
}
