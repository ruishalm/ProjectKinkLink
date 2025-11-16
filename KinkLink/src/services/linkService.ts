// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\services\linkService.ts
import {
  doc,
  getDoc,
  Timestamp,
  runTransaction,
  WriteBatch,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';

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
    await runTransaction(db, async (transaction) => {
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
 * Etapa 1 do Vínculo: Usuário B (aceitante) aceita o código.
 * Esta função NÃO atualiza o Usuário A. Ela prepara o terreno para que o Usuário A finalize.
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
    const result = await runTransaction(db, async (transaction) => {
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

      const userARef = doc(db, 'users', initiatorUserIdA);
      const userBRef = doc(db, 'users', currentUserB.uid);

      const userASnap = await transaction.get(userARef);
      const userBSnap = await transaction.get(userBRef);

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

      const sortedIds = [initiatorUserIdA, currentUserB.uid].sort();
      const newCoupleId = sortedIds.join('_');
      const newCoupleRef = doc(db, 'couples', newCoupleId);

      const coupleDocData: CoupleData = {
        members: sortedIds as [string, string],
        createdAt: serverTimestamp() as Timestamp,
        memberSymbols: {
          [sortedIds[0]]: '★', // Atribui ao primeiro ID ordenado
          [sortedIds[1]]: '▲', // Atribui ao segundo ID ordenado
        },
      };
      transaction.set(newCoupleRef, coupleDocData);

      // Atualiza SOMENTE o documento do Usuário B (aceitante)
      transaction.update(userBRef, {
        partnerId: initiatorUserIdA,
        coupleId: newCoupleId,
      });

      // Atualiza o pendingLink para 'completed' para que o Usuário A possa finalizar
      transaction.update(pendingLinkRef, {
        status: 'completed',
        acceptedBy: currentUserB.uid,
        coupleId: newCoupleId,
      });
      
      return { coupleId: newCoupleId, partnerId: initiatorUserIdA };
    });

    console.log(`Etapa 1 concluída por ${currentUserB.uid}! Couple ID: ${result.coupleId}. Aguardando finalização do iniciador.`);
    return result;
  } catch (error) {
    console.error(`Erro na Etapa 1 (acceptLink) com código ${normalizedCode}:`, error);
    throw error;
  }
};

/**
 * Etapa 2 do Vínculo: Usuário A (iniciador) finaliza o processo.
 * Esta função é chamada após um listener na UI do Usuário A detectar que o link foi aceito.
 * @param completedPendingLink Os dados do pendingLink que foi marcado como 'completed'.
 */
export const completeLinkForInitiator = async (
  completedPendingLink: PendingLinkData
): Promise<void> => {
  const currentUserA = auth.currentUser;

  if (!currentUserA) {
    throw new Error("Usuário não autenticado para completar o vínculo.");
  }

  if (currentUserA.uid !== completedPendingLink.initiatorUserId) {
    throw new Error("Operação não autorizada: você não é o iniciador deste link.");
  }

  if (completedPendingLink.status !== 'completed' || !completedPendingLink.acceptedBy || !completedPendingLink.coupleId) {
    throw new Error("O link não foi completamente aceito ou os dados estão faltando.");
  }

  const userARef = doc(db, 'users', currentUserA.uid);
  const batch: WriteBatch = writeBatch(db);

  // Atualiza o documento do Usuário A
  batch.update(userARef, {
    partnerId: completedPendingLink.acceptedBy,
    coupleId: completedPendingLink.coupleId,
    linkCode: null, // Limpa o código do perfil do usuário
  });

  // Deleta o pendingLink após a conclusão bem-sucedida
  const pendingLinkRefToDelete = doc(db, 'pendingLinks', completedPendingLink.linkCode);
  batch.delete(pendingLinkRefToDelete);

  try {
    await batch.commit();
    console.log(`Etapa 2 concluída por ${currentUserA.uid}. Vínculo finalizado com ${completedPendingLink.acceptedBy}.`);
  } catch (error) {
    console.error("Erro na Etapa 2 (completeLinkForInitiator):", error);
    throw error;
  }
};
