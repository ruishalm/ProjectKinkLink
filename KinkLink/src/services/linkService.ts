// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\services\linkService.ts
import {
  doc,
  setDoc,
  getDoc, // Adicionado para verificação opcional
  serverTimestamp,
  Timestamp, // Adicionado para tipagem correta
  runTransaction, // Necessário para acceptLink
  collection,     // Necessário para criar o doc do casal
  WriteBatch,     // Necessário para completeLinkForInitiator
  writeBatch      // Necessário para completeLinkForInitiator
} from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ajustado para apontar para src/firebase.ts

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

  // 1. Verificar se o usuário atual já está vinculado
  const userDocRef = doc(db, 'users', currentUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data() as UserLinkStatus;
    if (userData.coupleId || userData.partnerId) {
      throw new Error("Você já está vinculado a alguém. Desvincule primeiro para criar um novo código.");
    }
  } else {
    // Isso não deveria acontecer se o usuário está logado e o M1.T8 (criar doc 'users') foi feito.
    console.warn(`Documento do usuário ${currentUser.uid} não encontrado em 'users'.`);
    throw new Error("Não foi possível verificar seu status de vínculo. Tente novamente.");
  }

  // 2. Gerar um linkCode
  // Para o MVP, vamos assumir que a chance de colisão com 6 caracteres é baixa.
  // Uma estratégia mais robusta envolveria verificar se o doc já existe e tentar novamente.
  const linkCode = generateLinkCode();
  const pendingLinkRef = doc(db, 'pendingLinks', linkCode); // Usando linkCode como ID do documento

  // 3. Preparar os dados para o novo link pendente
  const newPendingLink: Omit<PendingLinkData, 'acceptedBy' | 'coupleId'> = { // Omitindo campos opcionais na criação
    initiatorUserId: currentUser.uid,
    linkCode: linkCode, // Redundante se for o ID, mas útil para consultas se mudar a estratégia de ID
    status: 'pending',
    createdAt: serverTimestamp() as Timestamp, // O Firestore converterá isso para um Timestamp
  };

  // 4. Salvar o link pendente no Firestore
  try {
    await setDoc(pendingLinkRef, newPendingLink);
    console.log(`Link pendente criado com sucesso. Código: ${linkCode}`);
    return linkCode; // Retornar o código para ser exibido na UI
  } catch (error) {
    console.error("Erro ao criar o link pendente no Firestore:", error);
    throw new Error("Falha ao criar o código de vínculo. Tente novamente.");
  }
};

/**
 * Permite que o Usuário B (aceitante) aceite um código de vínculo.
 * Esta função executa uma transação para garantir a atomicidade das operações.
 * Atualiza o pendingLink, cria o documento do casal e atualiza o user doc do Usuário B.
 * @param linkCodeToAccept O código de vínculo inserido pelo Usuário B.
 * @returns Um objeto com o `coupleId` e o `partnerId` (ID do iniciador).
 * @throws Erro se o usuário não estiver autenticado, o código for inválido, ou se algum dos usuários já estiver vinculado.
 */
