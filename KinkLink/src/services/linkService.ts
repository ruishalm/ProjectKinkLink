// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\services\linkService.ts
import {
  doc,
  getDoc, // Adicionado para verificação opcional
  Timestamp, // Adicionado para tipagem correta
  runTransaction, // Necessário para acceptLink
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { serverTimestamp } from 'firebase/firestore'; // Importação correta para serverTimestamp

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
  memberSymbols: { [key: string]: string };
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
  const initialUserDocSnap = await getDoc(userDocRef);
  if (initialUserDocSnap.exists() && (initialUserDocSnap.data().coupleId || initialUserDocSnap.data().partnerId)) {
      throw new Error("Você já está vinculado a alguém. Desvincule primeiro para criar um novo código.");
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
    await runTransaction(db, async (transaction) => {
      // Ler o documento do usuário dentro da transação para a verificação mais atualizada
      const userDocSnap = await transaction.get(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("Seus dados de usuário não foram encontrados.");
      }

      const userData = userDocSnap.data() as UserLinkStatus;
      if (userData.coupleId) {
        throw new Error("Você já está vinculado a alguém. Desvincule primeiro para criar um novo código.");
      }

      // Criar o novo documento em pendingLinks
      transaction.set(pendingLinkRef, newPendingLink);

      // ATUALIZAR o linkCode no documento do usuário iniciador
      transaction.update(userDocRef, { linkCode: linkCode });
    });

    console.log(`Link pendente criado com sucesso. Código: ${linkCode} para usuário ${currentUser.uid}`);
    return linkCode; // Retornar o código para ser exibido na UI
  } catch (error) {
    if (error instanceof Error) {
      console.error("Erro ao criar o link pendente no Firestore:", error.message);
    } else {
      console.error("Erro desconhecido ao criar o link pendente no Firestore:", error);
    }
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

  const normalizedCode = linkCodeToAccept.toUpperCase().trim();
  const pendingLinkRef = doc(db, 'pendingLinks', normalizedCode);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Ler o link pendente
      const pendingLinkSnap = await transaction.get(pendingLinkRef);
      const pendingLinkData = pendingLinkSnap.data();

      if (!pendingLinkSnap.exists() || !pendingLinkData || pendingLinkData.status !== 'pending') {
        throw new Error("Código de vínculo inválido, expirado ou já utilizado.");
      }

      const initiatorUserIdA = pendingLinkData.initiatorUserId;

      if (initiatorUserIdA === currentUserB.uid) {
        throw new Error("Você não pode se vincular consigo mesmo.");
      }

      // 2. Ler os documentos dos dois usuários
      const userARef = doc(db, 'users', initiatorUserIdA);
      const userBRef = doc(db, 'users', currentUserB.uid);
      const [userASnap, userBSnap] = await Promise.all([
        transaction.get(userARef),
        transaction.get(userBRef)
      ]);

      if (!userASnap.exists()) {
        transaction.update(pendingLinkRef, { status: 'expired' });
        throw new Error("O usuário que criou o código não foi encontrado.");
      }
      if (!userBSnap.exists()) {
        throw new Error("Seus dados de usuário não foram encontrados.");
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

      // 3. Todos os cheques passaram, realizar a vinculação
      const newCoupleRef = doc(db, 'couples', `${[initiatorUserIdA, currentUserB.uid].sort().join('_')}`);
      const newCoupleId = newCoupleRef.id;

      const coupleDocData: CoupleData = {
        members: [initiatorUserIdA, currentUserB.uid].sort() as [string, string],
        createdAt: serverTimestamp() as Timestamp,
        memberSymbols: {
          [initiatorUserIdA]: '★',
          [currentUserB.uid]: '▲',
        },
      };
      transaction.set(newCoupleRef, coupleDocData);

      // Atualiza os dois usuários
      transaction.update(userARef, { partnerId: currentUserB.uid, coupleId: newCoupleId, linkCode: null });
      transaction.update(userBRef, { partnerId: initiatorUserIdA, coupleId: newCoupleId });

      // Deleta o link pendente
      transaction.delete(pendingLinkRef);

      return { coupleId: newCoupleId, partnerId: initiatorUserIdA };
    });

    console.log(`Vínculo criado com sucesso. Couple ID: ${result.coupleId}`);
    return result;
  } catch (error) {
    console.error(`Erro ao aceitar código de vínculo ${normalizedCode}:`, error);
    throw error; // Re-lança o erro para ser tratado pela UI
  }
};

/**
 * [REMOVIDO] Esta função não é mais necessária. A lógica foi consolidada em `acceptLink`.
 */
export const completeLinkForInitiator = async (): Promise<void> => {};
