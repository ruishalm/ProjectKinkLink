/**
 * 🔥 NOVA LÓGICA DE VÍNCULO - RECRIADA DO ZERO
 * 
 * PRINCÍPIOS:
 * - MÁXIMA SIMPLICIDADE
 * - 1 transação = 1 operação completa
 * - SEM estados intermediários
 * - SEM loops, SEM listeners extras
 * 
 * FLUXO:
 * 1. createLink() → Cria pendingLink (só isso)
 * 2. acceptLink() → 1 transação cria TUDO atomicamente
 * 
 * Data: 24/11/2025 - RESTART COMPLETO
 */

import {
  doc,
  runTransaction,
  serverTimestamp,
  type Transaction,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// ============================================================================
// TIPOS
// ============================================================================

interface PendingLink {
  initiatorUserId: string;
  linkCode: string;
  status: 'pending';
  createdAt: Timestamp;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem O, I, 0, 1
  return Array.from({ length: 6 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

// ============================================================================
// PASSO 1: CRIAR CÓDIGO
// ============================================================================

/**
 * Cria um código de vínculo.
 * Apenas cria pendingLink. Nada mais.
 */
export const createLink = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Não autenticado');

  const code = generateCode();
  const pendingLinkRef = doc(db, 'pendingLinks', code);

  await runTransaction(db, async (tx: Transaction) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await tx.get(userRef);
    
    if (!userSnap.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userData = userSnap.data();
    if (userData.coupleId || userData.partnerId) {
      throw new Error('Você já está vinculado');
    }

    // Cria pendingLink
    const pendingLink: PendingLink = {
      initiatorUserId: user.uid,
      linkCode: code,
      status: 'pending',
      createdAt: serverTimestamp() as Timestamp
    };
    tx.set(pendingLinkRef, pendingLink);

    // Salva código no user (para referência)
    tx.update(userRef, { linkCode: code });
  });

  console.log(`✅ Código criado: ${code}`);
  return code;
};

// ============================================================================
// PASSO 2: ACEITAR CÓDIGO
// ============================================================================

/**
 * Aceita um código e cria o vínculo.
 * TUDO em 1 transação atômica.
 */
export const acceptLink = async (
  code: string
): Promise<{ coupleId: string; partnerId: string }> => {
  const userB = auth.currentUser;
  if (!userB) throw new Error('Não autenticado');

  const normalizedCode = code.toUpperCase().trim();

  return await runTransaction(db, async (tx: Transaction) => {
    // 1. Buscar pendingLink
    const pendingLinkRef = doc(db, 'pendingLinks', normalizedCode);
    const pendingLinkSnap = await tx.get(pendingLinkRef);

    if (!pendingLinkSnap.exists()) {
      throw new Error('Código inválido');
    }

    const pendingLink = pendingLinkSnap.data() as PendingLink;
    if (pendingLink.status !== 'pending') {
      throw new Error('Código já foi usado');
    }

    const userAId = pendingLink.initiatorUserId;
    if (userAId === userB.uid) {
      throw new Error('Não pode vincular consigo mesmo');
    }

    // 2. Buscar ambos users
    const userARef = doc(db, 'users', userAId);
    const userBRef = doc(db, 'users', userB.uid);

    const [userASnap, userBSnap] = await Promise.all([
      tx.get(userARef),
      tx.get(userBRef)
    ]);

    if (!userASnap.exists() || !userBSnap.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userAData = userASnap.data();
    const userBData = userBSnap.data();

    if (userAData.coupleId || userAData.partnerId) {
      throw new Error('Usuário A já está vinculado');
    }
    if (userBData.coupleId || userBData.partnerId) {
      throw new Error('Você já está vinculado');
    }

    // 3. Definir IDs
    const sortedIds = [userAId, userB.uid].sort();
    const coupleId = sortedIds.join('_');

    // 4. ORDEM CORRETA:
    //    a) Atualizar User A
    tx.update(userARef, {
      partnerId: userB.uid,
      coupleId: coupleId,
      linkCode: null
    });

    //    b) Atualizar User B
    tx.update(userBRef, {
      partnerId: userAId,
      coupleId: coupleId
    });

    //    c) Criar Couple
    const coupleRef = doc(db, 'couples', coupleId);
    tx.set(coupleRef, {
      members: sortedIds,
      createdAt: serverTimestamp(),
      memberSymbols: {
        [sortedIds[0]]: '★',
        [sortedIds[1]]: '▲'
      }
    });

    //    d) Deletar pendingLink
    tx.delete(pendingLinkRef);

    return { coupleId, partnerId: userAId };
  });
};

// ============================================================================
// DESVINCULAR
// ============================================================================

/**
 * Desvincula um casal.
 */
export const unlinkCouple = async (
  userId: string,
  partnerId: string,
  coupleId: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid !== userId) {
    throw new Error('Não autorizado');
  }

  await runTransaction(db, async (tx: Transaction) => {
    const coupleRef = doc(db, 'couples', coupleId);
    const userARef = doc(db, 'users', userId);
    const userBRef = doc(db, 'users', partnerId);

    const coupleSnap = await tx.get(coupleRef);
    if (!coupleSnap.exists()) {
      throw new Error('Casal não encontrado');
    }

    const resetData = {
      partnerId: null,
      coupleId: null,
      linkCode: null,
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      userCreatedCards: [],
      matchedCards: []
    };

    tx.update(userARef, resetData);
    tx.update(userBRef, resetData);
    tx.delete(coupleRef);
  });

  console.log(`✅ Desvinculado: ${coupleId}`);
};
