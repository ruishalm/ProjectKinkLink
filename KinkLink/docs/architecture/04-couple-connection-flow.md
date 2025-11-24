# Fluxo de Conexão de Casal (v4.0)

Este documento descreve o processo pelo qual dois usuários do KinkLink podem conectar suas contas para formar um casal dentro do aplicativo.

**Versão:** 4.0 (Nova Arquitetura - Novembro 2024)

## 1. Visão Geral

A conexão de casal permite que os usuários compartilhem interações com cartas, formem "Links" (matches) e utilizem o chat integrado. O processo envolve:
- **User A (Iniciador):** Gera código → cria `couple` (pending, 1 membro) + `pendingLink`
- **User B (Aceitante):** Aceita código → atualiza próprio perfil + completa `couple` (2 membros)

**Princípio fundamental:** Cada usuário edita APENAS seu próprio documento, evitando problemas de permissão.

## 2. Componentes Envolvidos

*   **Frontend (React App):**
    *   `CreateLink.tsx`: Interface para gerar código de vínculo
    *   `AcceptLink.tsx`: Interface para aceitar código
    *   `LinkCouplePage.tsx`: Página de gerenciamento de vínculo
    *   `AuthContext.tsx`: Gerencia estado do usuário e operações de vínculo/desvínculo
    *   `linkService.ts`: Serviço centralizado para operações de linking (createLink, acceptLink, unlinkCouple)
*   **Backend (Firestore):**
    *   `pendingLinks` (Coleção): Armazena convites pendentes com código, coupleId e timestamp
    *   `users` (Coleção): Documentos atualizados apenas com `coupleId` (campo `partnerId` REMOVIDO)
    *   `couples` (Coleção): Documento criado pelo iniciador com status ('pending'/'completed'), initiatorId, members[], memberSymbols{}

## 3. Fluxo Detalhado (Nova Arquitetura v4.0)

### Parte 1: Criando o Vínculo (Usuário A - Iniciador)

**Função:** `linkService.createLink()`

1.  **Validações Iniciais:**
    *   Verifica se User A está autenticado
    *   Verifica se User A já não está vinculado (`userData.coupleId === null`)

2.  **Criação do Couple (Transação Atômica):**
    *   Gera `coupleId` aleatório: `couple_${timestamp}_${random}` (NÃO concatenação de UIDs)
    *   Cria documento `couples/{coupleId}`:
        ```typescript
        {
          status: 'pending',
          initiatorId: userA.uid,
          members: [userA.uid],
          memberSymbols: { [userA.uid]: '★' },
          createdAt: serverTimestamp()
        }
        ```

3.  **Atualização do Usuário A:**
    *   Atualiza `users/{userA.uid}`:
        ```typescript
        { coupleId: coupleId }
        ```

4.  **Criação do PendingLink:**
    *   Gera código de 6 caracteres (A-Z, 0-9, excluindo O, I, L)
    *   Cria documento `pendingLinks/{code}`:
        ```typescript
        {
          coupleId: coupleId,
          linkCode: code,
          createdAt: serverTimestamp()
        }
        ```

5.  **Retorno:**
    *   Retorna o código para ser exibido ao User A

### Parte 2: Aceitando o Vínculo (Usuário B - Aceitante)

**Função:** `linkService.acceptLink(code)`

1.  **Busca do PendingLink (Transação Atômica):**
    *   Busca documento `pendingLinks/{code}`
    *   **Validações:**
        *   Código existe?
        *   Extrai `coupleId` do pendingLink

2.  **Busca e Validação do Couple:**
    *   Busca documento `couples/{coupleId}`
    *   **Verificações:**
        *   Couple existe?
        *   Status é 'pending'?
        *   User B não é o iniciador (evita auto-vinculação)

3.  **Validação do User B:**
    *   Busca documento `users/{userB.uid}`
    *   Verifica que `userData.coupleId === null` (não está vinculado)

4.  **Completar o Vínculo (Mesma Transação):**
    *   **Atualiza User B:**
        ```typescript
        users/{userB.uid}: { coupleId: coupleId }
        ```
    *   **Completa Couple:**
        ```typescript
        couples/{coupleId}: {
          status: 'completed',
          members: [userA.uid, userB.uid],
          memberSymbols: {
            [userA.uid]: '★',
            [userB.uid]: '▲'
          }
        }
        ```
    *   **Deleta PendingLink:**
        ```typescript
        delete pendingLinks/{code}
        ```

5.  **Retorno:**
    *   Retorna `{ coupleId, partnerId: initiatorId }` para compatibilidade

**IMPORTANTE:** User B NUNCA edita documento do User A. Cada usuário edita apenas seu próprio perfil.

### Parte 3: Desvinculação (Qualquer Usuário)

**Função:** `linkService.unlinkCouple(coupleId)`

1.  **Busca do Couple (Transação Atômica):**
    *   Busca documento `couples/{coupleId}`
    *   Verifica que user autenticado está em `couple.members`

2.  **Reseta Ambos Usuários:**
    *   Loop através de `couple.members`:
        ```typescript
        for (memberId in couple.members) {
          users/{memberId}: { coupleId: null }
        }
        ```

3.  **Deleta Couple:**
    *   Delete `couples/{coupleId}`

**Assinatura Simplificada:** Apenas precisa de `coupleId` (não precisa de `userId` ou `partnerId`)

## 4. Mudanças da Arquitetura v4.0

### Diferenças da Versão Anterior:

| Aspecto | v3.x (Antiga) | v4.0 (Nova) |
|---------|---------------|-------------|
| **Couple ID** | Concatenação de UIDs | ID aleatório gerado |
| **partnerId** | Campo no documento user | REMOVIDO (redundante) |
| **Criação Couple** | Durante acceptLink | Durante createLink (pending) |
| **Edição Cruzada** | User B edita User A | NUNCA acontece |
| **Permissões** | Complexas, multi-usuário | Simples, auto-edição |
| **Unlinking** | 3 parâmetros (userId, partnerId, coupleId) | 1 parâmetro (coupleId) |

### Vantagens:

✅ **Sem Loops de Permissão:** Cada user edita apenas seu próprio documento  
✅ **Regras Simplificadas:** Checagens baseadas apenas em `couple.members`  
✅ **Mais Flexível:** Couple ID aleatório permite futuras extensões  
✅ **Menos Redundância:** `partnerId` removido, info vem de `couple.members`  
✅ **Atomic Garantido:** Transações Firestore garantem consistência  

## 5. Regras Firestore (Resumo)

```javascript
// Couples - Create (pending, 1 member)
allow create: if status == 'pending' && 
                 initiatorId == auth.uid && 
                 members.size() == 1;

// Couples - Update (complete with 2 members)
allow update: if auth.uid in request.resource.data.members;

// Couples - Read
allow get: if status == 'pending' ||  // Qualquer user (para acceptLink)
              userHasCoupleId();       // Ou user tem coupleId

// PendingLinks - Simplified
allow read, create, delete: if request.auth != null;
```

---

**Última Atualização:** Novembro 2024  
**Versão:** 4.0 (Arquitetura Nova - Sem partnerId)