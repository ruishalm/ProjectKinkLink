# 🧪 Guia de Testes - Sistema de Vínculos Refatorado

## ⚠️ IMPORTANTE: Testes Essenciais

Antes de fazer deploy em produção, **teste todos os cenários abaixo**.

---

## 🎯 Cenário 1: Vínculo Normal (Feliz)

### Passo a Passo

1. **Usuário A - Criar Código**
   - Fazer login como Usuário A
   - Ir para `/link-couple`
   - Clicar em "Quero Gerar um Código"
   - Clicar em "Gerar Meu Código"
   
   **✅ Esperado:**
   - Código de 6 caracteres aparece
   - Botão "Copiar Código" funciona
   - Link completo também é gerado

2. **Verificar Firestore** (Opcional, mas recomendado)
   ```
   Coleção: pendingLinks
   Documento: [CÓDIGO_GERADO]
   Campos:
     - status: "pending"
     - initiatorUserId: [UID do Usuário A]
     - createdAt: [timestamp]
   ```

3. **Usuário B - Aceitar Código**
   - Fazer login como Usuário B (outro navegador/aba anônima)
   - Ir para `/link-couple`
   - Clicar em "Tenho um Código para Inserir"
   - Inserir o código do Usuário A
   - Clicar em "Conectar"
   
   **✅ Esperado:**
   - Mensagem de sucesso aparece
   - Redirecionamento automático OU botão para ir às cartas

4. **Verificar Firestore** (Importante!)
   ```
   Coleção: pendingLinks
   Documento: [CÓDIGO_GERADO]
   Status: ❌ DELETADO (não deve mais existir)
   
   Coleção: couples
   Documento: [ID_ORDENADO]
   Campos:
     - members: [UID_A, UID_B] (ordenados)
     - createdAt: [timestamp]
     - memberSymbols: { UID_A: '★', UID_B: '▲' }
   
   Coleção: users
   Documento: [UID_A]
   Campos atualizados:
     - partnerId: [UID_B]
     - coupleId: [ID_DO_CASAL]
     - linkCode: null (limpo)
   
   Documento: [UID_B]
   Campos atualizados:
     - partnerId: [UID_A]
     - coupleId: [ID_DO_CASAL]
   ```

5. **Verificar UI - Ambos Usuários**
   - **Usuário A:** Recarregar a página `/link-couple`
     - Deve mostrar "Você já está Vinculado!"
     - Nome/email do Usuário B deve aparecer
   
   - **Usuário B:** Já deve estar na tela de vinculado
     - Nome/email do Usuário A deve aparecer

**⏱️ Tempo Esperado:** < 2 segundos do aceite até ambos verem o vínculo

---

## 🚫 Cenário 2: Códigos Inválidos

### Teste 2.1: Código que não existe
- Inserir código aleatório: `XYZABC`
- **✅ Esperado:** Erro "Código de vínculo inválido ou não encontrado."

### Teste 2.2: Código já usado
- Usar um código que já foi aceito anteriormente
- **✅ Esperado:** Erro "Este código de vínculo já foi usado, expirou ou foi cancelado."

### Teste 2.3: Auto-vínculo
- Usuário A tenta usar seu próprio código
- **✅ Esperado:** Erro "Você não pode se vincular consigo mesmo."

---

## 🔗 Cenário 3: Usuários Já Vinculados

### Teste 3.1: Usuário A já vinculado tenta gerar novo código
- Usuário A (já vinculado) tenta gerar novo código
- **✅ Esperado:** Erro "Você já está vinculado a alguém. Desvincule primeiro para criar um novo código."

### Teste 3.2: Usuário B já vinculado tenta aceitar código
- Usuário B (já vinculado) tenta aceitar código de Usuário C
- **✅ Esperado:** Erro "Você já está vinculado a outra pessoa. Desvincule primeiro."

### Teste 3.3: Iniciador se vincula antes do código ser aceito
1. Usuário A gera código
2. Usuário A se vincula com Usuário C por outro código
3. Usuário B tenta usar o código original de A
- **✅ Esperado:** Erro "O usuário que criou o código já está vinculado a outra pessoa."

---

## 🔓 Cenário 4: Desvinculação

### Teste 4.1: Desvinculação Normal
1. Usuário A e B estão vinculados
2. Usuário A vai em `/link-couple`
3. Clica em "Desfazer Vínculo"
4. Confirma no popup

