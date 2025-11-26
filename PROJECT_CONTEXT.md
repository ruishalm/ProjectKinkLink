# 📱 KinkLink - Documentação Completa do Projeto

> **Última Atualização:** 26 de Novembro de 2025
> **Status:** MVP Concluído | Em Refinamento

---

## 🎯 O QUE É O APP

**KinkLink** é um aplicativo web (PWA) para casais explorarem fetiches, fantasias e conexão emocional através de cartas interativas no estilo Tinder. Cada parceiro swipa cartas individualmente e, quando ambos curtem a mesma, forma-se um "Link" (match) que vai para uma lista compartilhada com chat integrado.

### Público-Alvo
Casais adultos que buscam melhorar a comunicação sobre desejos/atividades íntimas e fortalecer a conexão através de pequenos gestos, de forma privada e gamificada.

---

## 🏗️ ARQUITETURA TÉCNICA

### Stack Tecnológica

- **Frontend:** React + TypeScript + Vite
- **Backend:** Firebase (Authentication, Firestore, Cloud Functions, FCM)
- **Estilo:** CSS Modules + Sistema de Skins customizáveis
- **State Management:** Context API (Auth, Skins, Notifications)
- **Routing:** React Router v6
- **Animações:** CSS Transforms + React-Spring
- **Gestos:** @use-gesture/react

### Estrutura de Dados (Firestore)

```
users/{userId}
  ├─ Perfil básico (email, username, bio, birthDate, gender)
  ├─ coupleId, linkCode
  ├─ seenCards[] (IDs de cartas já vistas)
  ├─ maxIntensity (filtro 1-5)
  ├─ conexaoAccepted, conexaoRejected (contadores)
  ├─ unlockedSkinIds[]
  ├─ isSupporter, isAdmin
  ├─ feedbackTickets[]
  ├─ lastVisitedMatchesPage
  └─ fcmTokens/{token} (subcoleção para notificações push)

couples/{coupleId}
  ├─ members[] (array com 2 userIds)
  ├─ status ('pending' | 'completed')
  ├─ memberSymbols {userId: '▲' ou '⭐'}
  ├─ createdAt
  ├─ likedInteractions/{cardId}
  │   ├─ likedByUIDs[] (1 ou 2)
  │   ├─ isMatch (true quando ambos curtem)
  │   ├─ isHot (carta favoritada)
  │   ├─ isCompleted (carta marcada como realizada)
  │   ├─ cardData (snapshot da carta)
  │   ├─ createdAt, lastActivity
  └─ cardChats/{cardId}
      ├─ lastMessageTimestamp, lastMessageSenderId, lastMessageTextSnippet
      └─ messages/{msgId}
          ├─ userId, username, text, timestamp

cards/{cardId}
  ├─ text (conteúdo da carta)
  ├─ category ('sensorial' | 'poder' | 'fantasia' | 'exposicao' | 'conexao')
  ├─ intensity (1-5, null para conexao)

userCards/{cardId}
  ├─ text, category, intensity
  ├─ coupleId (carta privada para o casal)
  ├─ createdByUserId
  ├─ createdAt

pendingLinks/{linkCode}
  ├─ initiatorUserId
  ├─ status ('pending' | 'completed')
  ├─ createdAt
```

---

## 📄 PÁGINAS E ROTAS

### Públicas (Não Autenticadas)

**HomePage** (`/`)
- Landing page com demo interativa
- Botões para Login/Cadastro

**LoginPage** (`/login`)
- Login com email/senha
- Login com Google
- Link para "Esqueci a senha"

**SignupPage** (`/signup`)
- Cadastro com: email, senha, username, data de nascimento, gênero
- Validações de idade mínima e campos obrigatórios

**TermsOfServicePage** (`/termos-de-servico`)
- Termos de serviço completos
- Política de privacidade

**SupportPage** (`/suporte`)
- FAQ
- Formulário de contato/feedback

### Protegidas (Requer Autenticação)

**ProfilePage** (`/profile`)
- Editar: bio, username, gênero, data de nascimento
- **maxIntensity:** Filtro de intensidade (1-5) das cartas
- **Reavaliar Cartas:** Resetar cartas marcadas como "Não Topo!"
- **Resetar Dados:** Limpar todos os dados de teste
- **Desvincular:** Quebrar o vínculo do casal
- Gerenciar tickets de feedback
- Tutorial interativo

**LinkCouplePage** (`/link-couple`)
- **Criar Vínculo:** Gera código de 6 dígitos
- **Aceitar Vínculo:** Inserir código do parceiro
- Status de vínculo pendente
- Ver nome/símbolo do parceiro (▲ Triângulo ou ⭐ Estrela)

### Protegidas + Vinculadas (Requer `coupleId`)

**CardPilePage** (`/cards`) ⭐ **NÚCLEO DO APP**

**Funcionalidades:**
- Swipe left 👎 (Não Topo!) / right 👍 (Topo!)
- Fila inteligente:
  - 2/3 das cartas são likes do parceiro
  - 1/3 são cartas gerais do sistema
- **Match Modal:** Aparece quando forma um Link
- **Conexão Modal:** Cartas especiais de conexão emocional (periódicas)
- **Criar Carta:** Modal para cartas customizadas
- **Oops!:** Desfaz último "Não Topo!" (volta a carta descartada)
- **Carinhos & Mimos:** Lista de cartas de conexão aceitas
- Contador de cartas não vistas

**UI Elements:**
- Pilha de cartas com animação de flip (costas → frente)
- Carta de fundo simulando baralho
- Navegação inferior: Carinhos & Mimos | Links | Perfil
- Botão "Crie seu Kink" (miniatura da carta de costas)

---

**MatchesPage** (`/matches`)

**Seções:**

1. **🔥 Top Links** (isHot: true)
   - Cartas favoritadas pelo casal
   - Grid visual destacado
   - Bordes progressivas conforme quantidade

2. **Outros Links** (isHot: false)
   - Agrupados por categoria em carrosséis
   - Categorias: Poder, Fantasia, Exposição, Sensorial
   - Navegação horizontal por categoria

