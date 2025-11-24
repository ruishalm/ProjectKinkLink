# Guia de Migração: v3.x → v4.0

## 📋 Visão Geral

A versão 4.0 do KinkLink introduz uma **refatoração completa** do sistema de vínculo de casal, resolvendo problemas críticos de arquitetura que causavam loops infinitos e erros de permissão.

**Data de Implementação:** Novembro 2024  
**Status:** ✅ Completo e testado em produção

---

## 🎯 Motivação

### Problemas na v3.x

❌ **Loops Infinitos:** Sistema entrava em loop durante vinculação  
❌ **Erros de Permissão:** User B não podia editar documento do User A  
❌ **Arquitetura Complexa:** Edições cruzadas de documentos  
❌ **Redundância:** Campos `partnerId` e `linkedPartnerId` duplicavam info  
❌ **Regras Confusas:** Permissões Firestore complexas e frágeis  

### Solução v4.0

✅ **Zero Loops:** Cada user edita apenas seu próprio documento  
✅ **Permissões Simples:** Checagens baseadas em `couple.members`  
✅ **Couple Upfront:** Criado imediatamente pelo iniciador  
✅ **ID Aleatório:** `couple_timestamp_random` (não concatenação UIDs)  
✅ **Menos Redundância:** Info de parceiro vem de `couple.members`  

---

## 🔄 Mudanças Estruturais

### Banco de Dados

#### Coleção `users`

**Removido:**
```typescript
{
  linkCode?: string;           // ❌ Movido para pendingLinks
  linkedPartnerId?: string;    // ❌ Redundante
  partnerId?: string;          // ❌ Nunca usado
}
```

**Mantido:**
```typescript
{
  coupleId: string | null;     // ✅ Único identificador de vínculo
}
```

#### Nova Coleção `pendingLinks`

```typescript
// Caminho: /pendingLinks/{code}
interface PendingLink {
  coupleId: string;        // ID do couple (já criado)
  linkCode: string;        // 6 caracteres (A-Z, 0-9, sem O/I/L)
  createdAt: Timestamp;    // Timestamp de criação
}
```

**Permissões:**
```javascript
match /pendingLinks/{code} {
  allow read, create, delete: if request.auth != null;
}
```

#### Coleção `couples` - ATUALIZADA

**Antes (v3.x):**
```typescript
{
  userIds: string[];       // [userId1, userId2]
  createdAt: Timestamp;
  status?: string;
}
```

**Depois (v4.0):**
```typescript
{
  status: 'pending' | 'completed';    // ✅ Novo estado intermediário
  initiatorId: string;                 // ✅ Quem criou o vínculo
  members: string[];                   // 🔄 Renomeado de userIds
  memberSymbols: {                     // ✅ Símbolos de identificação
    [userId]: '★' | '▲';
  };
  createdAt: Timestamp;
}
```

**Ciclo de Vida:**
1. **Criação (User A):** `status='pending'`, `members=[userA]`
2. **Aceitação (User B):** `status='completed'`, `members=[userA, userB]`

---

## 🔧 Mudanças de Código

### `linkService.ts` - REESCRITA COMPLETA

#### Antes (v3.x)
```typescript
// User A gerava linkCode em seu próprio documento
// User B editava documento de User A
// Couple criado durante acceptLink
```

#### Depois (v4.0)

**1. createLink() - User A**
```typescript
// Gera coupleId aleatório
const coupleId = `couple_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Cria couple (pending, 1 membro)
await setDoc(doc(db, 'couples', coupleId), {
  status: 'pending',
  initiatorId: userId,
  members: [userId],
  memberSymbols: { [userId]: '★' },
  createdAt: serverTimestamp()
});

// Atualiza próprio perfil
await updateDoc(doc(db, 'users', userId), { coupleId });

// Cria pendingLink
const code = generateCode(); // 6 chars
await setDoc(doc(db, 'pendingLinks', code), {
  coupleId,
  linkCode: code,
  createdAt: serverTimestamp()
});
```

**2. acceptLink(code) - User B**
```typescript
// Busca pendingLink
const pendingLinkSnap = await getDoc(doc(db, 'pendingLinks', code));
const { coupleId } = pendingLinkSnap.data();

