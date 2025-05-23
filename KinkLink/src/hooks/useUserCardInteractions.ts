import { useAuth, type User } from '../contexts/AuthContext'; // Import User type
import type { Card  } from '../data/cards';
import type { MatchedCard } from '../contexts/AuthContext'; // Reutiliza a interface
import { db } from '../firebase'; // Importa a instância do Firestore
import {
  doc,
  updateDoc,
  arrayUnion,  // Para adicionar itens a um array sem duplicar
  collection,
  query,
  where,
  getDocs,
  setDoc,      // Adicionado
  Timestamp,   // Adicionado
  addDoc,       // Adicionado
  type PartialWithFieldValue // Adicionado para tipagem correta com FieldValues
} from 'firebase/firestore';

export function useUserCardInteractions() {
  const { user, updateUser } = useAuth();

  // Deriva os estados diretamente do objeto 'user' do AuthContext
  const matchedCards = user?.matchedCards || [];
  const seenCards = user?.seenCards || [];
  const conexaoAcceptedCount = user?.conexaoAccepted || 0;
  const conexaoRejectedCount = user?.conexaoRejected || 0;

  // Função auxiliar para atualizar o documento do usuário no Firestore
  const updateUserProfileInFirestore = async (userId: string, data: PartialWithFieldValue<User>) => {
    if (!userId) return;
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, data);
      // console.log(`Firestore: Documento do usuário ${userId} atualizado.`);
    } catch (error) {
      console.error(`Firestore: Erro ao atualizar documento do usuário ${userId}:`, error);
    }
  };

  const markCardAsSeen = async (cardId: string) => {
    if (!user || (user.seenCards && user.seenCards.includes(cardId))) {
      // Não faz nada se não houver usuário ou se a carta já foi vista
      return;
    }

    // Atualiza o estado local imediatamente
    const currentSeenCards = user.seenCards || [];
    if (!currentSeenCards.includes(cardId)) {
      updateUser({ seenCards: [...currentSeenCards, cardId] });
    }


    // Persiste a mudança no Firestore
    await updateUserProfileInFirestore(user.id, {
      seenCards: arrayUnion(cardId) // Adiciona o cardId ao array seenCards
    });
  };

  // Função para adicionar um match real no Firestore
  const createMatchInFirestore = async (card: Card) => {
     if (!user || !user.linkedPartnerId) return;

     // Cria um ID de match consistente para o casal e a carta
     const userIds = [user.id, user.linkedPartnerId].sort();
     const matchId = `${card.id}_${userIds[0]}_${userIds[1]}`;

     const matchDocRef = doc(db, 'matches', matchId);

     const newMatchData = {
       cardId: card.id,
       cardCategory: card.category,
       cardText: card.text,
       cardIntensity: card.intensity,
       userId1: userIds[0],
       userId2: userIds[1],
       createdAt: Timestamp.now(),
       isHot: false, // Começa como não "hot"
       // Outros campos relevantes para o match
     };

     try {
       await setDoc(matchDocRef, newMatchData);
       console.log(`Firestore: Match criado para a carta ${card.id} entre ${userIds[0]} e ${userIds[1]}`);

       // Adiciona a carta aos matchedCards no perfil de AMBOS os usuários
       const matchedCardData: MatchedCard = { ...card, isHot: false };
       await updateUserProfileInFirestore(user.id, { matchedCards: arrayUnion(matchedCardData) });
       await updateUserProfileInFirestore(user.linkedPartnerId, { matchedCards: arrayUnion(matchedCardData) });

      // Atualiza o estado local do usuário atual
      const currentLocalMatchedCards = user.matchedCards || [];
      if (!currentLocalMatchedCards.some(mc => mc.id === card.id)) {
        updateUser({ matchedCards: [...currentLocalMatchedCards, matchedCardData] });
      }
     } catch (error) {
       console.error(`Firestore: Erro ao criar match para a carta ${card.id}:`, error);
     }
  };

  const toggleHotStatus = async (cardId: string) => {
    if (!user || !user.matchedCards || !user.linkedPartnerId) return;
    // TODO: Persistir a mudança de isHot no documento 'matches/{matchId}' no Firestore
    const currentMatches = user.matchedCards || [];
    const matchToToggle = currentMatches.find(mc => mc.id === cardId);
    if (!matchToToggle) return;

    const updatedMatches = user.matchedCards.map(mc =>
      mc.id === cardId ? { ...mc, isHot: !mc.isHot } : mc
    );
    updateUser({ matchedCards: updatedMatches });
  };

  // Lida com a interação de like/dislike para cartas normais
  const handleRegularCardInteraction = async (card: Card, liked: boolean) => {
    if (!user || !user.linkedPartnerId) return;

    // Salva a interação do usuário atual no Firestore
    const interactionDocRef = doc(db, 'cardInteractions', `${user.id}_${card.id}`);
    try {
      await setDoc(interactionDocRef, {
        userId: user.id,
        cardId: card.id,
        liked: liked,
        timestamp: Timestamp.now(),
        coupleId: [user.id, user.linkedPartnerId].sort().join('_'), // Identificador do casal
      }, { merge: true });
      // console.log(`Firestore: Interação de ${user.email} com a carta ${card.id} salva.`);

      // Se o usuário curtiu, verifica se o parceiro também curtiu
      if (liked) {
        const partnerInteractionSnap = await getDocs(query(collection(db, 'cardInteractions'), where('userId', '==', user.linkedPartnerId), where('cardId', '==', card.id), where('liked', '==', true)));

        if (!partnerInteractionSnap.empty) {
          // Parceiro também curtiu! Cria o match.
          console.log(`Match detectado para a carta ${card.id}!`);
          await createMatchInFirestore(card);
          return true; // Indica que um match ocorreu
        }
      }

    } catch (error) {
      console.error(`Firestore: Erro ao salvar interação ou verificar match para a carta ${card.id}:`, error);
    }
    return false; // Indica que nenhum match ocorreu
  };

  const handleConexaoCardInteraction = async (cardId: string, accepted: boolean) => {
    if (!user || !user.id) return;

    // Prepara dados para atualização local
    const currentSeenCards = user.seenCards || [];
    let newSeenCards = currentSeenCards;
    if (!currentSeenCards.includes(cardId)) {
      newSeenCards = [...currentSeenCards, cardId];
    }

    const updatedLocalUserData: Partial<User> = {
      conexaoAccepted: accepted ? (user.conexaoAccepted || 0) + 1 : (user.conexaoAccepted || 0),
      conexaoRejected: !accepted ? (user.conexaoRejected || 0) + 1 : (user.conexaoRejected || 0),
      seenCards: newSeenCards,
    };

    // Atualiza o estado local
    updateUser(updatedLocalUserData);

    // Persiste a mudança no Firestore
    const firestoreUpdateData: PartialWithFieldValue<User> = {
        conexaoAccepted: updatedLocalUserData.conexaoAccepted,
        conexaoRejected: updatedLocalUserData.conexaoRejected,
        seenCards: arrayUnion(cardId), // arrayUnion é para Firestore
    };
    await updateUserProfileInFirestore(user.id, firestoreUpdateData);
  };

  // Função para lidar com a criação de uma nova carta pelo usuário
  const handleCreateUserCard = async (category: Card['category'], text: string, intensity: number) => {
    if (!user || !text.trim()) {
        console.warn("Tentativa de criar carta sem usuário ou texto.");
        return;
    }

    if (!user || !user.id || !user.linkedPartnerId) {
      console.warn("Não é possível criar carta personalizada sem usuário logado e vinculado.");
      return;
    }

    const coupleId = [user.id, user.linkedPartnerId].sort().join('_');

    const newCardData: Omit<Card, 'id'> & { createdBy: string, coupleId: string, createdAt: Timestamp } = {
      category: category,
      text: text.trim(),
      intensity: intensity,
      createdBy: user.id, // Opcional: rastrear quem criou
      coupleId: coupleId, // Associa a carta ao casal
      createdAt: Timestamp.now(),
    };

    try {
      // Adiciona a nova carta à coleção 'userCards'
      const userCardsCollectionRef = collection(db, 'userCards');
      const docRef = await addDoc(userCardsCollectionRef, newCardData);
      console.log(`Firestore: Carta personalizada criada com ID: ${docRef.id}`);

      // Marcar a carta recém-criada como vista para o criador
      await markCardAsSeen(docRef.id);

    } catch (error) {
      console.error("Firestore: Erro ao criar carta personalizada:", error);
    }
  };

  return {
    matchedCards,
    seenCards,
    conexaoAcceptedCount,
    conexaoRejectedCount,
    markCardAsSeen,
    handleRegularCardInteraction, // Renomeado para clareza e agora lida com likes/dislikes e match detection
    toggleHotStatus,
    handleConexaoCardInteraction,
    handleCreateUserCard, // Exporta a nova função
  };
}
