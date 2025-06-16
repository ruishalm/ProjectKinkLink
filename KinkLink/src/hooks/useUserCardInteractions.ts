// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useUserCardInteractions.ts
import { useEffect, useRef } from 'react';
import { useAuth, type User, type MatchedCard as AuthMatchedCard } from '../contexts/AuthContext';
import type { Card } from '../data/cards';
import { db } from '../firebase';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDoc,
  Timestamp,
  setDoc,
  addDoc, // Para userCards
  type PartialWithFieldValue,
  onSnapshot,
  orderBy,
  deleteDoc,
  increment,
  arrayRemove, // Importar arrayRemove
} from 'firebase/firestore';
import { exampleSkinsData } from '../config/skins'; // Importar dados das skins do index.ts

export function useUserCardInteractions() {
  const { user, updateUser, checkAndUnlockSkins } = useAuth(); // Adicionar checkAndUnlockSkins

  const matchedCards = user?.matchedCards || [];
  const seenCards = user?.seenCards || [];
  const conexaoAcceptedCount = user?.conexaoAccepted || 0;
  const conexaoRejectedCount = user?.conexaoRejected || 0;
  const lastProcessedMatchedStringRef = useRef<string | null>(null);

  // Listener para a subcoleção likedInteractions do casal
  useEffect(() => {
    let unsubscribeFromMatchListener: (() => void) | undefined;

    if (user && user.id && user.coupleId) {
      const likedInteractionsPath = `couples/${user.coupleId}/likedInteractions`;
      const likesQuery = query(
        collection(db, likedInteractionsPath),
        where('isMatch', '==', true), // Apenas matches confirmados
        orderBy('lastActivity', 'desc')
      );

      console.log(`[SubcollectionListener] Setting up listener for user ${user.id.substring(0,5)} on ${likedInteractionsPath}`);

      unsubscribeFromMatchListener = onSnapshot(likesQuery, (querySnapshot) => {
        const newMatchesFromListener: AuthMatchedCard[] = [];
        querySnapshot.forEach((docSnap) => { 
          const interactionData = docSnap.data();          
          if (interactionData && interactionData.cardData) {
            newMatchesFromListener.push({
              id: docSnap.id, 
              text: interactionData.cardData.text,
              category: interactionData.cardData.category,
              intensity: interactionData.cardData.intensity,
              isHot: interactionData.isHot || false,
              isCompleted: interactionData.isCompleted || false, // Adiciona o campo isCompleted
            });
          } else {
            console.warn(`[SubcollectionListener] Documento ${docSnap.id} em ${likedInteractionsPath} não possui cardData ou é inválido.`, interactionData);
          }
        });
        
        // Ordena as cartas por ID antes de criar a string para garantir consistência na comparação
        const sortedNewMatches = [...newMatchesFromListener].sort((a, b) => a.id.localeCompare(b.id));
        const newMatchedStringFromListener = sortedNewMatches
          .map(m => `${m.id}-${m.isHot || false}-${m.isCompleted || false}`) // String de comparação correta
          .join(',');

        console.log(`[SubcollectionListener Debug] User ${user.id.substring(0,5)} - Current Ref:`, lastProcessedMatchedStringRef.current);
        console.log(`[SubcollectionListener Debug] User ${user.id.substring(0,5)} - New String:`, newMatchedStringFromListener);

        if (newMatchedStringFromListener !== lastProcessedMatchedStringRef.current) {
          console.log(`[SubcollectionListener] User ${user.id.substring(0,5)} - Updating user with new matches (or hot status change). Count: ${newMatchesFromListener.length}`);
          updateUser({ matchedCards: newMatchesFromListener });
          lastProcessedMatchedStringRef.current = newMatchedStringFromListener;
        } else {
          console.log(`[SubcollectionListener Debug] User ${user.id.substring(0,5)} - Strings are identical. No update to AuthContext for matchedCards.`);
        }
      }, (error) => {
        console.error(`[SubcollectionListener] Error listening to ${likedInteractionsPath}:`, error);
      });
    }

    return () => {
      if (unsubscribeFromMatchListener) {
        console.log(`[SubcollectionListener] Cleaning up listener for user ${user?.id?.substring(0,5)}`);
        unsubscribeFromMatchListener();
      }
    };
  // Only re-subscribe if user.id or user.coupleId changes, or if updateUser function reference changes.
  // The onSnapshot callback will use the latest `updateUser` and `lastProcessedMatchedStringRef`
  // from its closure, which are stable or updated correctly.
  // Note: `user` object itself is not in dependency array to avoid re-subscribing on every `matchedCards` update.
  // The logic inside `onSnapshot` now uses a ref to compare, mitigating issues with stale `user.matchedCards` in closure.
  }, [user?.id, user?.coupleId, updateUser]);

  const updateUserProfileInFirestore = async (userId: string, data: PartialWithFieldValue<User>) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, data);
    } catch (error) {
      console.error(`Firestore: Erro ao atualizar documento do usuário ${userId}:`, error);
    }
  };

  const markCardAsSeen = async (cardId: string) => {
    if (!user || !user.id || (user.seenCards && user.seenCards.includes(cardId))) {
      return;
    }
    const currentSeenCards = user.seenCards || [];
    if (!currentSeenCards.includes(cardId)) {
      updateUser({ seenCards: [...currentSeenCards, cardId] });
    }
    await updateUserProfileInFirestore(user.id, {
      seenCards: arrayUnion(cardId)
    });

    // Verificar desbloqueio de skins após marcar como vista (embora o principal gatilho de seenCards esteja em useCardPileLogic)
    // Esta chamada aqui é mais uma garantia caso a lógica de seenCards seja alterada.
    // A chamada principal para 'seenCards' deve estar no hook que efetivamente incrementa o contador de 'seenCards' para o usuário.
    if (user && checkAndUnlockSkins) {
      try {
        await checkAndUnlockSkins(exampleSkinsData);
      } catch (error) {
        console.error("[useUserCardInteractions] Erro ao verificar skins após markCardAsSeen:", error);
      }
    }
  };

  const toggleHotStatus = async (cardId: string) => {
    if (!user || !user.coupleId) return;

    const interactionDocRef = doc(db, 'couples', user.coupleId, 'likedInteractions', cardId);

    try {
      const docSnap = await getDoc(interactionDocRef);
      if (!docSnap.exists() || !docSnap.data().isMatch) {
        console.warn(`[toggleHotStatus] No active match found for card ${cardId} in couple ${user.coupleId}`);
        return;
      }
      const currentIsHot = docSnap.data().isHot || false;
      await updateDoc(interactionDocRef, { 
        isHot: !currentIsHot,
        lastActivity: Timestamp.now()
      });
      console.log(`Firestore: Status 'isHot' atualizado para ${!currentIsHot} para card ${cardId} do casal ${user.coupleId}`);
    } catch (error) {
      console.error(`Firestore: Erro ao atualizar isHot para card ${cardId} do casal ${user.coupleId}:`, error);
    }
  };

  const toggleCompletedStatus = async (cardId: string, completed: boolean) => {
    if (!user || !user.coupleId) {
      console.warn("[toggleCompletedStatus] Usuário ou coupleId não encontrado.");
      return;
    }
    const interactionDocRef = doc(db, 'couples', user.coupleId, 'likedInteractions', cardId);
    try {
      const docSnap = await getDoc(interactionDocRef);
      if (!docSnap.exists() || !docSnap.data().isMatch) {
        console.warn(`[toggleCompletedStatus] Nenhum match ativo encontrado para a carta ${cardId} no casal ${user.coupleId}`);
        return;
      }
      await updateDoc(interactionDocRef, {
        isCompleted: completed,
        isHot: completed ? false : docSnap.data().isHot, // Se está completando, remove de hot. Se está descompletando, mantém o status hot anterior.
        lastActivity: Timestamp.now(),
      });
      console.log(`Firestore: Status 'isCompleted' atualizado para ${completed} para a carta ${cardId} do casal ${user.coupleId}`);
      // O listener onSnapshot pegará essa mudança do Firestore e confirmará o estado.
    } catch (error) {
      console.error(`Firestore: Erro ao atualizar isCompleted para a carta ${cardId} do casal ${user.coupleId}:`, error);
    }
  };

  const repeatCard = async (cardId: string) => {
    if (!user || !user.coupleId) {
      console.warn("[repeatCard] Usuário ou coupleId não encontrado.");
      return;
    }
    const interactionDocRef = doc(db, 'couples', user.coupleId, 'likedInteractions', cardId);
    try {
      const docSnap = await getDoc(interactionDocRef);
      if (!docSnap.exists() || !docSnap.data().isMatch) {
        console.warn(`[repeatCard] Nenhum match ativo encontrado para a carta ${cardId} no casal ${user.coupleId} para repetir.`);
        return;
      }
      await updateDoc(interactionDocRef, {
        isHot: true,
        isCompleted: false,
        lastActivity: Timestamp.now(),
      });
      console.log(`Firestore: Carta ${cardId} marcada como 'isHot: true' e 'isCompleted: false' para o casal ${user.coupleId}`);
      // O listener onSnapshot pegará essa mudança do Firestore e confirmará o estado.
    } catch (error) {
      console.error(`Firestore: Erro ao marcar carta ${cardId} para repetir para o casal ${user.coupleId}:`, error);
    }
  };

  const handleRegularCardInteraction = async (card: Card, liked: boolean): Promise<boolean> => {
    if (!user || !user.id || !user.coupleId) {
      console.warn("[Interaction] Tentativa de interação sem usuário, ID ou coupleId.", { userId: user?.id, coupleId: user?.coupleId });
      return false;
    }
    console.log(`[Interaction] User: ${user.id.substring(0,5)}, Card: ${card.id}, Liked: ${liked}, CoupleId: ${user.coupleId}`);

    await markCardAsSeen(card.id);

    if (!liked) {
      return false;
    }

    const interactionDocRef = doc(db, 'couples', user.coupleId, 'likedInteractions', card.id);

    try {
      const docSnap = await getDoc(interactionDocRef);

      if (!docSnap.exists()) {
        const newInteractionData = {
          cardData: { text: card.text, category: card.category, intensity: card.intensity },
          likedByUIDs: [user.id],
          isMatch: false,
          isHot: false,
          isCompleted: false, // Inicializa isCompleted como false
          lastActivity: Timestamp.now(),
          createdAt: Timestamp.now(),
        };
        await setDoc(interactionDocRef, newInteractionData);
        console.log(`[Interaction] User ${user.id.substring(0,5)} created INITIAL interaction for card ${card.id} in couple ${user.coupleId}`);
        return false;
      } else {
        const data = docSnap.data();
        if (data.likedByUIDs.includes(user.id)) {
          console.log(`[Interaction] User ${user.id.substring(0,5)} ALREADY liked card ${card.id} in couple ${user.coupleId}`);
          return data.isMatch;
        } else {
          if (data.likedByUIDs.length < 2) {
            await updateDoc(interactionDocRef, {
              likedByUIDs: arrayUnion(user.id),
              isMatch: true,
              lastActivity: Timestamp.now(),
            });
            console.log(`[MATCH!] Card ${card.id} is now a match for couple ${user.coupleId}`);
            // Verificar desbloqueio de skins após um match
            if (user && checkAndUnlockSkins) {
              try {
                const newlyUnlocked = await checkAndUnlockSkins(exampleSkinsData);
                if (newlyUnlocked && newlyUnlocked.length > 0) {
                  console.log("[useUserCardInteractions] Novas skins desbloqueadas por matches:", newlyUnlocked);
                }
              } catch (error) {
                console.error("[useUserCardInteractions] Erro ao verificar skins após match:", error);
              }
            }
            return true;
          } else {
            console.warn(`[Interaction] Card ${card.id} in couple ${user.coupleId} already has two likers but wasn't marked as match? Data:`, data);
            return data.isMatch;
          }
        }
      }
    } catch (error) {
      console.error(`[Interaction] Firestore Error during subcollection match logic for card ${card.id}:`, error);
      return false;
    }
  };

  const handleConexaoCardInteraction = async (cardId: string, accepted: boolean) => {
    if (!user || !user.id) return;
    await markCardAsSeen(cardId);
    const updateData: Partial<User> = {};
    const firestoreUpdate: PartialWithFieldValue<User> = {};

    if (accepted) {
      updateData.conexaoAccepted = (user.conexaoAccepted || 0) + 1;
      firestoreUpdate.conexaoAccepted = increment(1);
    } else {
      updateData.conexaoRejected = (user.conexaoRejected || 0) + 1;
      firestoreUpdate.conexaoRejected = increment(1);
    }
    updateUser(updateData);
    await updateUserProfileInFirestore(user.id, firestoreUpdate);
  };

  const handleCreateUserCard = async (
    category: Card['category'],
    text: string,
    intensity?: number,
    isCreatorSuggestion?: boolean
  ) => {
    if (!user || !user.id || !text.trim() || !user.coupleId || !user.partnerId) { // MODIFICADO AQUI
        console.warn("Tentativa de criar carta sem usuário, texto, coupleId ou parceiro vinculado.");
        return;
    }
    // Ajuste para incluir o novo campo opcional no tipo
    const newCardData: Omit<Card, 'id'> & { createdBy: string, coupleId: string, createdAt: Timestamp, isCreatorSuggestion?: boolean } = {
      category: category,
      text: text.trim(),
      ...(intensity !== undefined && { intensity: intensity }),
      createdBy: user.id,
      coupleId: user.coupleId,
      createdAt: Timestamp.now(),
      ...(isCreatorSuggestion !== undefined && { isCreatorSuggestion: isCreatorSuggestion }),
    };
    try {
      const userCardsCollectionRef = collection(db, 'userCards');
      const docRef = await addDoc(userCardsCollectionRef, newCardData);
      console.log("Firestore: Carta personalizada criada com sucesso!", { id: docRef.id, ...newCardData });

      const newCardForInteraction: Card = {
        id: docRef.id,
        text: newCardData.text,
        category: newCardData.category,
        intensity: newCardData.intensity,
        isCreatorSuggestion: newCardData.isCreatorSuggestion, // Passa para a interação também
      };
      await handleRegularCardInteraction(newCardForInteraction, true);
      console.log(`[Interaction] Like automático registrado para a carta criada ${docRef.id} pelo usuário ${user.id.substring(0,5)}`);

      const coupleDocRef = doc(db, 'couples', user.coupleId);
      await updateDoc(coupleDocRef, {
        nextCardForPartner: {
          cardId: docRef.id,
          cardData: { 
            text: newCardData.text,
            category: newCardData.category,
            intensity: newCardData.intensity,
            isCreatorSuggestion: newCardData.isCreatorSuggestion, // Inclui no cardData para o parceiro
          },
          forUserId: user.partnerId, // JÁ CORRIGIDO ANTERIORMENTE, MANTIDO
          timestamp: Timestamp.now() 
        }
      });
      console.log(`[UserCardCreation] Sinalizado para parceiro ${user.partnerId.substring(0,5)} ver a carta ${docRef.id}`); // JÁ CORRIGIDO ANTERIORMENTE, MANTIDO

      // Verificar desbloqueio de skins após criar uma carta
      if (user && checkAndUnlockSkins) {
        try {
          const newlyUnlocked = await checkAndUnlockSkins(exampleSkinsData);
          if (newlyUnlocked && newlyUnlocked.length > 0) {
            console.log("[useUserCardInteractions] Novas skins desbloqueadas por criação de carta:", newlyUnlocked);
          }
        } catch (error) {
          console.error("[useUserCardInteractions] Erro ao verificar skins após criar carta:", error);
        }
      }
    } catch (error) {
      console.error("Firestore: Erro ao criar carta personalizada:", error);
    }
  };

  const deleteMatch = async (cardId: string) => {
    if (!user || !user.id || !user.coupleId) {
      console.warn("[deleteMatch] Usuário, ID ou coupleId não encontrado.");
      return;
    }

    console.log(`[deleteMatch] Iniciando remoção do match/link para card ${cardId} do casal ${user.coupleId}`);

    try {
      // 1. Deletar o documento de interação (match)
      const interactionDocRef = doc(db, 'couples', user.coupleId, 'likedInteractions', cardId);
      await deleteDoc(interactionDocRef);
      console.log(`[deleteMatch] Documento likedInteraction ${cardId} do casal ${user.coupleId} deletado.`);

      // 2. Remover cardId de seenCards do usuário atual
      const currentUserDocRef = doc(db, 'users', user.id);
      await updateDoc(currentUserDocRef, { seenCards: arrayRemove(cardId) });
      console.log(`[deleteMatch] Card ${cardId} removido de seenCards do usuário ${user.id.substring(0,5)}.`);

      // 3. Remover cardId de seenCards do parceiro (se houver)
      if (user.partnerId) { // JÁ CORRIGIDO ANTERIORMENTE, MANTIDO
        const partnerDocRef = doc(db, 'users', user.partnerId); // JÁ CORRIGIDO ANTERIORMENTE, MANTIDO
        await updateDoc(partnerDocRef, { seenCards: arrayRemove(cardId) });
        console.log(`[deleteMatch] Card ${cardId} removido de seenCards do parceiro ${user.partnerId.substring(0,5)}.`); // JÁ CORRIGIDO ANTERIORMENTE, MANTIDO
      }
      // A atualização do estado local de seenCards e matchedCards será feita pelos listeners do AuthContext e deste hook.
    } catch (error) {
      console.error(`Firestore: Erro ao deletar likedInteraction e atualizar seenCards para card ${cardId} do casal ${user.coupleId}:`, error);
    }
  };

  return {
    matchedCards,
    seenCards,
    conexaoAcceptedCount,
    conexaoRejectedCount,
    markCardAsSeen,
    handleRegularCardInteraction,
    toggleHotStatus,
    handleConexaoCardInteraction,
    handleCreateUserCard,
    deleteMatch,
    toggleCompletedStatus, // Exporta a nova função
    repeatCard,            // Exporta a nova função
  };
}