3. **✅ Cartas Realizadas** (isCompleted: true)
   - Matches marcados como concluídos
   - Sem botão de favoritar

**Funcionalidades por Carta:**
- Click → Abre modal de chat
- Botão 🔥 → Toggle favorito
- Indicador de mensagens não lidas
- Snippet da última mensagem
- Badge "Novo!" para matches recentes

**Chat Modal:**
- Histórico de mensagens em tempo real
- Input com emoji picker
- Botões: Favoritar | Marcar como Realizada | Repetir | Desfazer Link
- Timestamp de mensagens

---

**SkinsPage** (`/skins`)

**Sistema de Desbloqueio:**
- Skins desbloqueadas por conquistas:
  - 5 matches em categoria X → Skin temática X
  - 15 matches total → Skin especial
  - 50 matches total → Skin premium
  
**Skins Disponíveis:**
- Aurora Boreal, Brasas, Neve, Sunset, Oceano, Floresta, Cyberpunk, Windows XP, Lava, Mint, Rose Gold

**UI:**
- Grid de cards
- Preview antes de aplicar
- Indicador de progresso para desbloqueio
- Status: Bloqueada | Desbloqueada | Ativa

### Admin

**AdminUsersPage** (`/admin/users`)
- Gerenciar usuários (requer `isAdmin: true`)
- Ver/editar perfis
- Responder tickets de feedback

---

## 🎴 SISTEMA DE CARTAS

### Categorias de Cartas

1. **Sensorial** 🫦
   - Experiências táteis, gustativas, olfativas
   - Exemplos: massagens, vendas nos olhos, alimentos

2. **Poder** ⚡
   - Dinâmicas de dominação/submissão
   - Exemplos: comandos, roleplay, controle

3. **Fantasia** 🎭
   - Cenários e personagens imaginários
   - Exemplos: roleplay específico, fantasias elaboradas

4. **Exposição** 👁️
   - Voyeurismo, exibicionismo, locais públicos
   - Exemplos: roupas específicas, fotos, locais arriscados

5. **Conexão** 💬 **(ESPECIAL)**
   - Diálogo, intimidade emocional, pequenos gestos
   - **NÃO gera match**
   - Sempre disponível (ignora filtro de intensidade)
   - Trigger: 10 likes iniciais, depois a cada 5 matches
   - Exemplos: perguntas profundas, desafios de carinho

### Tipos de Cartas

**Cartas do Sistema** (`cards` collection)
- ~200+ cartas pré-definidas
- Intensidade 1-5 (exceto Conexão)
- Conteúdo revisado e validado

**Cartas de Usuário** (`userCards` collection)
- Criadas pelo próprio casal
- Privadas (vinculadas ao `coupleId`)
- Categoria customizável (exceto Conexão)
- Intensidade customizável
- Criador automaticamente "curte" a carta
- Aparecem na fila do parceiro com prioridade

---

## 🔄 FLUXOS PRINCIPAIS

### 1. Onboarding Completo

```
1. Usuário entra em kinklink.app
2. HomePage → Clica "Cadastre-se"
3. SignupPage → Preenche dados (email, senha, username, nascimento, gênero)
4. Validações (idade 18+, campos obrigatórios)
5. Cria conta no Firebase Auth + doc em users
6. Redirect → ProfilePage (preencher bio, ajustar maxIntensity)
7. Redirect → LinkCouplePage
8. User A: "Criar Vínculo" → gera código (ex: 123456)
   - Cria doc em pendingLinks (status: pending)
   - Cria doc em couples (status: pending, members: [userA])
9. User A compartilha código manualmente com User B
10. User B: "Aceitar Vínculo" → insere 123456
11. Sistema valida (código existe, não expirado, usuários não vinculados)
12. Transação:
    - Atualiza couple (status: completed, members: [userA, userB])
    - Atualiza users de A e B (coupleId)
    - Atribui símbolos aleatórios (▲ Triângulo / ⭐ Estrela)
    - Deleta pendingLink
13. Modal de boas-vindas + matches iniciais (se houver)
14. Redirect → CardPilePage
15. Tutorial modal (primeira vez)
16. Usuários começam a swipar!
```

### 2. Ciclo de Swipe & Match

```
1. CardPilePage carrega cartas:
   a. Likes do parceiro (2/3 da fila)
      - Query: couples/{coupleId}/likedInteractions
      - Filtro: likedByUIDs contém partnerId, user não viu
   b. Cartas gerais (1/3 da fila)
      - Query: cards + userCards
      - Filtro: não em seenCards, intensity <= maxIntensity
      - Conexão sempre incluída
   c. Pool de Conexão separado (trigger periódico)

2. User swipa carta:
   CASO A: 👎 Não Topo!
   - Adiciona cardId a user.seenCards
   - Próxima carta aparece
   - Desfazer disponível (1x)
   
   CASO B: 👍 Topo!
   - Grava em couples/{coupleId}/likedInteractions/{cardId}:
     * likedByUIDs: [userId]
     * isMatch: false
     * cardData: {snapshot da carta}
     * createdAt, lastActivity
   - Verifica se parceiro já curtiu
   
3. Verificação de Match:
   IF likedInteractions/{cardId} JÁ EXISTE:
     - Verifica se partnerId está em likedByUIDs
     - SE SIM:
       * Atualiza isMatch: true
       * likedByUIDs: [userA, userB]
       * Modal de "Novo Link!" aparece
       * Carta some da fila de ambos
     - SE NÃO:
       * Carta continua na fila do parceiro
   
4. MatchModal fecha → useCardPileLogic detecta → próxima carta

5. Carta com match vai para MatchesPage de ambos
   - Listener em likedInteractions onde isMatch=true
   - Real-time sync via onSnapshot
```

### 3. Sistema de Chat

```
1. MatchesPage → User clica em carta
2. CardChatModal abre
3. useCardChat hook:
   a. Listener em couples/{coupleId}/cardChats/{cardId}/messages
   b. Carrega histórico completo
   c. Ordena por timestamp
   
4. User digita mensagem + emoji (opcional)
5. Clica "Enviar"
6. Salva em messages/{msgId}:
   - userId, username, text, timestamp
7. Atualiza doc pai cardChats/{cardId}:
   - lastMessageTimestamp
   - lastMessageSenderId
   - lastMessageTextSnippet (primeiros 50 chars)
   
8. Listener do parceiro detecta:
   - Nova mensagem aparece em tempo real
   - Atualiza snippet na lista de matches
   - Marca como "não lida" (via localStorage)
   
9. Quando parceiro abre chat:
   - Salva timestamp no localStorage
   - Remove badge "não lida"
```

