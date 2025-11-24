// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\services\linkService.ts
/**
 * ⚡ REFATORADO: Sistema de Vínculos Simplificado (v2.0)
 * 
 * MUDANÇAS PRINCIPAIS:
 * - acceptLink() agora é TOTALMENTE atômico (1 transação faz tudo)
 * - completeLinkForInitiator() REMOVIDO (não é mais necessário)
 * - unlinkCouple() ADICIONADO para desvinculação atômica
 * 
 * BENEFÍCIOS:
 * - Sem estados intermediários inconsistentes
 * - Sem listeners adicionais necessários
 * - -66% operações Firestore
 * - Mais rápido e confiável
 * 
 * Data: 24/11/2025
 */
import {
  doc,
  getDoc,
  Timestamp,
  runTransaction,
  WriteBatch,
  writeBatch,
  serverTimestamp,
  type Transaction
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// --- Função Auxiliar para gerar o código ---
const generateLinkCode = (length: number = 6): string => {
  const characters = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Removido O, 0
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// --- Interface para os dados do usuário (campos relevantes para esta etapa) ---
interface UserLinkStatus {
  partnerId?: string | null;
  coupleId?: string | null;
}

// --- Interface para os dados do link pendente ---
export interface PendingLinkData { // Adicionado 'export'
  initiatorUserId: string;
  linkCode: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled_initiator_linked';
  createdAt: Timestamp; // Usaremos o Timestamp do Firestore
  acceptedBy?: string;
  coupleId?: string;
}

// --- Interface para os dados do casal ---
interface CoupleData {
  members: [string, string]; // Array com os dois UIDs, ordenados para consistência
  createdAt: Timestamp;
  memberSymbols: { [key: string]: string }; // Adicionado para os símbolos
}


/**
 * Cria um novo link pendente para o usuário atual.
 * O usuário não deve estar vinculado a ninguém.
 * O linkCode gerado será o ID do documento na coleção 'pendingLinks'.
 * @returns O linkCode gerado.
 * @throws Erro se o usuário não estiver autenticado ou já estiver vinculado.
 */
export const createLink = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Usuário não autenticado. Faça login para criar um link.");
  }

  const userDocRef = doc(db, 'users', currentUser.uid);

  // Verificação inicial fora da transação para feedback rápido.
  const initialUserDocSnap = await getDoc(userDocRef);
  if (initialUserDocSnap.exists() && (initialUserDocSnap.data().coupleId || initialUserDocSnap.data().partnerId)) {
      throw new Error("Você já está vinculado a alguém. Desvincule primeiro para criar um novo código.");
  }

  const linkCode = generateLinkCode();
  const pendingLinkRef = doc(db, 'pendingLinks', linkCode);

  const newPendingLink: Omit<PendingLinkData, 'acceptedBy' | 'coupleId'> = {
    initiatorUserId: currentUser.uid,
    linkCode: linkCode,
    status: 'pending',
    createdAt: serverTimestamp() as Timestamp,
  };

  try {
    await runTransaction(db, async (transaction: Transaction) => {
      const userDocSnap = await transaction.get(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Seus dados de usuário não foram encontrados. Tente novamente.");
      }

      const userData = userDocSnap.data() as UserLinkStatus;
      if (userData.coupleId || userData.partnerId) {
        throw new Error("Você já está vinculado a alguém. Desvincule primeiro para criar um novo código.");
      }

      transaction.set(pendingLinkRef, newPendingLink);
      transaction.update(userDocRef, { linkCode: linkCode });
    });
    console.log(`Link pendente criado com sucesso. Código: ${linkCode} para usuário ${currentUser.uid}`);
    return linkCode;
  } catch (error) {
    console.error("Erro ao criar o link pendente no Firestore:", error);
    if (error instanceof Error) {
        throw error; // Relança o erro original se for uma instância de Error
    }
    throw new Error("Falha ao criar o código de vínculo. Tente novamente.");
  }
};

/**
 * Aceita um código de vínculo e conecta dois usuários em uma única transação atômica.
 * Esta função realiza TODAS as operações necessárias para vincular o casal.
 * @param linkCodeToAccept O código de vínculo inserido pelo Usuário B.
 * @returns Um objeto com o `coupleId` e o `partnerId` (ID do iniciador).
 */