// Transação atômica
await runTransaction(db, async (transaction) => {
  // User B atualiza PRÓPRIO perfil
  transaction.update(userRef, { coupleId });
  
  // Completa couple (2 membros)
  transaction.update(coupleRef, {
    status: 'completed',
    members: [initiatorId, userId],
    memberSymbols: {
      [initiatorId]: '★',
      [userId]: '▲'
    }
  });
  
  // Deleta pendingLink
  transaction.delete(pendingLinkRef);
});
```

**3. unlinkCouple(coupleId) - Simplificado**
```typescript
// Antes: unlinkCouple(userId, partnerId, coupleId)
// Depois: unlinkCouple(coupleId)

await runTransaction(db, async (transaction) => {
  // Loop através de members
  for (const memberId of couple.members) {
    transaction.update(
      doc(db, 'users', memberId),
      { coupleId: null }
    );
  }
  
  // Deleta couple
  transaction.delete(coupleRef);
});
```

---

## 🛡️ Regras Firestore

### Antes (v3.x) - Complexas

```javascript
// Usuário precisava permissão para ler documento do parceiro
match /users/{userId} {
  allow read: if request.auth.uid == userId ||
                 isLinkedPartner(userId);
}

// Couple precisava concatenação de UIDs
match /couples/{coupleId} {
  allow read: if userIsInCouple(coupleId);
}
```

### Depois (v4.0) - Simplificadas

```javascript
// PendingLinks - Qualquer autenticado
match /pendingLinks/{code} {
  allow read, create, delete: if request.auth != null;
}

// Couples - Create (pending)
match /couples/{coupleId} {
  allow create: if request.resource.data.status == 'pending' &&
                   request.resource.data.initiatorId == request.auth.uid &&
                   request.resource.data.members.size() == 1;
  
  // Update (complete)
  allow update: if request.auth.uid in request.resource.data.members;
  
  // Read
  allow get: if request.resource.data.status == 'pending' ||
                userHasCoupleId();
}

// Subcoleções (likedInteractions, cardChats, messages)
match /couples/{coupleId}/likedInteractions/{cardId} {
  allow read, write: if userHasCoupleId();
}

// Helper function
function userHasCoupleId() {
  return exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.coupleId == coupleId;
}
```

---

## 🧪 Componentes React Atualizados

### Detecção de Vínculo

**Antes:**
```typescript
const isUserLinked = !!user?.partnerId;
```

**Depois:**
```typescript
const isUserLinked = !!user?.coupleId;
```

**Arquivos afetados:**
- `App.tsx`
- `LinkedRoute.tsx` ⚠️ **CRÍTICO** - Estava bloqueando acesso a cartas
- `ProfilePage.tsx`
- `LinkCouplePage.tsx`

### Busca de Parceiro

**Antes:**
```typescript
const partnerDoc = await getDoc(doc(db, 'users', user.partnerId));
```

**Depois:**
```typescript
const coupleDoc = await getDoc(doc(db, 'couples', user.coupleId));
const partnerIds = coupleDoc.data().members.filter(id => id !== user.uid);
const partnerId = partnerIds[0];
const partnerDoc = await getDoc(doc(db, 'users', partnerId));
```

**Arquivos afetados:**
- `ProfilePage.tsx`
- `LinkCouplePage.tsx`
- `useLinkCompletionListener.ts`

### Hooks

**`useCoupleLinking.ts`:**
```typescript
// Função deprecada
const unlinkPartner = () => {
  throw new Error('unlinkPartner is deprecated. Use unlinkCouple from AuthContext');
};

// Nova assinatura
const handleUnlink = async () => {
  await unlinkCouple(userData.coupleId); // Apenas coupleId
};
```

**`useUserCardInteractions.ts`:**
```typescript
// Removida checagem de partnerId
// Apenas coupleId é usado
```

---

## 📊 Tabela Comparativa

| Aspecto | v3.x | v4.0 |
|---------|------|------|
| **Couple ID** | Concatenação UIDs | Aleatório (`couple_${timestamp}_${random}`) |
| **partnerId em users** | ✅ Usado | ❌ Removido |
| **linkedPartnerId em users** | ✅ Usado | ❌ Removido |
| **linkCode em users** | ✅ Campo | ❌ Movido para `pendingLinks` |
| **Criação Couple** | Durante `acceptLink` | Durante `createLink` (pending) |
| **Edição Cruzada** | User B edita User A | ❌ NUNCA acontece |
| **unlinkCouple params** | 3 (userId, partnerId, coupleId) | 1 (coupleId) |
| **Permissões Firestore** | Complexas (cross-user reads) | Simples (self-edit + couple check) |
| **Busca Parceiro** | Direto (`user.partnerId`) | Via couple (`couple.members`) |

---

## 🚀 Passos de Migração (Se Dados Existentes)

⚠️ **IMPORTANTE:** Se houver usuários com dados na v3.x, execute este script:

### Script de Migração (Firestore)

```typescript
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

