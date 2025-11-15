import { useState, useEffect } from 'react';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
// CORREÇÃO TS: Importando os *tipos* separadamente
import type {
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
// CORREÇÃO TS: Importando os *tipos* separadamente
import { useAuth, type User } from '../contexts/AuthContext';
// CORREÇÃO TS: Importando os *tipos* separadamente
import type { Card } from '../data/cards';

// Estende o tipo User para incluir a propriedade 'votes' que existe no Firestore
interface UserWithVotes extends User {
  votes?: { yesVotes?: string[]; noVotes?: string[] };
}

// Define a estrutura esperada para os dados do casal
interface CoupleData {
  id: string;
  allMatches?: string[];
}

/**
 * Hook para "ouvir" e processar novos matches (Links) assim que eles ocorrem.
 * Ele compara os votos do usuário e do parceiro e atualiza o coupleData.
 * @param setNewMatchesForModal - Função de estado para exibir o modal de "Novo Match!"
 */
export const useLinkCompletionListener = (
  setNewMatchesForModal: (matches: Card[]) => void
) => {
  const { user } = useAuth();
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [localUserData, setLocalUserData] = useState<UserWithVotes | null>(null);
  const [localPartnerData, setLocalPartnerData] = useState<UserWithVotes | null>(
    null
  );
  const [localCoupleData, setLocalCoupleData] = useState<CoupleData | null>(
    null
  );

  // 1. Busca todas as cartas uma vez
  useEffect(() => {
    const fetchAllCards = async () => {
      const cardsSnapshot = await getDocs(collection(db, 'cards'));
      const userCardsSnapshot = await getDocs(collection(db, 'userCards'));

      // Tipagem correta, sem 'any'
      const fetchedCards = cardsSnapshot.docs.map(
        (d: QueryDocumentSnapshot<DocumentData>) =>
          ({ id: d.id, ...d.data() } as Card)
      );
      const fetchedUserCards = userCardsSnapshot.docs.map(
        (d: QueryDocumentSnapshot<DocumentData>) =>
          ({ id: d.id, ...d.data() } as Card)
      );

      setAllCards([...fetchedCards, ...fetchedUserCards]);
    };
    fetchAllCards();
  }, []);

  // 2. Busca os dados do usuário e parceiro (getDoc é ok aqui)
  useEffect(() => {
    const fetchDependentData = async () => {
      if (!user?.id || !user.partnerId) {
        setLocalUserData(null);
        setLocalPartnerData(null);
        return;
      }

      const userDocRef = doc(db, 'users', user.id);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setLocalUserData(userDocSnap.data() as UserWithVotes);
      }

      const partnerDocRef = doc(db, 'users', user.partnerId);
      const partnerDocSnap = await getDoc(partnerDocRef);
      if (partnerDocSnap.exists()) {
        setLocalPartnerData(partnerDocSnap.data() as UserWithVotes);
      }
    };

    fetchDependentData();
  }, [user?.id, user?.partnerId]);

  // 3. OUVIR os dados do casal (onSnapshot é a chave para o bug do loop)
  useEffect(() => {
    if (!user?.coupleId) {
      setLocalCoupleData(null);
      return;
    }

    const coupleDocRef = doc(db, 'couples', user.coupleId);
    
    const unsubscribe = onSnapshot(coupleDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setLocalCoupleData({
          id: docSnap.id,
          ...docSnap.data(),
        } as CoupleData);
      } else {
        setLocalCoupleData(null);
      }
    });

    return () => unsubscribe(); // Limpa o listener
  }, [user?.coupleId]);

  // 4. Efeito de processamento (com a lógica de filtro anti-loop)
  useEffect(() => {
    if (
      !localUserData ||
      !localPartnerData ||
      !localCoupleData ||
      !allCards.length ||
      isProcessing
    ) {
      return;
    }

    const userVotes = localUserData.votes?.yesVotes || [];
    const partnerVotes = localPartnerData.votes?.yesVotes || [];

    const newMatchIds = userVotes.filter((voteId: string) =>
      partnerVotes.includes(voteId)
    );

    if (newMatchIds.length === 0) {
      return;
    }

    const newMatches = newMatchIds
      .map((id: string) => allCards.find((card: Card) => card.id === id))
      .filter((card?: Card): card is Card => card !== undefined);

    if (newMatches.length === 0) {
      return;
    }

    setIsProcessing(true);

    // Lógica que quebra o loop:
    const matchesToUpload = newMatches.filter(
      (card: Card) => !(localCoupleData.allMatches || []).includes(card.id)
    );

    if (matchesToUpload.length > 0) {
      console.log(
        '[useLinkCompletionListener] Novos matches encontrados para upload:',
        matchesToUpload.map((c: Card) => c.id)
      );
      setNewMatchesForModal(matchesToUpload);

      const coupleDocRef = doc(db, 'couples', localCoupleData.id);
      updateDoc(coupleDocRef, {
        allMatches: arrayUnion(
          ...matchesToUpload.map((card: Card) => card.id)
        ),
      })
        .catch(console.error)
        .finally(() => {
          setIsProcessing(false);
        });
    } else {
      // Loop quebrado: matches já existem no DB, não faz nada.
      setIsProcessing(false);
    }
  }, [
    localUserData,
    localPartnerData,
    localCoupleData,
    allCards,
    setNewMatchesForModal,
    isProcessing,
  ]);
};