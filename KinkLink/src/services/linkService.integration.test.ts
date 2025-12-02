/**
 * Teste de integração para linkService
 * Execute com: npm test -- linkService.integration.test.ts
 * 
 * IMPORTANTE: Este teste usa o Firestore REAL (emulador ou produção)
 * Configure o emulador antes de rodar!
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createLink, acceptLink, unlinkCouple } from './linkService';
import { auth, db } from '../firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';

describe('linkService - Integration Tests', () => {
  let user1Id: string;
  let user2Id: string;
  let linkCode: string;

  beforeAll(async () => {
    console.log('⚙️  Configurando usuários de teste...');
    
    // Criar usuário 1
    await signInAnonymously(auth);
    user1Id = auth.currentUser!.uid;
    await setDoc(doc(db, 'users', user1Id), {
      username: 'TestUser1',
      email: 'test1@test.com',
      isAdmin: false,
      partnerId: null,
      coupleId: null,
    });
    console.log('✅ Usuário 1 criado:', user1Id);
    
    await signOut(auth);
    
    // Criar usuário 2
    await signInAnonymously(auth);
    user2Id = auth.currentUser!.uid;
    await setDoc(doc(db, 'users', user2Id), {
      username: 'TestUser2',
      email: 'test2@test.com',
      isAdmin: false,
      partnerId: null,
      coupleId: null,
    });
    console.log('✅ Usuário 2 criado:', user2Id);
  });

  afterAll(async () => {
    console.log('🧹 Limpando dados de teste...');
    
    try {
      // Limpar usuários
      await deleteDoc(doc(db, 'users', user1Id));
      await deleteDoc(doc(db, 'users', user2Id));
      
      // Limpar pendingLink se existir
      if (linkCode) {
        try {
          await deleteDoc(doc(db, 'pendingLinks', linkCode));
        } catch (e) {
          console.warn('PendingLink já foi deletado');
        }
      }
      
      // Nota: couple será deletado automaticamente pelo unlinkCouple nos testes
      
      await signOut(auth);
      console.log('✅ Limpeza concluída');
    } catch (error) {
      console.warn('⚠️  Erro na limpeza (pode ser normal):', error);
    }
  });

  it('1. Deve criar um link pendente com couple (Usuário 1)', async () => {
    // Login como usuário 1
    await signOut(auth);
    await signInAnonymously(auth);
    // Forçar o UID do usuário 1 (hack para teste)
    Object.defineProperty(auth.currentUser, 'uid', { value: user1Id, writable: false });
    
    linkCode = await createLink();
    
    expect(linkCode).toBeDefined();
    expect(linkCode).toHaveLength(6);
    expect(linkCode).toMatch(/^[A-Z0-9]{6}$/);
    
    console.log('✅ Link criado:', linkCode);
    
    // Verificar que o pendingLink foi criado no Firestore
    const pendingLinkSnap = await getDoc(doc(db, 'pendingLinks', linkCode));
    expect(pendingLinkSnap.exists()).toBe(true);
    const pendingData = pendingLinkSnap.data();
    expect(pendingData?.coupleId).toBeDefined();
    expect(pendingData?.linkCode).toBe(linkCode);
    
    // Verificar que o couple foi criado como 'pending' com 1 membro
    const coupleSnap = await getDoc(doc(db, 'couples', pendingData!.coupleId));
    expect(coupleSnap.exists()).toBe(true);
    const coupleData = coupleSnap.data();
    expect(coupleData?.status).toBe('pending');
    expect(coupleData?.initiatorId).toBe(user1Id);
    expect(coupleData?.members).toHaveLength(1);
    expect(coupleData?.members[0]).toBe(user1Id);
    
    // Verificar que o usuário 1 tem coupleId
    const user1Snap = await getDoc(doc(db, 'users', user1Id));
    expect(user1Snap.data()?.coupleId).toBe(pendingData!.coupleId);
  });

  it('2. Deve aceitar o link e completar o couple (Usuário 2)', async () => {
    // Login como usuário 2
    await signOut(auth);
    await signInAnonymously(auth);
    Object.defineProperty(auth.currentUser, 'uid', { value: user2Id, writable: false });
    
    const result = await acceptLink(linkCode);
    
    expect(result).toBeDefined();
    expect(result.coupleId).toBeDefined();
    expect(result.partnerId).toBe(user1Id);
    
    console.log('✅ Link aceito! CoupleId:', result.coupleId);
    
    // Verificar que o couple foi completado
    const coupleSnap = await getDoc(doc(db, 'couples', result.coupleId));
    expect(coupleSnap.exists()).toBe(true);
    const coupleData = coupleSnap.data();
    expect(coupleData?.status).toBe('completed');
    expect(coupleData?.members).toContain(user1Id);
    expect(coupleData?.members).toContain(user2Id);
    expect(coupleData?.members.length).toBe(2);
    expect(coupleData?.memberSymbols).toBeDefined();
    
    // Verificar que o usuário 1 tem coupleId (partnerId não é mais usado)
    const user1Snap = await getDoc(doc(db, 'users', user1Id));
    expect(user1Snap.data()?.coupleId).toBe(result.coupleId);
    
    // Verificar que o usuário 2 foi atualizado
    const user2Snap = await getDoc(doc(db, 'users', user2Id));
    expect(user2Snap.data()?.coupleId).toBe(result.coupleId);
    
    // Verificar que o pendingLink foi deletado
    const pendingLinkSnap = await getDoc(doc(db, 'pendingLinks', linkCode));
    expect(pendingLinkSnap.exists()).toBe(false);
  });

  it('3. Deve desvincular o couple atomicamente (Usuário 1)', async () => {
    // Login como usuário 1
    await signOut(auth);
    await signInAnonymously(auth);
    Object.defineProperty(auth.currentUser, 'uid', { value: user1Id, writable: false });
    
    // Buscar o coupleId do usuário 1
    const user1Snap = await getDoc(doc(db, 'users', user1Id));
    const coupleId = user1Snap.data()?.coupleId;
    expect(coupleId).toBeDefined();
    
    await unlinkCouple(coupleId);
    
    console.log('✅ Desvinculação completa!');
    
    // Verificar que o couple foi deletado
    const coupleSnap = await getDoc(doc(db, 'couples', coupleId));
    expect(coupleSnap.exists()).toBe(false);
    
    // Verificar que o usuário 1 foi resetado
    const user1SnapAfter = await getDoc(doc(db, 'users', user1Id));
    expect(user1SnapAfter.data()?.coupleId).toBeNull();
    
    // Verificar que o usuário 2 foi resetado
    const user2Snap = await getDoc(doc(db, 'users', user2Id));
    expect(user2Snap.data()?.coupleId).toBeNull();
  });
});
