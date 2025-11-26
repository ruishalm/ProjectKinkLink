// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useCardPileLogic.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type Card } from '../data/cards'; // Mantém a interface Card
import { db } from '../firebase';
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  onSnapshot,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { useUserCardInteractions } from './useUserCardInteractions';
import { useCardTips } from './useCardTips'; // Importar useCardTips se for usar animateTipsIn
import { exampleSkinsData } from '../config/skins'; // Importar dados das skins do index.ts

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
  undoLastDislike: () => Promise<void>; // Nova função para desfazer
  canUndoDislike: boolean; // Novo estado para habilitar o botão de desfazer
  cardToPeek: Card | null; // Carta de alta intensidade para "espiar"
  acceptPeek: () => void; // Função para aceitar espiar
  rejectPeek: () => void; // Função para rejeitar espiar
}

interface NextCardForPartnerData {
  cardId: string;
  cardData: Omit<Card, 'id'>;
  forUserId: string;
  timestamp: Timestamp;
}

export function useCardPileLogic(): UseCardPileLogicReturn {
  const { user, checkAndUnlockSkins, updateUser: authContextUpdateUser } = useAuth(); // Adicionar updateUser do AuthContext
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
  const [cardToPeek, setCardToPeek] = useState<Card | null>(null);

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
  const [lastDislikedCard, setLastDislikedCard] = useState<Card | null>(null); // Novo estado
  const { triggerAnimateTipsIn } = useCardTips(currentCard); // Mudado para usar a função trigger

  // Efeito para buscar todas as cartas (padrão e do usuário)
  useEffect(() => {
    const fetchCards = async () => {
      setIsLoadingCards(true);
      try {
        // Define a intensidade máxima, com um padrão de 8 (mostrar tudo) se não estiver definida no usuário.
        const maxIntensity = user?.maxIntensity ?? 8;

        const standardCardsQuery = query(
          collection(db, 'cards'),
          where('intensity', '<=', maxIntensity)
        );
        const cardsSnapshot = await getDocs(standardCardsQuery);
        const fetchedStandardCards = cardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
        setAllCardsFromDb(fetchedStandardCards);
        console.log(`[useCardPileLogic] Cartas padrão (até intensidade ${maxIntensity}) carregadas:`, fetchedStandardCards.length);

        if (user?.coupleId) {
          const userCardsRef = query(
            collection(db, 'userCards'),
            where('coupleId', '==', user.coupleId),
            where('intensity', '<=', maxIntensity)
          );
          const userCardsSnapshot = await getDocs(userCardsRef);
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
  }, [user?.coupleId, user?.maxIntensity]);

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
      if (!user?.coupleId || !user?.id) {
        console.log(`[useCardPileLogic] ⚠️ NÃO buscando likes do parceiro. coupleId: ${!!user?.coupleId}, userId: ${!!user?.id}`);
        setPartnerLikesQueue([]);
        return;
      }

      try {
        // Buscar partner ID do couple document
        const coupleDocRef = doc(db, 'couples', user.coupleId);
        const coupleDocSnap = await getDoc(coupleDocRef);
        
        if (!coupleDocSnap.exists()) {
          console.log(`[useCardPileLogic] ⚠️ Couple document não encontrado: ${user.coupleId}`);
          setPartnerLikesQueue([]);
          return;
        }

        const coupleData = coupleDocSnap.data();
        const partnerId = coupleData.members?.find((id: string) => id !== user.id);
        
        if (!partnerId) {
          console.log(`[useCardPileLogic] ⚠️ Partner ID não encontrado no couple. Members: ${coupleData.members}`);
          setPartnerLikesQueue([]);
          return;
        }

        console.log(`[useCardPileLogic] 🔍 Buscando likes do parceiro ${partnerId.substring(0,5)} não vistos por ${user.id.substring(0,5)}`);
        
        const interactionsRef = collection(db, 'couples', user.coupleId, 'likedInteractions');
        const qPartnerLikes = query(
          interactionsRef,
          where('likedByUIDs', 'array-contains', partnerId)
        );
        const snapshot = await getDocs(qPartnerLikes);
        console.log(`[useCardPileLogic] 📦 Query retornou ${snapshot.size} documentos de interação do parceiro.`);
        const potentialPartnerLikedCards: Card[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const alreadyLikedByMe = data.likedByUIDs.includes(user.id);
          const alreadySeen = seenCards.includes(docSnap.id);
          console.log(`[useCardPileLogic]   - Card ${docSnap.id}: likedByMe=${alreadyLikedByMe}, seen=${alreadySeen}, hasCardData=${!!data.cardData}`);
          if (data.cardData && !alreadyLikedByMe && !alreadySeen) {
            potentialPartnerLikedCards.push({ id: docSnap.id, ...data.cardData });
          }
        });
        setPartnerLikesQueue(potentialPartnerLikedCards.sort(() => 0.5 - Math.random()));
        console.log(`[useCardPileLogic] 📥 FILA DE LIKES DO PARCEIRO CARREGADA: ${potentialPartnerLikedCards.length} cartas`, potentialPartnerLikedCards.map(c => `${c.id.substring(0,4)}:${c.text?.substring(0,20)}`));
      } catch (error) {
        console.error("[useCardPileLogic] ❌ Erro ao buscar likes do parceiro:", error);
        setPartnerLikesQueue([]);
      }
    };
    fetchUnseenPartnerLikes();
  }, [user?.coupleId, user?.id, seenCards]);

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
      console.log(`[CONEXÃO] 📊 Inicialização: ${unseen.length} cartas de conexão não vistas de ${conexaoCardsPool.length} totais. Matches: ${matchedCards.length}. Primeiro trigger: ${initialConexaoTriggered ? 'JÁ ATIVADO' : 'PENDENTE'}`);
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
      const partnerLikedCard = partnerLikesQueue.find((card: Card) => card.id !== excludeCardId); // Não precisa checar seenCards aqui, pois a fila já é de não vistos
      if (partnerLikedCard) {
        const maxIntensity = user?.maxIntensity ?? 8; // Usa 8 (mostrar tudo) como padrão
        if ((partnerLikedCard.intensity ?? 0) > maxIntensity) {
          console.log(`[useCardPileLogic] ⚠️ Like do parceiro com intensidade alta detectado. Acionando 'peek'. Card: ${partnerLikedCard.id}`);
          setCardToPeek(partnerLikedCard);
          setCurrentCard(null); // Garante que a pilha não mostre nada enquanto o modal de peek é exibido.
          return; // Para a seleção aqui.
        } else {
          nextCard = partnerLikedCard;
          console.log(`[useCardPileLogic] 💕 LIKE DO PARCEIRO (ciclo ${cardSelectionCycle}): ${nextCard.id} - "${nextCard.text?.substring(0, 40)}..." | Fila restante: ${partnerLikesQueue.length - 1}`);
          setPartnerLikesQueue(prev => prev.filter(card => card.id !== nextCard?.id));
        }
      } else {
        console.log(`[useCardPileLogic] ⚠️ Ciclo 2 (like parceiro), mas nenhuma carta disponível na fila.`);
      }
    } else if (!nextCard && cardSelectionCycle === 2 && partnerLikesQueue.length === 0) {
      console.log(`[useCardPileLogic] 📭 Ciclo 2, mas fila de likes do parceiro está VAZIA.`);
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
        console.log(`[useCardPileLogic] 🎲 CARTA ALEATÓRIA (ciclo ${cardSelectionCycle}): ${nextCard?.id} - "${nextCard?.text?.substring(0, 40)}..." | Total não vistas: ${availableGeneral.length}`);
      } else {
        console.log(`[useCardPileLogic] ⚠️ Nenhuma carta geral disponível!`);
      }
    }

    if (!isLoadingCards) {
      setCurrentCard(nextCard);
    }
    const nextCycleValue = (cardSelectionCycle + 1) % 3;
    console.log(`[useCardPileLogic] 🔄 Ciclo atual: ${cardSelectionCycle} | Próximo ciclo: ${nextCycleValue} ${nextCycleValue === 2 ? '(LIKE PARCEIRO)' : '(ALEATÓRIA)'}`);
    setCardSelectionCycle(nextCycleValue);
  }, [generalUnseen, isLoadingCards, partnerNewCard, seenCards, user?.coupleId, cardSelectionCycle, partnerLikesQueue, user?.maxIntensity]); // Adicionado user?.maxIntensity

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
    if (!liked) {
      setLastDislikedCard(interactedCard); // Guarda a carta se foi "Não Topo!"
    } else {
      setLastDislikedCard(null); // Limpa se foi "Topo!"
    }

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
          console.log(`[CONEXÃO] ❤️ Like #${newLikesCount} em carta não-conexão. Faltam ${10 - newLikesCount} para o primeiro gatilho.`);
          setUserLikesForInitialConexao(newLikesCount);
          if (newLikesCount >= 10 && unseenConexaoCards.length > 0) {
            console.log(`[CONEXÃO] 🎉 PRIMEIRO GATILHO ATIVADO! 10 likes alcançados. Cartas conexão disponíveis: ${unseenConexaoCards.length}`);
            setInitialConexaoTriggered(true);
            setCurrentConexaoCardForModal(unseenConexaoCards[0]);
            setShowConexaoModal(true);
            setUserLikesForInitialConexao(0);
          } else if (newLikesCount >= 10 && unseenConexaoCards.length === 0) {
            console.warn(`[CONEXÃO] ⚠️ 10 likes alcançados, mas nenhuma carta de conexão disponível!`);
          }
        }
      } else {
        if (matchOccurredThisInteraction) {
          const currentTotalMatches = matchedCards.length;
          console.log(`[CONEXÃO] 🔗 Match ocorreu! Total de matches agora: ${currentTotalMatches}. Último trigger em: ${lastConexaoMatchTriggerCount}`);
          if (currentTotalMatches > lastConexaoMatchTriggerCount &&
              (currentTotalMatches % 5 === 0 || (currentTotalMatches - lastConexaoMatchTriggerCount) >= 5)) {
            if (unseenConexaoCards.length > 0) {
              console.log(`[CONEXÃO] 🎉 GATILHO DE MATCHES ATIVADO! Matches: ${currentTotalMatches}. Mostrando carta de conexão.`);
              setCurrentConexaoCardForModal(unseenConexaoCards[0]);
              setShowConexaoModal(true);
            } else {
              console.warn(`[CONEXÃO] ⚠️ Gatilho ativado (${currentTotalMatches} matches), mas nenhuma carta de conexão disponível!`);
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

  // Funções para lidar com a "espiada"
  const acceptPeek = useCallback(() => {
    if (!cardToPeek) return;
    setCurrentCard(cardToPeek);
    setCardToPeek(null);
    setPartnerLikesQueue(prev => prev.filter(card => card.id !== cardToPeek.id)); // Remove da fila de prioridade
  }, [cardToPeek]);

  const rejectPeek = useCallback(() => {
    if (!cardToPeek) return;
    const rejectedCardId = cardToPeek.id;
    setCardToPeek(null);
    selectNextCard(rejectedCardId); // Seleciona a próxima carta, excluindo a que foi rejeitada
  }, [cardToPeek, selectNextCard]);

  const undoLastDislike = useCallback(async () => {
    if (!lastDislikedCard || !user?.id) {
      console.warn("[useCardPileLogic] Nenhuma carta 'Não Topo!' para desfazer ou usuário não disponível.");
      return;
    }

    const cardToRestore = lastDislikedCard;
    const currentSeenCards = user.seenCards || [];

    // Cria novo array seenCards sem a carta restaurada
    const newSeenCards = currentSeenCards.filter(id => id !== cardToRestore.id);

    try {
      await authContextUpdateUser({ seenCards: newSeenCards }); // Atualiza Firestore & AuthContext

      // Define a carta restaurada como a carta atual na pilha
      setCurrentCard(cardToRestore);
      // setIsCardFlipped(true); // Começa com o verso da carta - opcional, pode querer que ela apareça direto
      setLastDislikedCard(null); // Limpa o estado de desfazer
      // Verifica se triggerAnimateTipsIn é uma função antes de chamá-la
      if (typeof triggerAnimateTipsIn === 'function') {
        triggerAnimateTipsIn(); // Reativa a animação das dicas
      } else {
        console.warn("[useCardPileLogic] triggerAnimateTipsIn is not a function. Check the useCardTips.ts hook.");
      }

      console.log(`[useCardPileLogic] Ação 'Não Topo!' desfeita para a carta: ${cardToRestore.id}.`);
    } catch (error) {
      console.error("[useCardPileLogic] Erro ao desfazer 'Não Topo!':", error);
    }
  }, [lastDislikedCard, user, authContextUpdateUser, triggerAnimateTipsIn, setCurrentCard /*, setIsCardFlipped (se usado) */]);

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
    undoLastDislike, // Expõe a nova função
    canUndoDislike: !!lastDislikedCard, // Expõe um booleano para a UI
    cardToPeek,
    acceptPeek,
    rejectPeek,
  };
}
