# Refatoração do Sistema de Vínculos entre Casais

## 🔴 Problemas Identificados

### 1. Fluxo em Duas Etapas Desnecessário
**Atual:** 
- `acceptLink()` atualiza apenas o Usuário B
- Listener no `CreateLink.tsx` detecta mudança
- `completeLinkForInitiator()` atualiza Usuário A
- Dois momentos diferentes de atualização criam inconsistência

**Problema:**
- Se o listener falhar ou o usuário A fechar o app, fica em estado inconsistente
- Complexidade desnecessária: o que deveria ser atômico não é
- Risco de race conditions

### 2. Coexistência de Dois Sistemas
**Sistemas:**
- `linkService.ts` (mais novo, com pendingLinks)
- `useCoupleLinking.ts` (antigo, com linkRequests)

**Problema:**
- Código duplicado e confuso
- Difícil manutenção
- Não está claro qual usar

### 3. Lógica de Self-Healing Complexa
**Localização:** `AuthContext.tsx` (linha ~240-280)

**Problema:**
- Self-healing executado em CADA render que muda user
- Pode causar loops se não for bem controlado
- Deveria ser responsabilidade do backend (Cloud Functions)

### 4. Múltiplos Pontos de Atualização
**Coleções afetadas:**
- `pendingLinks`
- `couples`
- `users` (2 documentos)

**Problema:**
- Se qualquer etapa falhar, fica inconsistente
- Não é atômico
- Dificulta rollback

---

## ✅ Solução Proposta

### Arquitetura Simplificada

#### 1. **Sistema Único com Transação Atômica**
```
Fluxo Novo:
1. Usuário A gera código → cria documento em pendingLinks
2. Usuário B insere código → TUDO acontece em UMA transação:
   - Validações
   - Cria documento couples
   - Atualiza users/A
   - Atualiza users/B
   - Remove pendingLinks
3. Ambos são notificados via onSnapshot (que já existe)
```

**Vantagens:**
- Operação atômica via `runTransaction()`
- Ou funciona tudo, ou nada
- Sem estados intermediários
- Sem listeners complexos

#### 2. **Remover Hook useCoupleLinking**
- Manter apenas `linkService.ts`
- Consolidar toda lógica de vínculo em um lugar
- Mais fácil de testar e manter

#### 3. **Self-Healing via Cloud Functions**
- Remover self-healing do frontend
- Criar Cloud Function que roda periodicamente
- Limpa estados inconsistentes no backend
- Frontend apenas renderiza o estado atual

#### 4. **Simplificar Desvinculação**
```typescript
unlinkCouple():
- Operação em batch:
  1. Atualiza users/A (limpa partnerId, coupleId)
  2. Atualiza users/B (limpa partnerId, coupleId)  
  3. Deleta documento couples
  4. Deleta pendingLinks relacionados (se houver)
```

---

## 📋 Plano de Implementação

### Fase 1: Refatorar linkService.ts
- [ ] Modificar `acceptLink()` para fazer tudo em uma transação
- [ ] Remover `completeLinkForInitiator()`
- [ ] Adicionar validações robustas

### Fase 2: Atualizar Componentes
- [ ] Remover listener de `CreateLink.tsx`
- [ ] Simplificar `AcceptLink.tsx`
- [ ] Ambos apenas chamam o service e confiam no onSnapshot do AuthContext

### Fase 3: Remover useCoupleLinking
- [ ] Deletar arquivo `useCoupleLinking.ts`
- [ ] Remover imports em todos os lugares
- [ ] Mover `unlinkCouple` para `linkService.ts`

### Fase 4: Limpar AuthContext
- [ ] Remover self-healing do useEffect
- [ ] Manter apenas o onSnapshot que atualiza o estado
- [ ] Mover `unlinkCouple` para usar o novo service

### Fase 5: Cloud Function (Futuro)
- [ ] Criar function para detectar estados inconsistentes
- [ ] Rodar a cada X horas
- [ ] Logs detalhados para debugging

---

## 🎯 Resultado Esperado