### 4. Modal de Conexão (Periódico)

```
1. useCardPileLogic rastreia:
   - conexaoAccepted (contador em user doc)
   - conexaoRejected (contador em user doc)
   
2. Trigger inicial: 10 likes totais (aceitos + rejeitados)
3. Triggers seguintes: A cada 5 matches formados

4. Quando trigger dispara:
   - showConexaoModal: true
   - Carrega cartas de categoria "conexao" não vistas
   - Pool separado do swipe normal
   
5. Modal mostra carta de Conexão:
   - User pode aceitar (💚) ou rejeitar (🖤)
   - Não gera match
   - Não vai para MatchesPage
   
6. User decide:
   ACEITAR:
   - Incrementa user.conexaoAccepted
   - Adiciona a cartas vistas em localStorage (checklist)
   - Aparece em "Carinhos & Mimos"
   
   REJEITAR:
   - Incrementa user.conexaoRejected
   - Carta some do pool
   
7. Próximo trigger calculado automaticamente
```

### 5. Sistema de Favoritos (🔥 Hot)

```
1. MatchesPage → User clica no botão 🔥 de uma carta

2. toggleHotStatus(cardId):
   a. Busca doc: couples/{coupleId}/likedInteractions/{cardId}
   b. Valida: isMatch deve ser true
   c. Toggle: isHot = !currentIsHot
   d. Atualiza lastActivity
   
3. Listener onSnapshot detecta mudança:
   - Lista de matches reordena em tempo real
   - Carta move entre seções:
     * isHot=true → 🔥 Top Links
     * isHot=false → Outros Links (categoria)
   
4. UI atualiza instantaneamente (optimistic update)

REGRAS ESPECIAIS:
- Marcar como Realizada → isHot: false automaticamente
- Repetir Carta → isHot: true automaticamente
- Cartas Realizadas não podem ser favoritadas
```

---

## 🔐 SEGURANÇA (Firestore Rules)

### Usuários (`users`)

```javascript
// Leitura: Qualquer autenticado (necessário para aceitar link)
allow get: if request.auth != null;
allow list: if request.auth != null;

// Criação: Apenas próprio usuário, isAdmin deve ser false
allow create: if request.auth.uid == userId && 
                 request.resource.data.isAdmin == false;

// Atualização:
// 1. Próprio usuário (não pode mudar isAdmin)
allow update: if request.auth.uid == userId &&
                 (!('isAdmin' in request.resource.data) || 
                  request.resource.data.isAdmin == resource.data.isAdmin);

// 2. Admin pode atualizar isSupporter, feedbackTickets de outros
allow update: if isUserAdmin() && 
                 userId != request.auth.uid;
```

### Casais (`couples`)

```javascript
// Criação: User autenticado, status=pending
allow create: if request.auth != null &&
                 request.resource.data.status == 'pending' &&
                 request.resource.data.initiatorId == request.auth.uid;

// Atualização: User é membro
allow update: if request.auth.uid in request.resource.data.members;

// Leitura:
// - Pending: Qualquer autenticado (para aceitar)
// - Completed: Apenas membros
allow get: if request.auth != null && 
              (resource.data.status == 'pending' || 
               userHasCoupleId());
```

### Interações (`likedInteractions`)

```javascript
// Criação: Primeiro like
allow create: if userHasCoupleId() &&
                 request.resource.data.likedByUIDs.size() == 1 &&
                 request.resource.data.likedByUIDs[0] == request.auth.uid &&
                 request.resource.data.isMatch == false;

// Atualização: 3 casos permitidos
// 1. Segundo like formando match
allow update: if userHasCoupleId() &&
                 resource.data.likedByUIDs.size() == 1 &&
                 request.resource.data.likedByUIDs.size() == 2 &&
                 request.resource.data.isMatch == true;

// 2. Toggle isHot em match existente
allow update: if userHasCoupleId() &&
                 resource.data.isMatch == true &&
                 request.resource.data.diff(resource.data)
                   .affectedKeys().hasOnly(['isHot', 'lastActivity']);

// 3. Toggle isCompleted (+ reset isHot)
allow update: if userHasCoupleId() &&
                 resource.data.isMatch == true &&
                 request.resource.data.diff(resource.data)
                   .affectedKeys().hasOnly(['isCompleted', 'isHot', 'lastActivity']);
```

---

## 🪝 HOOKS CUSTOMIZADOS

### **useAuth** (AuthContext)
**Responsabilidade:** Gerencia autenticação e estado do usuário

**Estado:**
- `user: User | null` - Dados do usuário autenticado
- `userSymbol: string | null` - Símbolo do casal (🔥/❄️)
- `isAuthenticated: boolean`
- `isLoading: boolean`
- `newlyUnlockedSkinsForModal: SkinDefinition[] | null`

**Funções:**
- `login(email, password)` - Login com email/senha
- `loginWithGoogle()` - Login com Google
- `logout()` - Sair
- `signup(email, password, username, birthDate, gender)` - Cadastro
- `updateUser(data)` - Atualizar perfil
- `resetUserTestData()` - Limpar dados de teste
- `unlinkCouple()` - Desvincular casal
- `checkAndUnlockSkins(allSkins)` - Verificar desbloqueio de skins
- `submitUserFeedback(text)` - Enviar feedback
- `deleteUserFeedbackTicket(id)` - Deletar ticket
- `resetNonMatchedSeenCards()` - Resetar cartas "Não Topo!"
- `refreshAuthContext()` - Forçar reload do user doc

**Listener:**
- Escuta mudanças no doc `users/{userId}` via onSnapshot
- Atualiza estado automaticamente

---

### **useUserCardInteractions**
**Responsabilidade:** Gerencia matches e interações com cartas