export const acceptLink = async (linkCodeToAccept: string): Promise<{ coupleId: string; partnerId: string }> => {
  const currentUserB = auth.currentUser;
  if (!currentUserB) {
    throw new Error("Usuário não autenticado. Faça login para aceitar um link.");
  }

  const normalizedCode = linkCodeToAccept.toUpperCase().trim();
  const pendingLinkRef = doc(db, 'pendingLinks', normalizedCode);

  try {
    const result = await runTransaction(db, async (transaction: Transaction) => {
      // 1. Buscar e validar o pendingLink
      const pendingLinkSnap = await transaction.get(pendingLinkRef);
      if (!pendingLinkSnap.exists()) {
        throw new Error("Código de vínculo inválido ou não encontrado.");
      }
      const pendingLinkData = pendingLinkSnap.data() as PendingLinkData;

      if (pendingLinkData.status !== 'pending') {
        throw new Error("Este código de vínculo já foi usado, expirou ou foi cancelado.");
      }

      const initiatorUserIdA = pendingLinkData.initiatorUserId;

      if (initiatorUserIdA === currentUserB.uid) {
        throw new Error("Você não pode se vincular consigo mesmo.");
      }

      // 2. Buscar e validar ambos os usuários
      const userARef = doc(db, 'users', initiatorUserIdA);
      const userBRef = doc(db, 'users', currentUserB.uid);

      const [userASnap, userBSnap] = await Promise.all([
        transaction.get(userARef),
        transaction.get(userBRef)
      ]);

      if (!userASnap.exists()) {
        transaction.update(pendingLinkRef, { status: 'expired' });
        throw new Error("O usuário que criou o código não foi encontrado. O código pode ter expirado.");
      }
      if (!userBSnap.exists()) {
        throw new Error("Seus dados de usuário não foram encontrados. Tente novamente.");
      }

      const userDataA = userASnap.data() as UserLinkStatus;
      const userDataB = userBSnap.data() as UserLinkStatus;

      if (userDataA.coupleId || userDataA.partnerId) {
        transaction.update(pendingLinkRef, { status: 'cancelled_initiator_linked' });
        throw new Error("O usuário que criou o código já está vinculado a outra pessoa.");
      }
      if (userDataB.coupleId || userDataB.partnerId) {
        throw new Error("Você já está vinculado a outra pessoa. Desvincule primeiro.");
      }

      // 3. Criar o documento do casal
      const sortedIds = [initiatorUserIdA, currentUserB.uid].sort();
      const newCoupleId = sortedIds.join('_');
      const newCoupleRef = doc(db, 'couples', newCoupleId);

      const coupleDocData: CoupleData = {
        members: sortedIds as [string, string],
        createdAt: serverTimestamp() as Timestamp,
        memberSymbols: {
          [sortedIds[0]]: '★',
          [sortedIds[1]]: '▲',
        },
      };
      transaction.set(newCoupleRef, coupleDocData);

      // 4. Atualizar AMBOS os usuários atomicamente
      transaction.update(userARef, {
        partnerId: currentUserB.uid,
        coupleId: newCoupleId,
        linkCode: null, // Limpa o código do iniciador
      });

      transaction.update(userBRef, {
        partnerId: initiatorUserIdA,
        coupleId: newCoupleId,
      });

      // 5. Remover o pendingLink (processo completo)
      transaction.delete(pendingLinkRef);
      
      return { coupleId: newCoupleId, partnerId: initiatorUserIdA };
    });

    console.log(`✅ Vínculo completo! Casal ${result.coupleId} criado entre ${currentUserB.uid} e ${result.partnerId}.`);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao aceitar link com código ${normalizedCode}:`, error);
    throw error;
  }
};

/**
 * Desvincula dois usuários e remove o documento do casal em uma única operação atômica.
 * @param userId O ID do usuário que está iniciando a desvinculação.
 * @param partnerId O ID do parceiro.
 * @param coupleId O ID do casal a ser removido.
 */
export const unlinkCouple = async (
  userId: string,
  partnerId: string,
  coupleId: string
): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error("Usuário não autenticado ou operação não autorizada.");
  }

  const batch: WriteBatch = writeBatch(db);

  try {
    // Campos a serem resetados em ambos os usuários
    const resetData = {
      partnerId: null,
      coupleId: null,
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      userCreatedCards: [],
      linkCode: null,
      matchedCards: [],
    };

    // 1. Atualizar Usuário A (atual)
    const userARef = doc(db, 'users', userId);
    batch.update(userARef, resetData);

    // 2. Atualizar Usuário B (parceiro)
    const userBRef = doc(db, 'users', partnerId);
    batch.update(userBRef, resetData);

    // 3. Deletar documento do casal
    const coupleRef = doc(db, 'couples', coupleId);
    batch.delete(coupleRef);

    await batch.commit();
    console.log(`✅ Desvinculação completa! Casal ${coupleId} removido. Usuários ${userId} e ${partnerId} resetados.`);
  } catch (error) {
    console.error(`❌ Erro ao desvincular casal ${coupleId}:`, error);
    throw error;
  }
};