export const acceptLink = async (linkCodeToAccept: string): Promise<{ coupleId: string; partnerId: string }> => {
  const currentUserB = auth.currentUser;
  if (!currentUserB) {
    throw new Error("Usuário não autenticado. Faça login para aceitar um link.");
  }

  const pendingLinkRef = doc(db, 'pendingLinks', linkCodeToAccept);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Ler o pendingLink
      const pendingLinkSnap = await transaction.get(pendingLinkRef);
      if (!pendingLinkSnap.exists()) {
        throw new Error("Código de vínculo inválido ou não encontrado.");
      }
      const pendingLinkData = pendingLinkSnap.data() as PendingLinkData;

      if (pendingLinkData.status !== 'pending') {
        // Poderia ser mais específico com a mensagem baseada no status
        throw new Error("Este código de vínculo já foi usado, expirou ou foi cancelado.");
      }

      const initiatorUserIdA = pendingLinkData.initiatorUserId;

      if (initiatorUserIdA === currentUserB.uid) {
        throw new Error("Você não pode se vincular consigo mesmo.");
      }

      // 2. Ler os documentos dos usuários A (iniciador) e B (aceitante)
      const userARef = doc(db, 'users', initiatorUserIdA);
      const userBRef = doc(db, 'users', currentUserB.uid);

      const userASnap = await transaction.get(userARef);
      const userBSnap = await transaction.get(userBRef);

      if (!userASnap.exists()) {
        // O usuário A pode ter deletado a conta. Marcar o link como expirado.
        transaction.update(pendingLinkRef, { status: 'expired' });
        throw new Error("O usuário que criou o código não foi encontrado. O código pode ter expirado.");
      }
      if (!userBSnap.exists()) {
        // Isso não deveria acontecer para o usuário B logado.
        throw new Error("Seus dados de usuário não foram encontrados. Tente novamente.");
      }

      const userDataA = userASnap.data() as UserLinkStatus;
      const userDataB = userBSnap.data() as UserLinkStatus;

      if (userDataA.coupleId || userDataA.partnerId) {
        // O iniciador já se vinculou com outra pessoa enquanto este link estava pendente.
        transaction.update(pendingLinkRef, { status: 'cancelled_initiator_linked' });
        throw new Error("O usuário que criou o código já está vinculado a outra pessoa.");
      }
      if (userDataB.coupleId || userDataB.partnerId) {
        throw new Error("Você já está vinculado a outra pessoa. Desvincule primeiro.");
      }

      // 3. Todos os cheques passaram, proceder com a vinculação
      const newCoupleRef = doc(collection(db, 'couples')); // Gera ID automático para o casal
      const newCoupleId = newCoupleRef.id;

      const coupleDocData: CoupleData = {
        members: [initiatorUserIdA, currentUserB.uid].sort() as [string, string], // Ordenar IDs para consistência
        createdAt: serverTimestamp() as Timestamp,
      };
      transaction.set(newCoupleRef, coupleDocData);

      // Atualizar documento do Usuário B (aceitante)
      transaction.update(userBRef, {
        partnerId: initiatorUserIdA,
        coupleId: newCoupleId,
      });

      // Atualizar o pendingLink
      transaction.update(pendingLinkRef, {
        status: 'completed',
        acceptedBy: currentUserB.uid,
        coupleId: newCoupleId,
      });
      
      return { coupleId: newCoupleId, partnerId: initiatorUserIdA };
    });

    console.log(`Vínculo com código ${linkCodeToAccept} aceito com sucesso pelo Usuário B! Couple ID: ${result.coupleId}`);
    return result;
  } catch (error) {
    console.error(`Erro ao aceitar código de vínculo ${linkCodeToAccept}:`, error);
    throw error; // Re-throw para ser tratado pela UI
  }
};

/**
 * Permite que o Usuário A (iniciador) finalize o processo de vinculação
 * atualizando seu próprio documento de usuário após um link ser aceito.
 * Esta função é geralmente chamada após um listener detectar a mudança no pendingLink.
 * @param completedPendingLink Os dados do pendingLink que foi marcado como 'completed'.
 * @throws Erro se o usuário não estiver autenticado, não for o iniciador, ou se os dados do link estiverem incompletos.
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
    // Isso pode indicar um problema ou que o listener foi acionado prematuramente.
    throw new Error("O link não foi completamente aceito ou os dados estão faltando.");
  }

  const userARef = doc(db, 'users', currentUserA.uid);
  const batch: WriteBatch = writeBatch(db);

  batch.update(userARef, {
    partnerId: completedPendingLink.acceptedBy,
    coupleId: completedPendingLink.coupleId,
  });

  // Opcional: Deletar o pendingLink após a conclusão bem-sucedida por ambos os lados.
  // const pendingLinkRefToDelete = doc(db, 'pendingLinks', completedPendingLink.linkCode);
  // batch.delete(pendingLinkRefToDelete);

  try {
    await batch.commit();
    console.log(`Usuário A (${currentUserA.uid}) completou a vinculação com ${completedPendingLink.acceptedBy}. Couple ID: ${completedPendingLink.coupleId}`);
  } catch (error) {
    console.error("Erro ao completar vinculação para o iniciador (Usuário A):", error);
    throw error;
  }
};