**Estado:**
- `matchedCards: MatchedCard[]` - Lista de matches (isMatch: true)
- `seenCards: string[]` - IDs de cartas já vistas

**Funções:**
- `handleLike(cardId, cardData)` - Curtir carta
- `handleDislike(cardId)` - Rejeitar carta
- `toggleHotStatus(cardId)` - Toggle favorito
- `toggleCompletedStatus(cardId, completed)` - Marcar como realizada
- `repeatCard(cardId)` - Repetir carta (isHot=true, isCompleted=false)
- `handleCreateUserCard(text, category, intensity)` - Criar carta customizada
- `deleteMatch(cardId)` - Remover match (desfazer link)

**Listeners:**
- `couples/{coupleId}/likedInteractions` (onde isMatch=true)
- Atualiza `matchedCards` em tempo real

---

### **useCardPileLogic** ⭐ **NÚCLEO**
**Responsabilidade:** Gerencia fila de cartas e lógica de swipe

**Estado:**
- `currentCard: Card | null` - Carta atual
- `unseenCardsCount: number` - Contador de cartas não vistas
- `showMatchModal: boolean` - Exibir modal de match
- `currentMatchCard: Card | null` - Carta que deu match
- `showConexaoModal: boolean` - Exibir modal de conexão
- `currentConexaoCardForModal: Card | null`
- `allConexaoCards: Card[]` - Pool de cartas de conexão
- `canUndoDislike: boolean` - Pode desfazer último dislike

**Funções:**
- `handleInteraction(direction)` - Processa swipe (left/right)
- `selectNextCard()` - Seleciona próxima carta (prioriza likes do parceiro)
- `undoLastDislike()` - Desfaz último "Não Topo!" (Oops!)
- `handleConexaoInteractionInModal(accepted)` - Aceita/rejeita conexão

**Lógica de Prioridade:**
```javascript
// A cada selectNextCard():
random = Math.random()
IF random < 0.67: // 2/3 de chance
  → Carta da fila de likes do parceiro
ELSE: // 1/3 de chance
  → Carta aleatória do pool geral
```

**Trigger de Conexão:**
```javascript
totalConexaoInteractions = conexaoAccepted + conexaoRejected

IF !initialConexaoTriggered && totalConexaoInteractions >= 10:
  → showConexaoModal = true
  → initialConexaoTriggered = true

ELSE IF initialConexaoTriggered && newMatchesCount % 5 == 0:
  → showConexaoModal = true
```

---

### **useCoupleCardChats**
**Responsabilidade:** Agrega dados de chats de todas as cartas

**Estado:**
- `cardChatsData: Record<cardId, ChatInfo>` - Dados de última mensagem
- `isLoading: boolean`
- `error: string | null`

**Estrutura ChatInfo:**
```typescript
{
  lastMessageTimestamp: Timestamp,
  lastMessageSenderId: string,
  lastMessageTextSnippet: string
}
```

**Listener:**
- `couples/{coupleId}/cardChats` (todos os docs)
- Usado para exibir snippets no MatchesPage

---

### **useCardChat**
**Responsabilidade:** Chat individual de uma carta

**Estado:**
- `messages: Message[]` - Histórico completo
- `isLoading: boolean`

**Funções:**
- `sendMessage(text)` - Envia mensagem
  1. Cria doc em `messages/{msgId}`
  2. Atualiza `lastMessageTimestamp` no doc pai

**Listener:**
- `couples/{coupleId}/cardChats/{cardId}/messages`
- Ordena por timestamp crescente

---

### **useLinkCompletionListener**
**Responsabilidade:** Detecta aceite de link e mostra modal de boas-vindas

**Fluxo:**
```
1. Escuta mudanças no doc couples/{coupleId}
2. Detecta status: 'pending' → 'completed'
3. Busca cartas que deram match durante o aceite:
   - Query likedInteractions onde isMatch=true
   - Filtra por createdAt recente
4. Abre modal com lista de matches iniciais
5. Mostra mensagem de boas-vindas
```

---

### **useCardPileModals**
**Responsabilidade:** Gerencia modais da CardPilePage

**Modais:**
- CreateUserCardModal
- MatchModal
- ConexaoCardModal
- CarinhosMimosModal
- PeekInvitation

**Estado:**
- `isCreateModalOpen`
- `isCarinhosMimosOpen`
- ...

---

### **useCardTips**
**Responsabilidade:** Sistema de dicas contextuais

**Dicas por Categoria:**
- Sensorial: "Explore os sentidos..."
- Poder: "Estabeleça limites claros..."
- Fantasia: "Use a imaginação..."
- Exposição: "Respeite o conforto..."
- Conexão: "Comunicação é chave..."

**Exibição:**
- Sidebar na CardPilePage
- Rotação aleatória
- Específicas para categoria da carta atual

---

## 🎨 SISTEMA DE SKINS

### Estrutura de Skin

```typescript
interface SkinDefinition {
  id: string;
  name: string;
  description: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    cardFront: string;
    cardBack: string;
  };
  unlockRequirements: {
    matchesInCategories?: { [category: string]: number };
    totalMatches?: number;
  };
  isDefault?: boolean;
}
```

### Skins Disponíveis

**Default:** Padrão (sempre desbloqueada)

**Por Categoria (5 matches):**
- Sensorial: "Veludo Rosa"
- Poder: "Brasas"
- Fantasia: "Aurora Boreal"
- Exposição: "Sunset"

**Por Total de Matches:**
- 15 matches: "Oceano Profundo"
- 20 matches: "Floresta Encantada"
- 50 matches: "Rose Gold Premium"

**Especiais:**
- Cyberpunk, Windows XP, Lava, Mint, Neve

### Aplicação de Skin

```javascript
// Ao selecionar skin:
1. Atualiza user.activeSkinId no Firestore
2. SkinContext.applySkin(skinId)
3. CSS variables são atualizadas:
   --kl-primary: palette.primary
   --kl-secondary: palette.secondary
   --kl-accent: palette.accent
   --kl-bg: palette.background
   ...
4. Todos os componentes herdam via CSS
5. Transição suave (CSS transition)
```

---

## 🔔 SISTEMA DE NOTIFICAÇÕES