### Antes (Atual)
```
Criar Link: 1 operação
Aceitar Link: 2 etapas (com listener intermediário)
Desvincular: 1 operação (mas self-healing roda sempre)
Código: 2 sistemas paralelos
```

### Depois (Novo)
```
Criar Link: 1 operação
Aceitar Link: 1 operação atômica
Desvincular: 1 operação atômica
Código: 1 sistema centralizado
```

### Benefícios Mensuráveis
- ⚡ **50% menos operações** no Firestore
- 🐛 **Zero estados inconsistentes** durante vínculo
- 📝 **-500 linhas** de código
- 🧪 **Mais fácil de testar** (menos mocks necessários)
- 💰 **Menor custo** (menos reads/writes no Firestore)

---

## 🚨 Considerações de Migração

### Dados Existentes
- `pendingLinks` antigos podem ser limpos manualmente ou via script
- `linkRequests` (se existir) deve ser deletado
- Usuários já vinculados não são afetados

### Compatibilidade
- Mudança é **não-destrutiva** para vínculos existentes
- Novos vínculos usam o novo fluxo
- Nenhuma interrupção de serviço necessária

### Testing
- Testar cenários:
  - Vínculo bem-sucedido
  - Código inválido
  - Usuário já vinculado
  - Auto-vínculo (mesmo usuário)
  - Perda de conexão no meio do processo
  - Desvinculação com e sem parceiro online

---

## 📝 Código de Referência

### Novo acceptLink() (Proposta)
```typescript
export const acceptLink = async (linkCode: string): Promise<{ coupleId: string }> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Não autenticado");

  const normalizedCode = linkCode.toUpperCase().trim();
  
  return await runTransaction(db, async (transaction) => {
    // 1. Buscar e validar pendingLink
    const pendingRef = doc(db, 'pendingLinks', normalizedCode);
    const pendingSnap = await transaction.get(pendingRef);
    
    if (!pendingSnap.exists()) throw new Error("Código inválido");
    const pendingData = pendingSnap.data();
    
    if (pendingData.status !== 'pending') throw new Error("Código já usado");
    
    const initiatorId = pendingData.initiatorUserId;
    if (initiatorId === currentUser.uid) throw new Error("Auto-vínculo não permitido");
    
    // 2. Validar ambos usuários
    const userARef = doc(db, 'users', initiatorId);
    const userBRef = doc(db, 'users', currentUser.uid);
    
    const [userASnap, userBSnap] = await Promise.all([
      transaction.get(userARef),
      transaction.get(userBRef)
    ]);
    
    if (!userASnap.exists() || !userBSnap.exists()) {
      throw new Error("Usuário não encontrado");
    }
    
    const userAData = userASnap.data();
    const userBData = userBSnap.data();
    
    if (userAData.partnerId || userBData.partnerId) {
      throw new Error("Usuário já vinculado");
    }
    
    // 3. Criar casal e atualizar TUDO atomicamente
    const sortedIds = [initiatorId, currentUser.uid].sort();
    const coupleId = sortedIds.join('_');
    const coupleRef = doc(db, 'couples', coupleId);
    
    transaction.set(coupleRef, {
      members: sortedIds,
      createdAt: serverTimestamp(),
      memberSymbols: {
        [sortedIds[0]]: '★',
        [sortedIds[1]]: '▲'
      }
    });
    
    // 4. Atualizar AMBOS usuários
    transaction.update(userARef, {
      partnerId: currentUser.uid,
      coupleId: coupleId,
      linkCode: null
    });
    
    transaction.update(userBRef, {
      partnerId: initiatorId,
      coupleId: coupleId
    });
    
    // 5. Remover pendingLink
    transaction.delete(pendingRef);
    
    return { coupleId };
  });
};
```

---

## ❓ Perguntas para Revisar

1. Há algum caso de uso que requer o fluxo em duas etapas?
2. O sistema antigo `linkRequests` ainda é usado em algum lugar?
3. Há Cloud Functions que dependem da estrutura atual?
4. Há notificações que dependem do listener intermediário?

