// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useCardPileLogic.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type Card } from '../data/cards'; // Mantém a interface Card
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
import { exampleSkinsData } from '../config/skins/skinDefinitions'; // Importar dados das skins

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
  allConexaoCards: Card[]; // Para o modal Carinhos & Mimos
}

interface NextCardForPartnerData {
  cardId: string;
  cardData: Omit<Card, 'id'>;
  forUserId: string;
  timestamp: Timestamp;
}

export function useCardPileLogic(): UseCardPileLogicReturn {
  const { user, checkAndUnlockSkins } = useAuth(); // Adicionar checkAndUnlockSkins
  const {
    matchedCards,
    seenCards,
    markCardAsSeen,
    handleRegularCardInteraction,
    handleConexaoCardInteraction: authHandleConexaoInteraction
  } = useUserCardInteractions();

  const [allCardsFromDb, setAllCardsFromDb] = useState<Card[]>([]);
  const [userCreatedCards, setUserCreatedCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatchCard, setCurrentMatchCard] = useState<Card | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);

  const [conexaoCardsPool, setConexaoCardsPool] = useState<Card[]>([]);
  const [unseenConexaoCards, setUnseenConexaoCards] = useState<Card[]>([]);
  const [showConexaoModal, setShowConexaoModal] = useState(false);
  const [currentConexaoCardForModal, setCurrentConexaoCardForModal] = useState<Card | null>(null);
  const [userLikesForInitialConexao, setUserLikesForInitialConexao] = useState(0);
  const [initialConexaoTriggered, setInitialConexaoTriggered] = useState(false);
  const [lastConexaoMatchTriggerCount, setLastConexaoMatchTriggerCount] = useState(0);

  const [partnerNewCard, setPartnerNewCard] = useState<Card | null>(null);
  const [partnerLikesQueue, setPartnerLikesQueue] = useState<Card[]>([]);
  const [cardSelectionCycle, setCardSelectionCycle] = useState(0); // 0, 1 = random; 2 = partner like

  // Efeito para buscar todas as cartas (padrão e do usuário)
  useEffect(() => {
    const fetchCards = async () => {
      setIsLoadingCards(true);
      try {
        const cardsCollectionRef = collection(db, 'cards');
        const cardsSnapshot = await getDocs(cardsCollectionRef);
        const fetchedStandardCards = cardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
        setAllCardsFromDb(fetchedStandardCards);
        console.log('[useCardPileLogic] Cartas padrão carregadas:', fetchedStandardCards.length);

        if (user?.coupleId) {
          const userCardsQuery = query(collection(db, 'userCards'), where('coupleId', '==', user.coupleId));
          const userCardsSnapshot = await getDocs(userCardsQuery);
          const fetchedUserCards = userCardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
          setUserCreatedCards(fetchedUserCards);
          console.log('[useCardPileLogic] Cartas do usuário carregadas:', fetchedUserCards.length);
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
  }, [user?.coupleId]);

  // Efeito para ouvir por carta nova criada pelo parceiro
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
        if (nextCardData && nextCardData.forUserId === user.id) {
          console.log(`[useCardPileLogic] Nova carta do parceiro detectada: ${nextCardData.cardId}`);
          setPartnerNewCard({ id: nextCardData.cardId, ...nextCardData.cardData });
        } else {
          setPartnerNewCard(null);
        }
      }
    });
    return () => unsubscribe();
  }, [user?.id, user?.coupleId]);

  // Efeito para buscar likes do parceiro não vistos pelo usuário atual
  useEffect(() => {
    const fetchUnseenPartnerLikes = async () => {
      if (!user?.coupleId || !user?.linkedPartnerId || !user?.id || !seenCards) {
        setPartnerLikesQueue([]);
        return;
      }
      console.log(`[useCardPileLogic] Buscando likes do parceiro ${user.linkedPartnerId.substring(0,5)} não vistos por ${user.id.substring(0,5)}`);
      try {
        const interactionsRef = collection(db, 'couples', user.coupleId, 'likedInteractions');
        const qPartnerLikes = query(
          interactionsRef,
          where('likedByUIDs', 'array-contains', user.linkedPartnerId)
        );
        const snapshot = await getDocs(qPartnerLikes);
        const potentialPartnerLikedCards: Card[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.cardData && !data.likedByUIDs.includes(user.id) && !seenCards.includes(docSnap.id)) {
            potentialPartnerLikedCards.push({ id: docSnap.id, ...data.cardData });
          }
        });
        setPartnerLikesQueue(potentialPartnerLikedCards.sort(() => 0.5 - Math.random()));
        console.log('[useCardPileLogic] Likes do parceiro não vistos carregados:', potentialPartnerLikedCards.length);
      } catch (error) {
        console.error("[useCardPileLogic] Erro ao buscar likes do parceiro:", error);
      }
    };
    fetchUnseenPartnerLikes();
  }, [user?.coupleId, user?.linkedPartnerId, user?.id, seenCards]);

  // Combina cartas e separa em "swipable" e "conexao"
  const { swipableCards, allConexaoCards } = useMemo((): { swipableCards: Card[]; allConexaoCards: Card[] } => {
    const combinedSourceCards = [...allCardsFromDb, ...userCreatedCards];
    const sourceCards = combinedSourceCards.length > 0 ? combinedSourceCards :
      (isLoadingCards ? [{ id: 'loading', text: 'Carregando cartas...', category: 'sensorial' as Card['category'] }]
                      : [{ id: 'fallback', text: 'Nenhuma carta encontrada.', category: 'sensorial' as Card['category'] }]);
    const conexaoResult = sourceCards.filter((card: Card) => card.category === 'conexao');
    const swipableResult = sourceCards.filter((card: Card) => card.category !== 'conexao');
    return { swipableCards: swipableResult, allConexaoCards: conexaoResult };
  }, [allCardsFromDb, userCreatedCards, isLoadingCards]);

  // Atualiza cartas de conexão não vistas
  useEffect(() => {
    if (user && conexaoCardsPool.length > 0) {
      const unseen = conexaoCardsPool.filter((card: Card) => !seenCards.includes(card.id));
      setUnseenConexaoCards(unseen);
    } else if (!user) {
      setUnseenConexaoCards([]);
      setUserLikesForInitialConexao(0);
      setInitialConexaoTriggered(false);
      setLastConexaoMatchTriggerCount(0);
    }
    setLastConexaoMatchTriggerCount(matchedCards.length);
  }, [user, conexaoCardsPool, seenCards, matchedCards.length]);

  // Inicializa pool de cartas de conexão
  useEffect(() => {
    setConexaoCardsPool(allConexaoCards);
  }, [allConexaoCards]);

  // Cartas "gerais" não vistas
  const generalUnseen = useMemo(() => {
    return swipableCards.filter((card: Card) => !seenCards.includes(card.id));
  }, [swipableCards, seenCards]);

  // Seleciona a próxima carta
  const selectNextCard = useCallback((excludeCardId?: string) => {
    let nextCard: Card | null = null;

    // Prioridade 1: Carta recém-criada pelo parceiro
    if (partnerNewCard && (!excludeCardId || partnerNewCard.id !== excludeCardId) && !seenCards.includes(partnerNewCard.id)) {
      nextCard = partnerNewCard;
      console.log(`[useCardPileLogic] Priorizando carta do parceiro: ${nextCard.id}`);
    } else if (partnerNewCard && seenCards.includes(partnerNewCard.id)) {
        console.warn(`[useCardPileLogic] Carta do parceiro ${partnerNewCard.id} já estava em seenCards e ainda em partnerNewCard state. Limpando localmente.`);
        setPartnerNewCard(null);
    }

    // Prioridade 2: Likes do parceiro (se for a vez no ciclo)
    if (!nextCard && cardSelectionCycle === 2 && partnerLikesQueue.length > 0) {
      const partnerLikedCard = partnerLikesQueue.find((card: Card) => card.id !== excludeCardId && !seenCards.includes(card.id));
      if (partnerLikedCard) {
        nextCard = partnerLikedCard;
        console.log(`[useCardPileLogic] Priorizando like do parceiro: ${nextCard.id}`);
        setPartnerLikesQueue(prev => prev.filter(card => card.id !== nextCard?.id));
      }
    }

    // Prioridade 3: Carta aleatória geral
    if (!nextCard) {
      const availableGeneral = generalUnseen.filter((card: Card) =>
        card.id !== excludeCardId &&
        card.id !== partnerNewCard?.id
      );
      if (availableGeneral.length > 0) {
        const shuffledGeneral = [...availableGeneral].sort(() => 0.5 - Math.random());
        nextCard = shuffledGeneral[0];
        console.log(`[useCardPileLogic] Selecionando carta aleatória geral: ${nextCard?.id}`);
      }
    }

    if (!isLoadingCards) {
      setCurrentCard(nextCard);
    }
    setCardSelectionCycle(prev => (prev + 1) % 3);
  }, [generalUnseen, isLoadingCards, partnerNewCard, seenCards, user?.coupleId, cardSelectionCycle, partnerLikesQueue]);

  // Efeito para selecionar a primeira carta
  useEffect(() => {
    if (!isLoadingCards && !currentCard && (generalUnseen.length > 0 || partnerNewCard || partnerLikesQueue.length > 0) ) {
        selectNextCard();
    }
  // Adicionadas partnerNewCard e partnerLikesQueue para garantir que selectNextCard seja chamado se houver cartas prioritárias
  }, [selectNextCard, isLoadingCards, currentCard, generalUnseen.length, partnerNewCard, partnerLikesQueue.length]);


  // Lida com a interação do usuário
  const handleInteraction = async (liked: boolean) => {
    if (!currentCard || !user?.id) return;

    const interactedCard = currentCard;
    const interactedCardId = interactedCard.id;

    await markCardAsSeen(interactedCardId);

    if (partnerNewCard && interactedCardId === partnerNewCard.id && user.coupleId) {
      console.log(`[useCardPileLogic] Carta do parceiro ${interactedCardId} foi vista. Limpando sinalizador.`);
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

    // Lógica de Gatilho para cartas "Conexão"
    if (user) {
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

    // Verificar desbloqueio de skins após a interação (principalmente para 'seenCards')
    if (user && checkAndUnlockSkins) {
      try {
        const newlyUnlocked = await checkAndUnlockSkins(exampleSkinsData);
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          console.log("[useCardPileLogic] Novas skins desbloqueadas (provavelmente por cartas vistas):", newlyUnlocked);
        }
      } catch (error) {
        console.error("[useCardPileLogic] Erro ao verificar skins após interação com carta:", error);
      }
    }
  };

  // Lida com a interação no modal de "Conexão"
  const handleConexaoInteractionInModal = async (accepted: boolean) => {
    if (!currentConexaoCardForModal) return;
    await authHandleConexaoInteraction(currentConexaoCardForModal.id, accepted);
    setUnseenConexaoCards(prev => prev.filter((card: Card) => card.id !== currentConexaoCardForModal.id));
    setShowConexaoModal(false);
    setCurrentConexaoCardForModal(null);
  };

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
  };
}