### Push Notifications (FCM)

**Eventos que Disparam:**
1. Novo match formado
2. Parceiro enviou mensagem no chat
3. Parceiro criou carta customizada
4. Lembretes semanais (opcional)

**Fluxo:**
```
1. Frontend solicita permissão de notificações
2. Obtém FCM token
3. Salva em users/{userId}/fcmTokens/{token}
4. Cloud Function detecta evento:
   - onWrite em likedInteractions (match)
   - onWrite em cardChats (mensagem)
5. Function busca FCM tokens do parceiro
6. Envia notificação via Firebase Admin SDK
7. Usuário recebe notificação no dispositivo
```

**Estrutura da Notificação:**
```json
{
  "notification": {
    "title": "Novo Link! 🔥",
    "body": "Você e seu parceiro formaram um novo Link!",
    "icon": "/kinklogo512.png"
  },
  "data": {
    "cardId": "c123",
    "type": "match",
    "clickAction": "/matches"
  }
}
```

### In-App Notifications

**Visuais:**
- Badge "Novo!" em matches recentes
- Bolinha vermelha em cartas com mensagens não lidas
- Snippet de última mensagem
- Contador de cartas não vistas

**Toasts:**
- Sucesso: "Link formado! 🎉"
- Erro: "Algo deu errado..."
- Info: "Carta adicionada à fila do parceiro"

---

## 📊 MÉTRICAS & ANALYTICS

### Logs no Console

**Formato Padrão:**
```
[ComponentName] Descrição da ação: dados relevantes
```

**Exemplos:**
```javascript
console.log('[useCardPileLogic] Cartas carregadas:', {
  normais: normalCards.length,
  conexao: conexaoCards.length,
  partnerLikes: partnerLikes.length
});

console.log('[SubcollectionListener] Match detectado!', {
  cardId: 'c123',
  coupleId: 'couple_xyz'
});

console.error('[AuthContext] Erro ao atualizar perfil:', error);
```

### Dados Rastreáveis

**Por Usuário:**
- Total de likes/dislikes
- Matches por categoria
- Cartas completadas
- Conexões aceitas/rejeitadas
- Skins desbloqueadas
- Tempo desde último login

**Por Casal:**
- Total de matches
- Matches ativos vs completados
- Taxa de conversação (mensagens por match)
- Categorias mais populares
- Frequência de uso

**Sistema:**
- Total de usuários ativos
- Casais vinculados
- Taxa de retenção
- Cartas mais curtidas
- Skins mais usadas

---

## 🐛 PROBLEMAS CONHECIDOS & SOLUÇÕES

### 1. Partner Likes Queue Vazia
**Causa:** `user.partnerId` foi removido na v4.0, código ainda referenciava

**Sintoma:**
```
[useCardPileLogic] Partner likes: 0
```

**Solução:**
```typescript
// ANTES
const partnerId = user.partnerId; // ❌ undefined

// DEPOIS
const coupleDoc = await getDoc(doc(db, 'couples', user.coupleId));
const partnerId = coupleDoc.data().members.find(id => id !== user.id); // ✅
```

---

### 2. Custom Cards Não Aparecem em Real-Time
**Causa:** Usando `getDocs` (one-time read) ao invés de `onSnapshot`

**Sintoma:**
- Carta criada mas não aparece na fila
- Necessário reload manual

**Solução:**
```typescript
// ANTES
const userCardsSnapshot = await getDocs(query(...)); // ❌

// DEPOIS
onSnapshot(query(...), (snapshot) => { // ✅
  const userCards = snapshot.docs.map(...);
  // Atualiza estado automaticamente
});
```

---

### 3. Connection Cards Não Carregam
**Causa:** Filtro de intensidade bloqueava cartas de conexão

**Sintoma:**
```
[useCardPileLogic] unseenConexao: 0
```

**Solução:**
```typescript
const allCards = snapshot.docs
  .map(d => ({ id: d.id, ...d.data() } as Card))
  .filter(card => {
    if (card.category === 'conexao') return true; // ✅ SEMPRE INCLUIR
    return (card.intensity ?? 0) <= maxIntensity;
  });
```

---

### 4. Firestore Compound Query Index Error
**Causa:** Query com múltiplos `where` requer índice composto

**Sintoma:**
```
FirebaseError: The query requires an index.
```

**Solução:**
```typescript
// ANTES
const query = query(
  collection(db, 'cards'),
  where('category', '!=', 'conexao'), // ❌
  where('intensity', '<=', maxIntensity)
);

// DEPOIS
const allCardsQuery = query(collection(db, 'cards')); // ✅
const filtered = snapshot.docs.filter(card => /* JS filter */);
```

---

### 5. Toggle Hot Não Atualiza UI
**Causa:** Listener ignorava mudanças locais (`hasPendingWrites`)

**Sintoma:**
- Clica no 🔥, nada acontece
- Logs: `[SubcollectionListener] Ignorando snapshot composto apenas por writes locais`

**Solução:**
```typescript
// ANTES
const allLocalWrites = docChanges.every(ch => ch.doc.metadata.hasPendingWrites);
if (allLocalWrites) return; // ❌ Ignora update próprio

// DEPOIS
// Removido filtro - aceita todas as mudanças // ✅
// Firestore sincroniza depois
```

---

### 6. Permission Error no Cleanup do MatchesPage
**Causa:** `updateDoc` no cleanup do useEffect rodava 2x no Strict Mode

**Sintoma:**
```
FirebaseError: Missing or insufficient permissions
Promise.catch @ MatchesPage.tsx:98
```

**Solução:**
```typescript
// ANTES
return () => {
  updateDoc(userDocRef, { // ❌ Roda no unmount (2x no dev)
    lastVisitedMatchesPage: serverTimestamp()
  });
};

// DEPOIS
useEffect(() => {
  updateDoc(userDocRef, { // ✅ Roda no mount (1x)
    lastVisitedMatchesPage: serverTimestamp()
  });
}, [user?.id]);
```

---

## 🚀 FEATURES FUTURAS

### Curto Prazo (Próximas 2-4 semanas)

