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

  // 🔥 DESABILITA COMPLETAMENTE O HOOK SE NÃO ESTIVER VINCULADO
  const isLinked = !!(user?.coupleId && user?.id);
  
  console.log('[useLinkCompletionListener] Hook ativado. isLinked:', isLinked, 'user.coupleId:', user?.coupleId);

  // 1. Busca todas as cartas uma vez (SÓ SE VINCULADO)
  useEffect(() => {
    if (!isLinked) {
      console.log('[useLinkCompletionListener] Não vinculado - pulando fetch de cards');
      return;
    }
    
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
  }, [isLinked]);

  // 2. Busca os dados do usuário e parceiro (SÓ SE VINCULADO)
  useEffect(() => {
    if (!isLinked) {
      console.log('[useLinkCompletionListener] Não vinculado - pulando fetch de user/partner data');
      setLocalUserData(null);
      setLocalPartnerData(null);
      return;
    }
    
    const fetchDependentData = async () => {
      if (!user?.id || !user.coupleId) {
        setLocalUserData(null);
        setLocalPartnerData(null);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.id);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setLocalUserData(userDocSnap.data() as UserWithVotes);
        }

        // Buscar partner ID do couple document
        const coupleDocRef = doc(db, 'couples', user.coupleId);
        const coupleDocSnap = await getDoc(coupleDocRef);
        if (coupleDocSnap.exists()) {
          const coupleData = coupleDocSnap.data();
          const partnerId = coupleData.members.find((id: string) => id !== user.id);
          if (partnerId) {
            const partnerDocRef = doc(db, 'users', partnerId);
            const partnerDocSnap = await getDoc(partnerDocRef);
            if (partnerDocSnap.exists()) {
              setLocalPartnerData(partnerDocSnap.data() as UserWithVotes);
            }
          }
        }
      } catch (error) {
        console.error('[useLinkCompletionListener] Erro ao buscar dados:', error);
        setLocalUserData(null);
        setLocalPartnerData(null);
      }
    };

    fetchDependentData();
  }, [isLinked, user?.id, user?.coupleId]);

  // 3. OUVIR os dados do casal (onSnapshot é a chave para o bug do loop)
  useEffect(() => {
    // Desabilita COMPLETAMENTE se não estiver vinculado
    if (!isLinked) {
      console.log('[useLinkCompletionListener] Não vinculado - NÃO criando listener do couple');
      setLocalCoupleData(null);
      return;
    }
    
    // Só ativa o listener se o usuário estiver COMPLETAMENTE vinculado
    if (!user?.coupleId || !user?.id) {
      console.warn('[useLinkCompletionListener] isLinked=true mas faltam dados:', { coupleId: user?.coupleId, id: user?.id });
      setLocalCoupleData(null);
      return; // Return antecipado - não cria listener
    }

    console.log('[useLinkCompletionListener] Ativando listener para couple:', user.coupleId);
    const coupleDocRef = doc(db, 'couples', user.coupleId);
    
    // Wrapping onSnapshot em try-catch adicional
    try {
      const unsubscribe = onSnapshot(
        coupleDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setLocalCoupleData({
              id: docSnap.id,
              ...docSnap.data(),
            } as CoupleData);
          } else {
            setLocalCoupleData(null);
          }
        },
        (error) => {
          // Silencia completamente erros de permissão (esperados antes de vincular)
          if (error.code === 'permission-denied') {
            console.log('[useLinkCompletionListener] Permission denied para couple (esperado se não vinculado)');
          } else {
            console.error('[useLinkCompletionListener] Erro ao escutar couple:', error);
          }
          setLocalCoupleData(null);
        }
      );

      return () => {
        console.log('[useLinkCompletionListener] Limpando listener do couple');
        unsubscribe();
      };
    } catch (error) {
      console.error('[useLinkCompletionListener] Erro ao criar listener:', error);
      setLocalCoupleData(null);
    }
  }, [isLinked, user?.coupleId, user?.id]);

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