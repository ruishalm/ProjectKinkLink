// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useUserCardInteractions.ts
import { useState, useEffect, useRef } from 'react';
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
  Timestamp, // Keep Timestamp as it's used for createdAt and lastActivity
  setDoc,
  writeBatch,
  type PartialWithFieldValue,
  onSnapshot,
  orderBy,
  increment,
  arrayRemove, // Importar arrayRemove
} from 'firebase/firestore';
import { exampleSkinsData } from '../config/skins'; // Importar dados das skins do index.ts

export function useUserCardInteractions() {
  const { user, updateUser, checkAndUnlockSkins } = useAuth(); // Adicionar checkAndUnlockSkins

  // Estado local para os matches, quebrando o ciclo de renderização global. 
  const [localMatchedCards, setLocalMatchedCards] = useState<AuthMatchedCard[]>(user?.matchedCards || []);
  const seenCards = user?.seenCards || [];
  const conexaoAcceptedCount = user?.conexaoAccepted || 0;
  const conexaoRejectedCount = user?.conexaoRejected || 0;
  const lastProcessedMatchedStringRef = useRef<string | null>(null);

  // ADICIONADO: refs para controlar listener ativo e debounce
  const listenerActiveCoupleRef = useRef<string | null>(null);
  const lastListenerUnsubscribeRef = useRef<(() => void) | null>(null);
  const lastTriggerRef = useRef<number>(0);

  // Listener para a subcoleção likedInteractions do casal
  useEffect(() => {
    // Cleanup anterior caso exista e seja para outro coupleId
    const cleanupPrevious = () => {
      if (lastListenerUnsubscribeRef.current) {
        try {
          lastListenerUnsubscribeRef.current();
        } catch (e) {
          console.warn('[SubcollectionListener] Erro ao limpar listener anterior', e);
        }
        lastListenerUnsubscribeRef.current = null;
        listenerActiveCoupleRef.current = null;
      }
    };

    if (!user || !user.id || !user.coupleId) {
      // Se não há user/couple, garante cleanup e sai
      cleanupPrevious();
      return;
    }

    // Se já temos um listener ativo para esse coupleId, não recriar
    if (listenerActiveCoupleRef.current === user.coupleId && lastListenerUnsubscribeRef.current) {
      // já inscrito no mesmo coupleId
      console.log("[SubcollectionListener] Listener já ativo para este coupleId, evitando re-subscribe.");
      return;
    }

    // Se havia um listener ativo para outro coupleId, limpar antes de criar novo
    cleanupPrevious();

    const likedInteractionsPath = `couples/${user.coupleId}/likedInteractions`;
    const likesQuery = query(
      collection(db, likedInteractionsPath),
      where('isMatch', '==', true),
      orderBy('lastActivity', 'desc')
    );

    console.log(`[SubcollectionListener] Setting up listener for user ${user.id.substring(0,5)} on ${likedInteractionsPath}`);
    listenerActiveCoupleRef.current = user.coupleId;

    const unsubscribeFromMatchListener = onSnapshot(likesQuery, (querySnapshot) => {
      try {
        // Ignora snapshots que são apenas writes locais (evita loop por writes do próprio cliente)
        const docChanges = querySnapshot.docChanges();
        const allLocalWrites = docChanges.length > 0 && docChanges.every(ch => ch.doc.metadata.hasPendingWrites);
        if (allLocalWrites) {
          console.log("[SubcollectionListener] Ignorando snapshot composto apenas por writes locais.");
          return;
        }

        // Debounce simples: ignora eventos muito próximos
        const now = Date.now();
        if (now - lastTriggerRef.current < 250) {
          console.log("[SubcollectionListener] Debounced snapshot (too frequent).");
          return;
        }
        lastTriggerRef.current = now;

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
              isCompleted: interactionData.isCompleted || false,
            });
          } else {
            console.warn(`[SubcollectionListener] Documento ${docSnap.id} em ${likedInteractionsPath} inválido.`, interactionData);
          }
        });

        const sortedNewMatches = [...newMatchesFromListener].sort((a, b) => a.id.localeCompare(b.id));
        const newMatchedStringFromListener = sortedNewMatches
          .map(m => `${m.id}-${m.isHot || false}-${m.isCompleted || false}`)
          .join(',');

        if (newMatchedStringFromListener !== lastProcessedMatchedStringRef.current) {
          lastProcessedMatchedStringRef.current = newMatchedStringFromListener;
          setLocalMatchedCards(newMatchesFromListener);
        } else {
          console.log(`[SubcollectionListener Debug] Strings são idênticas. Nenhuma atualização necessária.`);
        }
      } catch (err) {
        console.error('[SubcollectionListener] Erro no processamento do snapshot', err);
      }
    }, (error) => {
      console.error(`[SubcollectionListener] Error listening to ${likedInteractionsPath}:`, error);
    });

    lastListenerUnsubscribeRef.current = unsubscribeFromMatchListener;

    return () => {
      // cleanup quando o effect desmonta ou dependencies mudam
      if (lastListenerUnsubscribeRef.current) {
        try {
          lastListenerUnsubscribeRef.current();
        } catch (e) {
          console.warn('[SubcollectionListener] Erro ao chamar unsubscribe no cleanup', e);
        }
        lastListenerUnsubscribeRef.current = null;
      }
      listenerActiveCoupleRef.current = null;
    };
  // Re-subscribe apenas se id ou coupleId mudarem
  }, [user?.id, user?.coupleId]);

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
    if (!user || !user.id || !text.trim() || !user.coupleId) {
      console.warn("Tentativa de criar carta sem usuário, texto ou coupleId.");
      return;
    }

    try {
      // Buscar partner ID do couple document
      const coupleDocRef = doc(db, 'couples', user.coupleId);
      const coupleDocSnap = await getDoc(coupleDocRef);
      
      if (!coupleDocSnap.exists()) {
        console.error('[createUserCard] Couple document não encontrado');
        return;
      }

      const coupleData = coupleDocSnap.data();
      const partnerId = coupleData.members?.find((id: string) => id !== user.id);
      
      if (!partnerId) {
        console.warn('[createUserCard] Partner ID não encontrado no couple');
        // Continua mesmo sem partnerId, pois a carta pode ser criada
      }

      // Inicia um batch para garantir que todas as operações sejam atômicas
      const batch = writeBatch(db);

      // 1. Cria a nova carta na coleção 'userCards'
      const newUserCardRef = doc(collection(db, 'userCards')); // Gera um novo ID
      const newCardData: Omit<Card, 'id'> & { createdBy: string, coupleId: string, createdAt: Timestamp, isCreatorSuggestion?: boolean } = {
        category: category,
        text: text.trim(),
        ...(intensity !== undefined && { intensity }),
        createdBy: user.id,
        coupleId: user.coupleId,
        createdAt: Timestamp.now(),
        ...(isCreatorSuggestion !== undefined && { isCreatorSuggestion }),
      };
      batch.set(newUserCardRef, newCardData);

      // 2. Cria a interação de "like" inicial para a carta recém-criada
      const interactionDocRef = doc(db, 'couples', user.coupleId, 'likedInteractions', newUserCardRef.id);
      const newInteractionData = {
        cardData: { text: newCardData.text, category: newCardData.category, intensity: newCardData.intensity, isCreatorSuggestion: newCardData.isCreatorSuggestion },
        likedByUIDs: [user.id],
        isMatch: false, isHot: false, isCompleted: false,
        lastActivity: Timestamp.now(), createdAt: Timestamp.now(),
      };
      batch.set(interactionDocRef, newInteractionData);

      // 3. Sinaliza para o parceiro que há uma nova carta para ele ver (se houver)
      if (partnerId) {
        batch.update(coupleDocRef, {
          nextCardForPartner: {
            cardId: newUserCardRef.id,
            cardData: { text: newCardData.text, category: newCardData.category, intensity: newCardData.intensity, isCreatorSuggestion: newCardData.isCreatorSuggestion },
            forUserId: partnerId,
            timestamp: Timestamp.now()
          }
        });
      }

      // 4. Executa todas as operações do batch
      await batch.commit();
      console.log(`[UserCardCreation] Carta ${newUserCardRef.id} criada, interação registrada e parceiro notificado atomicamente.`);

      // 5. Verificar desbloqueio de skins após a operação bem-sucedida
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

    try {
      // Buscar partner ID do couple document
      const coupleDocRef = doc(db, 'couples', user.coupleId);
      const coupleDocSnap = await getDoc(coupleDocRef);
      
      let partnerId: string | undefined;
      if (coupleDocSnap.exists()) {
        const coupleData = coupleDocSnap.data();
        partnerId = coupleData.members?.find((id: string) => id !== user.id);
      }

      // Inicia um batch para garantir que todas as operações sejam atômicas
      const batch = writeBatch(db);

      // 1. Deleta o documento de interação (match)
      const interactionDocRef = doc(db, 'couples', user.coupleId, 'likedInteractions', cardId);
      batch.delete(interactionDocRef);

      // 2. Remove cardId de seenCards do usuário atual
      const currentUserDocRef = doc(db, 'users', user.id);
      batch.update(currentUserDocRef, { seenCards: arrayRemove(cardId) });

      // 3. Remove cardId de seenCards do parceiro (se houver)
      if (partnerId) {
        const partnerDocRef = doc(db, 'users', partnerId);
        batch.update(partnerDocRef, { seenCards: arrayRemove(cardId) });
      }

      // 4. Executa todas as operações do batch
      await batch.commit();
      console.log(`[deleteMatch] Match ${cardId} e referências em seenCards removidos atomicamente para o casal ${user.coupleId}.`);

    } catch (error) {
      console.error(`Firestore: Erro ao deletar likedInteraction e atualizar seenCards para card ${cardId} do casal ${user.coupleId}:`, error);
    }
  };

  return {
    matchedCards: localMatchedCards,
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
