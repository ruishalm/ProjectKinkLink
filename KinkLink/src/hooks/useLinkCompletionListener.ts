// KinkLink/src/hooks/useLinkCompletionListener.ts

import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, type User as AuthUser } from '../contexts/AuthContext';
import type { Card } from '../data/cards'; // Usar a interface Card correta

// Estende o tipo User para incluir a propriedade 'votes' que existe no Firestore
interface UserWithVotes extends AuthUser {
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
  const [allCards, setAllCards] = useState<Card[]>([]); // Estado local para as cartas
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados locais para armazenar os dados completos buscados do Firestore
  const [localPartnerData, setLocalPartnerData] = useState<UserWithVotes | null>(null);
  const [localCoupleData, setLocalCoupleData] = useState<CoupleData | null>(null);

  useEffect(() => {
    // Busca todas as cartas uma vez
    const fetchAllCards = async () => {
      const cardsSnapshot = await getDocs(collection(db, 'cards'));
      const userCardsSnapshot = await getDocs(collection(db, 'userCards'));
      const fetchedCards = cardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
      const fetchedUserCards = userCardsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Card));
      setAllCards([...fetchedCards, ...fetchedUserCards]);
    };
    fetchAllCards();
  }, []);

  useEffect(() => {
    // Busca os dados do parceiro e do casal quando o usuário estiver definido
    const fetchDependentData = async () => {
      if (!user?.partnerId || !user.coupleId) return;

      // Busca dados do parceiro
      const partnerDocRef = doc(db, 'users', user.partnerId);
      const partnerDocSnap = await getDoc(partnerDocRef);
      if (partnerDocSnap.exists()) {
        setLocalPartnerData(partnerDocSnap.data() as UserWithVotes);
      }

      // Busca dados do casal
      const coupleDocRef = doc(db, 'couples', user.coupleId);
      const coupleDocSnap = await getDoc(coupleDocRef);
      if (coupleDocSnap.exists()) {
        setLocalCoupleData({ id: coupleDocSnap.id, ...coupleDocSnap.data() } as CoupleData);
      }
    };

    fetchDependentData();
  }, [user?.partnerId, user?.coupleId]);

  useEffect(() => {

    // Se não temos todos os dados necessários, não fazemos nada.
    if (!user || !localPartnerData || !localCoupleData || !allCards.length || isProcessing) {
      return;
    }

    // 1. Pega todos os votos "Sim" (yesVotes) de ambos os usuários.
    const userVotes = (user as UserWithVotes)?.votes?.yesVotes || [];
    const partnerVotes = localPartnerData?.votes?.yesVotes || [];

    // 2. Encontra a intersecção (IDs que estão em AMBAS as listas).
    const newMatchIds = userVotes.filter((voteId: string) => partnerVotes.includes(voteId));

    if (newMatchIds.length > 0) {
      // 3. Converte os IDs de volta para objetos CardData completos.
      const newMatches = newMatchIds
        .map((id: string) => allCards.find((card: Card) => card.id === id))
        .filter((card?: Card): card is Card => card !== undefined); // Garante que não há 'undefined'

      // 4. Se encontramos matches, processamos.
      if (newMatches.length > 0) {
        setIsProcessing(true); // Trava para evitar processamento duplo

        // ---> INÍCIO DA CORREÇÃO (O Pulo do Gato) <---

        // 5. Filtramos APENAS os matches que ainda não estão no array 'allMatches' do casal.
        // É ISSO QUE QUEBRA O LOOP.
        const matchesToUpload = newMatches.filter(
          (card: Card) => !(localCoupleData.allMatches || []).includes(card.id)
        );

        // 6. Só mostramos o modal e atualizamos o banco se houver matches *realmente* novos.
        if (matchesToUpload.length > 0) {
          
          // ---> FIM DA CORREÇÃO <---

          console.log('[useLinkCompletionListener] Novos matches encontrados para upload:', matchesToUpload.map((c: Card) => c.id));
          setNewMatchesForModal(matchesToUpload); // Mostra o modal com os matches novos

          // 7. Atualiza o documento do casal no Firestore
          const coupleDocRef = doc(db, 'couples', localCoupleData.id);
          updateDoc(coupleDocRef, {
            allMatches: arrayUnion(...matchesToUpload.map((card: Card) => card.id))
          })
          .catch(console.error)
          .finally(() => {
            setIsProcessing(false); // Libera a trava
          });

        // ---> INÍCIO DA CORREÇÃO <---
        } else {
          // Se não há matches novos para upload (já estão no DB), apenas libera a trava.
          setIsProcessing(false);
        }
        // ---> FIM DA CORREÇÃO <---
      }
    }
  }, [user, localPartnerData, localCoupleData, allCards, setNewMatchesForModal, isProcessing]);
};