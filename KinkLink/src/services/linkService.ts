// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\services\linkService.ts
import {
  doc,
  getDoc, // Adicionado para verificação opcional
  Timestamp, // Adicionado para tipagem correta
  runTransaction, // Necessário para acceptLink
} from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ajustado para apontar para src/firebase.ts
import { getFunctions, httpsCallable } from 'firebase/functions'; // <<< CORRIGIDO
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
  // A verificação de vínculo e a atualização do linkCode do usuário serão feitas dentro da transação

  // Verificação inicial fora da transação para feedback rápido, se desejado.
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
        // Isso não deveria acontecer se o usuário está logado e o AuthContext garante a criação do doc.
        console.error(`Documento do usuário ${currentUser.uid} não encontrado em 'users' dentro da transação.`);
        throw new Error("Seus dados de usuário não foram encontrados. Tente novamente.");
      }

      const userData = userDocSnap.data() as UserLinkStatus;
      if (userData.coupleId || userData.partnerId) {
        // Se o usuário se vinculou entre a verificação inicial e agora.
        throw new Error("Você já está vinculado a alguém. Desvincule primeiro para criar um novo código.");
      }

      // Criar o novo documento em pendingLinks
      transaction.set(pendingLinkRef, newPendingLink);

      // ATUALIZAR o linkCode no documento do usuário iniciador
      transaction.update(userDocRef, {
        linkCode: linkCode // O mesmo código usado como ID do pendingLink
      });
    });
    console.log(`Link pendente criado com sucesso. Código: ${linkCode} para usuário ${currentUser.uid}`);
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
  const functions = getFunctions(); // Obtém a instância do Functions
  try {
    // Chama a Cloud Function 'acceptLinkCallable'
    const acceptLinkFunction = httpsCallable(functions, 'acceptLinkCallable');
    console.log(`[linkService] Chamando a Cloud Function 'acceptLinkCallable' com o código: ${linkCodeToAccept}`);
    
    const response = await acceptLinkFunction({ linkCode: linkCodeToAccept.toUpperCase().trim() });
    const data = response.data as { success: boolean; coupleId: string; partnerId: string };

    if (data.success) {
      console.log(`[linkService] Vínculo criado com sucesso via Cloud Function. Couple ID: ${data.coupleId}`);
      return { coupleId: data.coupleId, partnerId: data.partnerId };
    } else {
      // Isso não deve acontecer se a função lançar um erro, mas é uma segurança extra.
      throw new Error("A função de vínculo retornou uma resposta inesperada.");
    }
  } catch (error) {
    console.error(`Erro ao aceitar código de vínculo ${linkCodeToAccept}:`, error);
    throw error; // Re-throw para ser tratado pela UI
  }
};

/**
 * [REMOVIDO] Esta função não é mais necessária. A lógica foi consolidada em `acceptLink`.
 */
export const completeLinkForInitiator = async (): Promise<void> => {};
