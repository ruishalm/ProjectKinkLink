// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\services\linkService.ts
/**
 * 🔥 SISTEMA DE VÍNCULOS - SIMPLICIDADE SUPREMA
 * 
 * NOVA ARQUITETURA:
 * 
 * User A cria código:
 *   → Cria Couple (status: pending, 1 membro)
 *   → Atualiza próprio perfil (coupleId)
 *   → Cria pendingLink com coupleId
 * 
 * User B aceita código:
 *   → Atualiza próprio perfil (coupleId)
 *   → Atualiza Couple (status: completed, 2 membros)
 *   → Deleta pendingLink
 * 
 * BENEFÍCIOS:
 * ✅ Cada user edita APENAS próprio perfil
 * ✅ Ambos editam o couple (são members)
 * ✅ partnerId REMOVIDO (redundante)
 * ✅ Zero conflitos de permissão
 * 
 * Data: 24/11/2025 - v4.0 FINAL
 */
import {
  doc,
  Timestamp,
  runTransaction,
  serverTimestamp,
  type Transaction
} from 'firebase/firestore';
import { auth, db } from '../firebase';

// Gera código de 6 caracteres
const generateCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

// Gera ID aleatório para couple (não concatenação de UIDs)
const generateCoupleId = (): string => {
  return `couple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Tipos simplificados
interface PendingLink {
  coupleId: string;
  linkCode: string;
  createdAt: Timestamp;
}

interface Couple {
  status: 'pending' | 'completed';
  initiatorId: string;
  members: string[];
  memberSymbols: { [uid: string]: string };
  createdAt: Timestamp;
}


/**
 * User A cria código de vínculo.
 * Cria o Couple (pending) + atualiza próprio perfil + cria pendingLink.
 */
export const createLink = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Não autenticado');

  const code = generateCode();
  const coupleId = generateCoupleId();

  await runTransaction(db, async (tx: Transaction) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userData = userSnap.data();
    if (userData.coupleId) {
      throw new Error('Você já está vinculado');
    }

    // 1. Cria Couple (pending, 1 membro)
    const coupleRef = doc(db, 'couples', coupleId);
    const couple: Couple = {
      status: 'pending',
      initiatorId: user.uid,
      members: [user.uid],
      memberSymbols: { [user.uid]: '★' },
      createdAt: serverTimestamp() as Timestamp
    };
    tx.set(coupleRef, couple);

    // 2. Atualiza próprio perfil
    tx.update(userRef, { 
      coupleId,
      linkCode: code 
    });

    // 3. Cria pendingLink
    const pendingLinkRef = doc(db, 'pendingLinks', code);
    const pendingLink: PendingLink = {
      coupleId,
      linkCode: code,
      createdAt: serverTimestamp() as Timestamp
    };
    tx.set(pendingLinkRef, pendingLink);
  });

  console.log(`✅ Código criado: ${code} | Couple: ${coupleId}`);
  return code;
};

/**
 * User B aceita código de vínculo.
 * Atualiza próprio perfil + completa o Couple + deleta pendingLink.
 */
export const acceptLink = async (
  code: string
): Promise<{ coupleId: string; partnerId: string }> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Não autenticado');

  const normalizedCode = code.toUpperCase().trim();

  return await runTransaction(db, async (tx: Transaction) => {
    console.log(`[acceptLink] Iniciando transação para código: ${normalizedCode}, user: ${user.uid}`);

    // 1. Buscar pendingLink
    const pendingLinkRef = doc(db, 'pendingLinks', normalizedCode);
    const pendingLinkSnap = await tx.get(pendingLinkRef);

    if (!pendingLinkSnap.exists()) {
      console.error(`[acceptLink] Código ${normalizedCode} não encontrado`);
      throw new Error('Código inválido');
    }

    const pendingLink = pendingLinkSnap.data() as PendingLink;
    const { coupleId } = pendingLink;
    console.log(`[acceptLink] PendingLink encontrado, coupleId: ${coupleId}`);

    // 2. Buscar couple
    const coupleRef = doc(db, 'couples', coupleId);
    const coupleSnap = await tx.get(coupleRef);

    if (!coupleSnap.exists()) {
      throw new Error('Casal não encontrado');
    }

    const couple = coupleSnap.data() as Couple;
    console.log(`[acceptLink] Couple encontrado, status: ${couple.status}, members: ${couple.members}`);

    if (couple.status !== 'pending') {
      console.error(`[acceptLink] Couple ${coupleId} não está pending, status: ${couple.status}`);
      throw new Error('Código já foi usado');
    }

    if (couple.initiatorId === user.uid) {
      console.error(`[acceptLink] User ${user.uid} tentando linkar consigo mesmo`);
      throw new Error('Não pode vincular consigo mesmo');
    }

    // 3. Buscar user B
    const userBRef = doc(db, 'users', user.uid);
    const userBSnap = await tx.get(userBRef);

    if (!userBSnap.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userBData = userBSnap.data();
    if (userBData.coupleId) {
      console.error(`[acceptLink] User ${user.uid} já está vinculado, coupleId: ${userBData.coupleId}`);
      throw new Error('Você já está vinculado');
    }

    console.log(`[acceptLink] Validações passaram, atualizando couple primeiro`);

    // 4. Completar Couple primeiro (adicionar 2º membro)
    tx.update(coupleRef, {
        status: 'completed',
        members: [couple.initiatorId, user.uid],
        memberSymbols: {
        [couple.initiatorId]: '★',
        [user.uid]: '▲'
        }
      });

    console.log(`[acceptLink] Couple atualizado, agora atualizando user`);

    // 5. Atualizar próprio perfil (User B) - DEPOIS do couple
    tx.update(userBRef, { coupleId });    // 6. Deletar pendingLink
    tx.delete(pendingLinkRef);

    console.log(`✅ Vínculo completo! Couple: ${coupleId}`);
    return { coupleId, partnerId: couple.initiatorId };
  });
};

/**
 * Desvincula um casal.
 * Remove coupleId de ambos users + deleta couple.
 */
export const unlinkCouple = async (coupleId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Não autenticado');

  await runTransaction(db, async (tx: Transaction) => {
    const coupleRef = doc(db, 'couples', coupleId);
    const coupleSnap = await tx.get(coupleRef);

    if (!coupleSnap.exists()) {
      throw new Error('Casal não encontrado');
    }

    const couple = coupleSnap.data() as Couple;

    if (!couple.members.includes(user.uid)) {
      throw new Error('Você não é membro deste casal');
    }

    // Resetar ambos users
    const resetData = {
      coupleId: null,
      linkCode: null,
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      userCreatedCards: [],
      matchedCards: []
    };

    couple.members.forEach(uid => {
      const userRef = doc(db, 'users', uid);
      tx.update(userRef, resetData);
    });

    // Deletar couple
    tx.delete(coupleRef);
  });

  console.log(`✅ Desvinculado: ${coupleId}`);
};