- [ ] **Script de Recuperação de Matches**
  - Restaurar matches perdidos durante bug do partnerId
  - Query em `likedInteractions` para detectar matches órfãos

- [ ] **Resolver React Hook Warnings**
  - `initialConexaoTriggered` faltando em deps
  - `getCardNotificationStatus` precisa de `useCallback`
  - `user` object vs `user?.id` em arrays

- [ ] **Melhorias de UX**
  - Skeleton loaders ao invés de "Carregando..."
  - Animações mais suaves nos carrosséis
  - Feedback háptico no mobile (PWA)

- [ ] **Otimizações de Performance**
  - Lazy loading de imagens
  - Virtualização de listas longas
  - Service Worker para cache agressivo

### Médio Prazo (1-3 meses)

- [ ] **Post-its no Chat**
  - Notas rápidas fixadas no topo
  - Cores diferentes por parceiro
  - Limit de 3 post-its por carta

- [ ] **Álbum de Fotos Compartilhado**
  - Firebase Storage para uploads
  - Galeria por match
  - Comentários em fotos

- [ ] **Sistema de Conquistas Expandido**
  - Badges visuais
  - Títulos desbloqueáveis
  - Histórico de conquistas

- [ ] **Dashboard de Estatísticas**
  - Gráficos de categorias favoritas
  - Heatmap de atividade
  - Comparação com outros casais (anônimo)

### Longo Prazo (3-6 meses)

- [ ] **Sala de Convidados (Modo Grupo)**
  - Casais convidam amigos
  - "Mesa de poker" com cartas aprovadas
  - Sistema de lobby/convite

- [ ] **Modo Privado**
  - Esconder cartas sensíveis em público
  - PIN de segurança
  - Timeout automático

- [ ] **Internacionalização (i18n)**
  - Inglês, Espanhol
  - Sistema de votação para novos idiomas

- [ ] **App Nativo (Capacitor)**
  - iOS + Android
  - Push notifications nativas
  - Integração com calendário

---

## 🧪 ESTRATÉGIA DE TESTES

### Testes Manuais (Prioridade MVP)

**Checklist de Onboarding:**
- [ ] Cadastro com email/senha
- [ ] Cadastro com Google
- [ ] Validação de idade (18+)
- [ ] Validação de campos obrigatórios
- [ ] Login com credenciais corretas
- [ ] Login com credenciais incorretas
- [ ] Esqueci a senha (reset email)

**Checklist de Vinculação:**
- [ ] Criar código de vínculo
- [ ] Código exibido corretamente
- [ ] Aceitar código válido
- [ ] Rejeitar código inválido
- [ ] Rejeitar código expirado
- [ ] Dois usuários já vinculados não podem revincular
- [ ] Símbolos (🔥/❄️) atribuídos corretamente

**Checklist de Swipe:**
- [ ] Cartas carregam corretamente
- [ ] Swipe left funciona
- [ ] Swipe right funciona
- [ ] Botões Topo/Passo funcionam
- [ ] Animações fluidas
- [ ] Match detectado corretamente
- [ ] Modal de match aparece
- [ ] Carta some após match

**Checklist de Conexão:**
- [ ] Modal aparece após 10 likes
- [ ] Modal aparece a cada 5 matches
- [ ] Aceitar incrementa contador
- [ ] Rejeitar incrementa contador
- [ ] Cartas vão para "Carinhos & Mimos"
- [ ] Não gera match

**Checklist de Matches:**
- [ ] Lista carrega corretamente
- [ ] Favoritar funciona (🔥)
- [ ] Cartas movem entre seções
- [ ] Chat abre ao clicar
- [ ] Mensagens salvam/carregam
- [ ] Marcar como realizada funciona
- [ ] Desfazer link funciona

### Testes Automatizados (Futuro)

**Unitários (Jest):**
- Validações de formulário
- Funções de data/hora
- Helpers de formatação
- Lógica de prioridade de cartas

**Integração (React Testing Library + Firebase Emulators):**
- Fluxo de signup
- Criação de vínculo
- Detecção de match
- Salvar mensagem no chat

**E2E (Playwright - Pós-MVP):**
- Jornada completa do usuário
- Dois navegadores simulando casal
- Testes de regressão automatizados

---

## 📝 CONVENÇÕES DE CÓDIGO

### Nomenclatura

**Componentes:** PascalCase
```typescript
// ✅ Bom
function CardPilePage() {}
function MatchModal() {}

// ❌ Evitar
function cardPilePage() {}
function matchmodal() {}
```

**Hooks:** camelCase com prefixo `use`
```typescript
// ✅ Bom
function useCardPileLogic() {}
function useAuth() {}

// ❌ Evitar
function CardPileLogic() {}
function authHook() {}
```

**Funções:** camelCase
```typescript
// ✅ Bom
const handleInteraction = () => {}
const fetchUserData = async () => {}

// ❌ Evitar
const HandleInteraction = () => {}
const FetchUserData = async () => {}
```

**Constantes:** SCREAMING_SNAKE_CASE
```typescript
// ✅ Bom
const MAX_INTENSITY = 5;
const DEFAULT_SKIN_ID = 'default';

// ❌ Evitar
const maxIntensity = 5;
const defaultSkinId = 'default';
```

### Estrutura de Arquivos

**Limite sugerido:** ~250 linhas por arquivo
- Encoraja refatoração
- Mantém responsabilidades claras
- Facilita code review

**Exceções aceitáveis:**
- AuthContext (~700 linhas - contexto central)
- useCardPileLogic (~400 linhas - lógica complexa)

### Imports

**Ordem:**
1. React/bibliotecas externas
2. Firebase
3. Contextos
4. Hooks customizados
5. Componentes
6. Tipos
7. Estilos
8. Assets

```typescript
// ✅ Bom
import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useCardPileLogic } from '../hooks/useCardPileLogic';
import PlayingCard from '../components/PlayingCard';
import type { Card } from '../data/cards';
import styles from './CardPilePage.module.css';
import logo from '../assets/logo.png';
```

### Comentários

**Logs de Debug:**
```typescript
// ✅ Bom
console.log('[useCardPileLogic] Match detectado!', { cardId, coupleId });
console.error('[AuthContext] Erro ao atualizar:', error);

// ❌ Evitar
console.log('match'); // Vago
console.log(error); // Sem contexto
```

