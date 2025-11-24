# Coleção `pendingLinks` (v4.0)

## Visão Geral

A coleção `pendingLinks` foi introduzida na **v4.0** para substituir o campo `linkCode` nos documentos de usuário. Isso simplifica a arquitetura e permite que qualquer usuário autenticado busque códigos sem precisar de permissões especiais.

## Estrutura

*   **Caminho:** `/pendingLinks/{linkCode}`
*   **Documento ID:** `linkCode` (6 caracteres, A-Z, 0-9, excluindo O, I, L)

### Campos

```typescript
interface PendingLink {
  coupleId: string;        // ID do couple associado (já criado em status 'pending')
  linkCode: string;        // Código de 6 caracteres (mesmo que Document ID)
  createdAt: Timestamp;    // Timestamp de criação
}
```

## Ciclo de Vida

### 1. Criação (User A gera código)

Quando `linkService.createLink()` é chamado:

1. Gera código aleatório de 6 caracteres
2. Cria documento `couples/{coupleId}` (status='pending', 1 membro)
3. Cria documento `pendingLinks/{code}`:
   ```typescript
   {
     coupleId: "couple_1234567890_xyz",
     linkCode: "ABC123",
     createdAt: serverTimestamp()
   }
   ```

### 2. Busca (User B insere código)

Quando `linkService.acceptLink(code)` é chamado:

1. Busca `pendingLinks/{code}`
2. Extrai `coupleId` do documento
3. Busca `couples/{coupleId}` para validar status='pending'

### 3. Deleção (Vínculo completado)

Após User B aceitar com sucesso:

1. Couple atualizado para status='completed' (2 membros)
2. **PendingLink deletado** (não é mais necessário)

## Regras Firestore

```javascript
match /pendingLinks/{code} {
  // Qualquer usuário autenticado pode criar, ler e deletar
  // Necessário para que User B possa buscar o código de User A
  allow read, create, delete: if request.auth != null;
  
  // Não permitir updates (create → delete apenas)
  allow update: if false;
}
```

### Justificativa das Permissões

**Por que `allow read` para todos?**
- User B precisa ler o pendingLink criado por User A
- Código tem 6 caracteres (65^6 = 1.1 bilhões combinações)
- Baixo risco de descoberta por força bruta
- Simplifica arquitetura (não precisa de lógica de convite)

**Por que não tem expiração?**
- Simplificação inicial
- Pode ser adicionado com Cloud Functions se necessário
- User A pode gerar novo código facilmente

## Diferenças da v3.x

| Aspecto | v3.x | v4.0 |
|---------|------|------|
| **Localização** | Campo em `users/{userId}` | Documento em `/pendingLinks` |
| **Permissões** | Complexas (read partner's document) | Simples (any authenticated user) |
| **Vínculo** | Code → User A → User B | Code → Couple ID → Both Users |
| **Cleanup** | Manual ou nunca | Automático (delete após aceite) |

## Exemplos de Queries

### Buscar PendingLink por código (User B aceitando)

```typescript
const pendingLinkRef = doc(db, 'pendingLinks', code);
const pendingLinkSnap = await getDoc(pendingLinkRef);

if (!pendingLinkSnap.exists()) {
  throw new Error('Código inválido ou expirado');
}

const { coupleId } = pendingLinkSnap.data();
```

### Criar PendingLink (User A gerando código)

```typescript
const code = generateCode(); // 6 caracteres
const coupleId = generateCoupleId(); // couple_timestamp_random

await setDoc(doc(db, 'pendingLinks', code), {
  coupleId,
  linkCode: code,
  createdAt: serverTimestamp()
});
```

### Deletar após aceite (dentro de transação)

```typescript
const pendingLinkRef = doc(db, 'pendingLinks', code);
transaction.delete(pendingLinkRef);
```

## Segurança e Validações

### Proteções Implementadas

✅ **Código único:** Document ID garante unicidade  
✅ **Formato validado:** 6 caracteres, A-Z, 0-9 apenas  
✅ **Couple vinculado:** Sempre associado a um couple válido  
✅ **Auto-limpeza:** Deletado após uso  
✅ **Atomicidade:** Criação/deleção em transações  

### Possíveis Melhorias Futuras

🔮 **Expiração:** TTL automático (Cloud Functions ou cliente)  
🔮 **Rate Limiting:** Limitar criação de códigos por usuário  
🔮 **Histórico:** Manter log de códigos usados (analytics)  
🔮 **Revogação:** Permitir User A cancelar código antes do aceite  

## Fluxo Visual

```
User A                    Firestore                     User B
  |                          |                            |
  |-- createLink() --------->|                            |
  |                          |-- Create couple (pending)  |
  |                          |-- Create pendingLink      |
  |<---- return code --------|                            |
  |                          |                            |
  | [compartilha código ABC123 por fora do app]           |
  |                          |                            |
  |                          |<---- acceptLink(ABC123) ---|
  |                          |-- Read pendingLink        |
  |                          |-- Get coupleId            |
  |                          |-- Update couple           |
  |                          |-- Delete pendingLink      |
  |                          |------ success! ---------->|
```

---

**Criado:** Novembro 2024  
**Versão:** 4.0