async function migrateToV4() {
  const db = getFirestore();
  const batch = writeBatch(db);
  
  // 1. Migrar users
  const usersSnap = await getDocs(collection(db, 'users'));
  
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    
    // Remove campos obsoletos
    const updates: any = {};
    if ('linkedPartnerId' in userData) updates.linkedPartnerId = null;
    if ('partnerId' in userData) updates.partnerId = null;
    if ('linkCode' in userData) updates.linkCode = null;
    
    if (Object.keys(updates).length > 0) {
      batch.update(doc(db, 'users', userDoc.id), updates);
    }
  }
  
  // 2. Migrar couples (se necessário)
  const couplesSnap = await getDocs(collection(db, 'couples'));
  
  for (const coupleDoc of couplesSnap.docs) {
    const coupleData = coupleDoc.data();
    
    // Adicionar campos v4.0
    const updates: any = {
      status: 'completed',
      members: coupleData.userIds || coupleData.members,
    };
    
    if (!coupleData.initiatorId) {
      updates.initiatorId = (coupleData.userIds || coupleData.members)[0];
    }
    
    if (!coupleData.memberSymbols) {
      const [user1, user2] = coupleData.userIds || coupleData.members;
      updates.memberSymbols = {
        [user1]: '★',
        [user2]: '▲'
      };
    }
    
    batch.update(doc(db, 'couples', coupleDoc.id), updates);
  }
  
  // 3. Commit
  await batch.commit();
  console.log('✅ Migração v4.0 concluída!');
}
```

### Execução

```bash
# Em Cloud Functions ou script local
firebase deploy --only functions:migrateToV4
# OU
ts-node scripts/migrateToV4.ts
```

---

## ✅ Checklist de Migração

- [ ] Backup do banco de dados Firestore
- [ ] Executar script de migração de dados
- [ ] Deploy das novas Firestore Rules
- [ ] Deploy do código frontend atualizado
- [ ] Testar fluxo completo:
  - [ ] Criar vínculo (User A)
  - [ ] Aceitar vínculo (User B)
  - [ ] Verificar acesso a cartas
  - [ ] Verificar formação de Links
  - [ ] Verificar chats
  - [ ] Desvincular contas
- [ ] Monitorar logs por 24h
- [ ] Atualizar documentação (✅ Completo)

---

## 🐛 Problemas Conhecidos Resolvidos

### 1. Loop Infinito Durante Linking
**Causa v3.x:** User B tentava editar documento de User A sem permissão  
**Solução v4.0:** Cada user edita apenas seu próprio documento  

### 2. LinkedRoute Bloqueando Cartas
**Causa v3.x:** Checava `user.partnerId` que foi removido  
**Solução v4.0:** Atualizado para checar `user.coupleId`  

### 3. Função unlinkCouple com 3 Parâmetros
**Causa v3.x:** Precisava userId, partnerId e coupleId  
**Solução v4.0:** Apenas `coupleId` (loop via `couple.members`)  

---

## 📚 Documentação Atualizada

- ✅ `docs/architecture/01-data-model.md` - Campos removidos documentados
- ✅ `docs/architecture/02-authentication-flow.md` - Signup atualizado
- ✅ `docs/architecture/04-couple-connection-flow.md` - Fluxo v4.0 completo
- ✅ `docs/architecture/07-pendinglinks-collection.md` - Nova coleção
- ✅ `docs/user-guide/05-partner-connection.md` - Guia de usuário atualizado
- ✅ `CHANGELOG.md` - Release notes v4.0
- ✅ `README.md` - Seção de arquitetura v4.0

---

## 🎉 Resultado

**Antes (v3.x):**
- 10+ iterações de loops
- Erros de permissão constantes
- Arquitetura frágil

**Depois (v4.0):**
- ✅ Zero loops
- ✅ Zero erros de permissão
- ✅ Testado e funcionando em produção
- ✅ Código mais limpo e manutenível
- ✅ Documentação completa

---

**Data de Conclusão:** Novembro 2024  
**Testado por:** User A (Mobile) + User B (Desktop)  
**Status:** ✅ PRODUÇÃO - Funcionando perfeitamente