**TODOs:**
```typescript
// ✅ Bom
// TODO: Implementar cache de cartas (Issue #42)
// FIXME: Animação trava em iOS Safari
// HACK: Workaround temporário, resolver com nova API do Firebase

// ❌ Evitar
// TODO: melhorar isso
// arrumar depois
```

---

## 🎓 CONCEITOS-CHAVE (Glossário)

**Link:** Match entre o casal - ambos curtiram a mesma carta

**Top Link:** Carta favoritada com 🔥 (isHot: true)

**Topo!:** Botão/ação de curtir uma carta (like)

**Não Topo!:** Botão/ação de rejeitar uma carta (dislike)

**Passo:** Alternativa para "Não Topo!" (mesmo resultado)

**Oops!:** Desfazer último "Não Topo!" - volta a última carta descartada

**Conexão:** Categoria especial de cartas focadas em diálogo/intimidade emocional

**Carinhos & Mimos:** Lista de cartas de Conexão aceitas pelo usuário

**Intensidade:** Escala 1-5 do quão explícito/intenso é o conteúdo da carta

**maxIntensity:** Filtro configurável pelo usuário (ex: maxIntensity=3 = apenas cartas 1, 2, 3)

**Símbolo:** ▲ Triângulo ou ⭐ Estrela atribuído aleatoriamente a cada membro do casal

**Skin:** Tema visual customizável (cores, estilos)

**Ticket:** Feedback enviado pelo usuário para o admin

**Supporter:** Usuário que apoia financeiramente (isSupporter: true)

**Admin:** Usuário com permissões elevadas (isAdmin: true)

**seenCards:** Array de IDs de cartas já vistas pelo usuário

**coupleId:** ID único do documento do casal em `couples`

**linkCode:** Código de 6 dígitos para vinculação

**likedInteractions:** Subcoleção em `couples` que armazena likes e matches

**isMatch:** Flag que indica se ambos curtiram (true = Link formado)

**isHot:** Flag que indica se carta está favoritada

**isCompleted:** Flag que indica se carta foi marcada como realizada

**PWA:** Progressive Web App - funciona offline, instalável

**FCM:** Firebase Cloud Messaging - sistema de push notifications

**onSnapshot:** Listener do Firestore para mudanças em tempo real

---

## 🗂️ ESTRUTURA DE PASTAS

```
KinkLink/
├── public/
│   ├── icons/              # PWA icons
│   ├── locales/            # Traduções (i18n)
│   ├── assets/skins/       # Imagens de skins
│   ├── manifest.json       # PWA manifest
│   └── firebase-messaging-sw.js
│
├── src/
│   ├── assets/             # Imagens, logos
│   │
│   ├── components/         # Componentes reutilizáveis
│   │   ├── Layout/         # Header, Footer
│   │   ├── modals/         # Modais diversos
│   │   ├── PlayingCard.tsx
│   │   ├── MatchCardItem.tsx
│   │   ├── CategoryCarousel.tsx
│   │   └── ...
│   │
│   ├── contexts/           # Contextos React
│   │   ├── AuthContext.tsx
│   │   ├── SkinContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── hooks/              # Hooks customizados
│   │   ├── useAuth.ts (re-exportado de AuthContext)
│   │   ├── useUserCardInteractions.ts
│   │   ├── useCardPileLogic.ts ⭐
│   │   ├── useCardChat.ts
│   │   ├── useCoupleCardChats.ts
│   │   ├── useLinkCompletionListener.ts
│   │   └── ...
│   │
│   ├── pages/              # Páginas (rotas)
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── LinkCouplePage.tsx
│   │   ├── CardPilePage.tsx ⭐
│   │   ├── MatchesPage.tsx
│   │   ├── SkinsPage.tsx
│   │   └── ...
│   │
│   ├── config/             # Configurações
│   │   └── skins/          # Definições de skins
│   │       ├── index.ts
│   │       └── styles/     # CSS de skins
│   │
│   ├── data/               # Dados estáticos
│   │   └── cards.ts        # Definições de cartas (backup)
│   │
│   ├── utils/              # Funções utilitárias
│   │   ├── chatNotificationStore.ts
│   │   └── ...
│   │
│   ├── services/           # Lógica de negócio
│   │   └── (futuro)
│   │
│   ├── App.tsx             # Componente raiz + rotas
│   ├── main.tsx            # Entry point
│   ├── firebase.ts         # Configuração Firebase
│   └── index.css           # Estilos globais
│
├── functions/              # Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   └── notificacaoMensal.ts
│   └── package.json
│
├── docs/                   # Documentação
│   ├── architecture/
│   └── user-guide/
│
├── firestore.rules         # Regras de segurança
├── firebase.json           # Config Firebase
├── package.json
├── vite.config.ts
└── PROJECT_CONTEXT.md      # Este arquivo! 📄
```

---

## 🛠️ FERRAMENTAS DE DESENVOLVIMENTO

### Card Creator (Tool Local)

**Propósito:** Ferramenta auxiliar para gerar JSON de cartas pré-definidas

**Localização:** `/CardCreator/index.html`

**Features:**
- Interface visual para criar cartas
- Seleção de categoria com preview
- Input de texto e intensidade
- Geração de JSON formatado
- Listagem por categoria

**Uso:**
1. Abrir `index.html` no navegador
2. Criar cartas usando a interface
3. Clicar em "Gerar JSON"
4. Copiar JSON gerado
5. Usar para popular Firestore

**Limitações:**
- Ferramenta offline (sem conexão com Firestore)
- Não persiste entre sessões
- Não permite editar cartas existentes
- Focada em criação em lote

**Status:** Finalizada (usada para criar lote inicial de 200+ cartas)

---

## 📈 HISTÓRICO DE VERSÕES

