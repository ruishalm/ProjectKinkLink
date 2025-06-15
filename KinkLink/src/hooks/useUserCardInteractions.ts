// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useUserCardInteractions.ts
import { useEffect } from 'react';
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
            });
          } else {
            console.warn(`[SubcollectionListener] Documento ${docSnap.id} em ${likedInteractionsPath} não possui cardData ou é inválido.`, interactionData);
          }
        });
        
        const currentLocalMatchedString = (user.matchedCards || [])
          .map(m => `${m.id}-${m.isHot || false}`) 
          .sort()
          .join(',');
        const newMatchedStringFromListener = newMatchesFromListener
          .map(m => `${m.id}-${m.isHot || false}`) 
          .sort()
          .join(',');

        if (currentLocalMatchedString !== newMatchedStringFromListener) {
          console.log(`[SubcollectionListener] User ${user.id.substring(0,5)} - Updating user with new matches (or hot status change). Count: ${newMatchesFromListener.length}`);
          updateUser({ matchedCards: newMatchesFromListener });
        } else {
          // console.log(`[SubcollectionListener] User ${user.id.substring(0,5)} - No changes detected in matched cards.`);
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
  }, [user, updateUser]);

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
    isCreatorSuggestion?: boolean // Novo parâmetro
  ) => {
    if (!user || !user.id || !text.trim() || !user.coupleId || !user.linkedPartnerId) {
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
      ...(isCreatorSuggestion !== undefined && { isCreatorSuggestion: isCreatorSuggestion }), // Adiciona o novo campo
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
          forUserId: user.linkedPartnerId, 
          timestamp: Timestamp.now() 
        }
      });
      console.log(`[UserCardCreation] Sinalizado para parceiro ${user.linkedPartnerId.substring(0,5)} ver a carta ${docRef.id}`);

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
      if (user.linkedPartnerId) {
        const partnerDocRef = doc(db, 'users', user.linkedPartnerId);
        await updateDoc(partnerDocRef, { seenCards: arrayRemove(cardId) });
        console.log(`[deleteMatch] Card ${cardId} removido de seenCards do parceiro ${user.linkedPartnerId.substring(0,5)}.`);
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
  };
}