**✅ Esperado:**
- Mensagem de confirmação
- Redirecionamento ou atualização da página
- Ambos usuários podem gerar novos códigos

**Verificar Firestore:**
```
Coleção: couples
Documento: [ID_DO_CASAL]
Status: ❌ DELETADO

Coleção: users
Documento: [UID_A]
Campos zerados:
  - partnerId: null
  - coupleId: null
  - seenCards: []
  - conexaoAccepted: 0
  - conexaoRejected: 0
  - userCreatedCards: []
  - matchedCards: []
  - linkCode: null

Documento: [UID_B]
Campos zerados:
  - (mesmos campos acima)
```

### Teste 4.2: Desvinculação com parceiro offline
1. Usuário A e B vinculados
2. Usuário B fecha o navegador (offline)
3. Usuário A desvincula
4. Usuário B abre o navegador novamente

**✅ Esperado:**
- Usuário B automaticamente vê que foi desvinculado
- Pode gerar novo código

---

## 🌐 Cenário 5: Link Direto com inviteCode

### Teste 5.1: Copiar link completo
1. Usuário A gera código
2. Copia o "Link Direto" (não apenas o código)
   - Exemplo: `https://seuapp.com/link-couple?inviteCode=ABC123`
3. Usuário B abre esse link

**✅ Esperado:**
- Formulário já vem preenchido com o código
- Usuário B só precisa clicar em "Conectar"

---

## 🔥 Cenário 6: Testes de Estresse

### Teste 6.1: Múltiplas tentativas simultâneas
1. Usuário A gera código
2. Usuário B e C tentam aceitar AO MESMO TEMPO

**✅ Esperado:**
- Apenas UM deve conseguir (quem chegar primeiro)
- O outro deve receber erro que o código já foi usado

### Teste 6.2: Perda de conexão durante vínculo
1. Usuário A gera código
2. Usuário B insere código
3. **Antes de clicar "Conectar", desconectar internet**
4. Clicar em "Conectar"

**✅ Esperado:**
- Erro de conexão aparece
- **Reconectar internet**
- Tentar novamente
- Vínculo deve funcionar

---

## 📱 Cenário 7: Testes de Notificação (Se implementado)

### Teste 7.1: Notificação quando parceiro aceita
1. Usuário A gera código
2. Usuário A deixa app aberto mas minimizado
3. Usuário B aceita código
4. Verificar se Usuário A recebe notificação

**✅ Esperado:** (Depende da implementação)
- Notificação push OU
- Atualização automática da UI

---

## 🐛 Como Reportar Bugs

Se algo não funcionar como esperado:

1. **Abrir Console do Navegador** (F12)
2. **Procurar por:**
   - `❌` (erros)
   - `✅` (sucessos)
   - `[linkService]`
   - `[AuthContext]`

3. **Copiar logs relevantes**

4. **Verificar Firestore:**
   - Estado da coleção `pendingLinks`
   - Estado da coleção `couples`
   - Estado dos documentos em `users`

5. **Criar Issue no GitHub** com:
   - Cenário que falhou
   - Logs do console
   - Screenshots do Firestore
   - Passos para reproduzir

---

## ✅ Checklist Final

Antes de considerar os testes completos, marque:

- [ ] Vínculo normal funcionou perfeitamente
- [ ] Códigos inválidos retornam erros apropriados
- [ ] Usuários já vinculados não podem criar duplicatas
- [ ] Desvinculação limpa todos os dados
- [ ] Link direto com inviteCode funciona
- [ ] AuthContext.onSnapshot atualiza UI automaticamente
- [ ] Não há logs de erro no console
- [ ] Firestore não tem documentos órfãos (pendingLinks não deletados)
- [ ] Ambos usuários podem usar as cartas após vínculo
- [ ] Desempenho está bom (< 2s para vincular)

---

## 🚀 Deploy Sugerido

1. **Staging First:**
   - Fazer todos os testes acima em ambiente de staging
   - Convidar 2-3 usuários beta para testar

2. **Monitoramento:**
   - Configurar alertas para erros no Firestore
   - Monitorar logs de produção por 24h

3. **Rollback Plan:**
   - Manter código antigo em branch separada
   - Se houver problema crítico, usar rollback descrito em `REFACTORING_SUMMARY.md`

---

**Boa sorte com os testes! 🎉**