### v4.0 (Atual) - Novembro 2025
- ✅ Remoção de `partnerId` redundante (derivado de `couple.members`)
- ✅ Real-time listeners para custom cards
- ✅ Fix de compound query (Firestore index)
- ✅ Fix de toggle hot (remove filtro de localWrites)
- ✅ Modal de Conexão periódico
- ✅ Sistema "Oops!" (desfazer último dislike)
- ✅ Carinhos & Mimos
- ✅ Contador de cartas não vistas removido da UI
- ✅ Símbolos do casal: ▲ Triângulo e ⭐ Estrela

### v3.x - Outubro 2025
- ✅ Sistema de Skins com desbloqueio por conquistas
- ✅ Notificações Push (FCM)
- ✅ Chat por carta
- ✅ Marcar como realizada
- ✅ Favoritar/desfavoritar
- ✅ Cartas customizadas
- ✅ Modal de tutorial

### v2.x - Setembro 2025
- ✅ Detecção de matches
- ✅ MatchesPage com separação por categoria
- ✅ Sistema de likes prioritários
- ✅ Desvinculação de casais
- ✅ Perfil com maxIntensity

### v1.0 (MVP) - Agosto 2025
- ✅ Autenticação (Email/Senha, Google)
- ✅ Vinculação de casais (código de 6 dígitos)
- ✅ Swipe de cartas
- ✅ Cartas de Conexão
- ✅ Tema escuro/claro
- ✅ PWA básico

---

## 🤝 PRINCÍPIOS DE DESENVOLVIMENTO

### Modularidade
- **Meta:** Código organizado, reutilizável, fácil de manter
- **Práticas:**
  - Dividir UI em componentes pequenos e focados
  - Hooks customizados para lógica reutilizável
  - Context API para estado compartilhado
  - Constantes em arquivos dedicados
  - Estrutura de pastas clara

### Responsabilidade Única
- Cada componente/hook tem UMA responsabilidade
- Ex: `useCardPileLogic` = lógica de swipe
- Ex: `CardChatModal` = UI do chat

### DRY (Don't Repeat Yourself)
- Extrair lógica repetida para funções/hooks
- Centralizar configurações (Firebase, constantes)
- Reutilizar componentes visuais

### Clareza sobre Cleverness
- Código legível > Código "esperto"
- Comentários em lógica complexa
- Nomes descritivos para variáveis/funções

---

## 🎓 GUIA PARA NOVOS DESENVOLVEDORES

### Setup Inicial

1. **Clone o repositório:**
```bash
git clone https://github.com/ruishalm/kinklink.git
cd kinklink/KinkLink
```

2. **Instale dependências:**
```bash
npm install
```

3. **Configure Firebase:**
   - Crie arquivo `src/firebase.ts` com suas credenciais
   - Ou use variáveis de ambiente

4. **Rode em desenvolvimento:**
```bash
npm run dev
```

5. **Acesse:** `http://localhost:5173`

### Fluxo de Trabalho

1. **Criar branch:**
```bash
git checkout -b feature/nome-da-feature
```

2. **Desenvolver e testar:**
   - Fazer mudanças
   - Testar manualmente
   - Verificar console para erros

3. **Commit:**
```bash
git add .
git commit -m "feat: descrição da feature"
```

4. **Push:**
```bash
git push origin feature/nome-da-feature
```

5. **Pull Request:**
   - Criar PR no GitHub
   - Descrever mudanças
   - Aguardar review

### Convenções de Commit

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração de código
style: mudanças de estilo (CSS)
docs: atualização de documentação
test: adição/modificação de testes
chore: tarefas de manutenção
```

### Onde Começar

**Issues para Iniciantes:**
- Label: `good first issue`
- Pequenas melhorias de UI
- Correções de typos
- Melhorias de documentação

**Próximas Features:**
- Ver seção "FEATURES FUTURAS"
- Priorizar "Curto Prazo"

---

## 🆘 TROUBLESHOOTING

### Problema: "App não carrega / tela branca"

**Possíveis causas:**
1. Erro no Firebase (credenciais)
2. Erro de sintaxe em algum componente
3. Service Worker com cache antigo

**Soluções:**
```bash
# 1. Verificar console do navegador (F12)
# 2. Limpar cache:
npm run build
# 3. Desregistrar service worker:
# DevTools > Application > Service Workers > Unregister
```

---

### Problema: "Firebase: Missing or insufficient permissions"

**Causa:** Regras de segurança bloqueando acesso

**Solução:**
1. Verificar `firestore.rules`
2. Confirmar que usuário está autenticado
3. Confirmar que `coupleId` está setado
4. Checar se campo `isMatch` está correto

---

### Problema: "Matches não aparecem"

**Possíveis causas:**
1. Listener não configurado
2. `isMatch` não foi setado para `true`
3. User não tem `coupleId`

**Debug:**
```typescript
// No console do Firebase:
// 1. Verificar couples/{coupleId}/likedInteractions
// 2. Confirmar isMatch: true
// 3. Conferir user.coupleId

console.log('[Debug] User coupleId:', user?.coupleId);
console.log('[Debug] Matched cards:', matchedCards);
```

---

### Problema: "Cartas se repetem"

**Causa:** `seenCards` não está sendo atualizado

**Solução:**
```typescript
// Verificar se handleDislike/handleLike estão chamando:
await updateDoc(userDocRef, {
  seenCards: arrayUnion(cardId)
});
```

---

## 📞 CONTATO & SUPORTE

**Desenvolvedor Principal:** [Seu Nome]

**Email:** [seu-email@exemplo.com]

**GitHub:** https://github.com/ruishalm/kinklink

**Issues:** https://github.com/ruishalm/kinklink/issues

**Discord:** [Link do servidor Discord, se houver]

---

## 📜 LICENÇA

[Definir licença - MIT, GPL, etc.]

---

## 🙏 AGRADECIMENTOS

- Testadores beta
- Comunidade do Firebase
- React e Vite teams
- Usuários que enviaram feedback

---

**🎉 Última atualização: 26 de Novembro de 2025**

**Status do Projeto:** MVP Concluído | Refinamento Contínuo

**Próximos Milestones:**
1. Resolver warnings de React Hooks
2. Implementar script de recuperação de matches
3. Otimizações de performance
4. Features de médio prazo (Post-its, Fotos)

---

_Este documento é atualizado continuamente. Para sugerir melhorias, abra uma issue ou PR._
