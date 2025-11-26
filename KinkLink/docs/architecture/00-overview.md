# 📱 Visão Geral da Arquitetura do KinkLink

> **Versão:** 4.0 | **Última Atualização:** Novembro 2025

Este documento fornece uma visão geral da arquitetura técnica do aplicativo KinkLink, descrevendo seus principais componentes, tecnologias utilizadas e fluxos de dados.

## 1. Introdução

O KinkLink é um Progressive Web App (PWA) gamificado projetado para casais explorarem fetiches, fantasias e conexão emocional através de cartas interativas no estilo Tinder. A arquitetura foi pensada para ser escalável, real-time e privada, utilizando tecnologias modernas e serviços gerenciados do Firebase para garantir uma experiência fluida e segura.

### Conceitos-Chave
- **Links:** Matches entre o casal (ambos curtiram a mesma carta)
- **Símbolos:** ▲ Triângulo ou ⭐ Estrela atribuídos aleatoriamente
- **Conexão:** Cartas especiais de intimidade emocional (não geram matches)
- **Real-Time Sync:** Todos os dados sincronizam automaticamente via listeners

## 2. Pilha Tecnológica (Tech Stack)

O KinkLink é composto por um frontend (aplicativo cliente) e utiliza os serviços do Firebase como backend.

### 2.1. Frontend

| Tecnologia | Uso |
|------------|-----|
| **React 18** | Framework UI com TypeScript |
| **Vite** | Build tool e dev server |
| **React Router v6** | Navegação entre páginas |
| **CSS Modules** | Estilos com escopo local |
| **Context API** | State global (Auth, Skins, Notifications) |
| **@use-gesture/react** | Gestos de swipe nas cartas |
| **Swiper.js** | Carrosséis de categorias |
| **React-Spring** | Animações fluidas |
| **React-Hot-Toast** | Notificações in-app |

**Hooks Customizados Principais:**
- `useAuth` - Autenticação e dados do usuário
- `useUserCardInteractions` - Likes, dislikes e matches
- `useCardPileLogic` - Lógica da fila de cartas (CORE)
- `useCoupleCardChats` - Agregação de dados de chat
- `useCardChat` - Chat individual por carta
- `useLinkCompletionListener` - Detecta aceite de vínculo

### 2.2. Backend e Serviços (Firebase)

| Serviço | Uso |
|---------|-----|
| **Firebase Authentication** | Login (Email/Senha, Google), sessões |
| **Cloud Firestore** | Banco NoSQL principal, real-time sync |
| **Cloud Functions** | Notificações push, lógica server-side |
| **Firebase Cloud Messaging (FCM)** | Push notifications |
| **Firebase Hosting** | Deploy do PWA |
| **Firebase Storage** | (Futuro) Upload de fotos |

**Estrutura do Firestore:**

```
users/{userId}
  ├─ Perfil (email, username, bio, birthDate, gender)
  ├─ coupleId (referência ao casal)
  ├─ seenCards[] (cartas já vistas)
  ├─ maxIntensity (filtro 1-5)
  ├─ conexaoAccepted, conexaoRejected
  ├─ unlockedSkinIds[]
  └─ fcmTokens/{token} (subcoleção)

couples/{coupleId}
  ├─ members[] (2 userIds)
  ├─ memberSymbols {userId: '▲' ou '⭐'}
  ├─ status ('pending' | 'completed')
  ├─ likedInteractions/{cardId}
  │   ├─ likedByUIDs[] (1 ou 2)
  │   ├─ isMatch (true = Link formado)
  │   ├─ isHot (favoritado)
  │   ├─ isCompleted (realizado)
  │   └─ cardData (snapshot)
  └─ cardChats/{cardId}
      ├─ lastMessageTimestamp, lastMessageSenderId
      └─ messages/{msgId}

cards/{cardId}
  └─ text, category, intensity

userCards/{cardId}
  └─ coupleId, text, category, createdByUserId

pendingLinks/{linkCode}
  └─ initiatorUserId, status, createdAt
```

**Cloud Functions Ativas:**
- `notifyNewMatch` - Envia push quando forma Link
- `notifyNewMessage` - Envia push para novas mensagens
- `notifyPartnerCreatedCard` - Notifica carta customizada do parceiro

## 3. Estrutura de Pastas Principais do Frontend (`src/`)

A organização do código no frontend segue uma estrutura modular para facilitar a manutenção e o desenvolvimento:

*   `assets/`: Contém imagens, fontes e outros arquivos estáticos.
*   `components/`: Componentes React reutilizáveis que formam blocos de construção da UI (ex: `PlayingCard.tsx`, `CategoryCarousel.tsx`, `CardChatModal.tsx`).
*   `contexts/`: Definições dos Contextos React para gerenciamento de estado compartilhado (ex: `AuthContext.tsx`, `SkinContext.tsx`).
*   `hooks/`: Hooks customizados que encapsulam lógica de estado e efeitos colaterais (ex: `useUserCardInteractions.ts`, `useCoupleCardChats.ts`).
*   `pages/`: Componentes React que representam as diferentes telas/rotas principais da aplicação (ex: `CardPilePage.tsx`, `MatchesPage.tsx`, `ProfilePage.tsx`).
*   `services/`: Módulos com funções para interagir com os serviços do Firebase (ex: `firebaseAuth.ts`, `firestoreService.ts`).
*   `styles/`: Arquivos de CSS globais, variáveis CSS para temas (skins), e resets.
*   `utils/`: Funções utilitárias genéricas usadas em várias partes do aplicativo.
*   `App.tsx`: Componente raiz da aplicação, onde o roteamento principal é configurado.
*   `main.tsx`: Ponto de entrada da aplicação, onde o React é renderizado no DOM.

## 4. Principais Fluxos de Dados

### 4.1. Autenticação e Vinculação

```
User A                          Firebase                       User B
  │                               │                              │
  ├─ Signup/Login ──────────────> Authentication                │
  │                               │                              │
  ├─ "Criar Vínculo" ─────────> pendingLinks/{code}            │
  │                              couples/{id} (pending)          │
  │                               │                              │
  │                               │ <───────────── "Aceitar"  ───┤
  │                               │                              │
  │  <─── couple (completed) ────┤────── memberSymbols ───────> │
  │       ▲ Triângulo             │           ⭐ Estrela          │
```

### 4.2. Swipe e Detecção de Match

```
1. useCardPileLogic carrega cartas:
   ├─ 2/3 da fila: Likes do parceiro
   └─ 1/3 da fila: Cartas gerais (filtradas por intensity)

2. User swipa carta:
   ├─ 👎 Não Topo! → Adiciona a seenCards
   └─ 👍 Topo! → Grava em likedInteractions

3. Verificação de match:
   IF partnerId JÁ curtiu essa carta:
     ├─ Atualiza isMatch: true
     ├─ likedByUIDs: [userA, userB]
     ├─ Modal "Novo Link!" aparece
     └─ Cloud Function envia push para ambos

4. Carta vai para MatchesPage:
   └─ Listener onSnapshot detecta isMatch=true
```

### 4.3. Sistema de Chat Real-Time

```
User A                          Firestore                      User B
  │                               │                              │
  ├─ Digita mensagem ──────────> messages/{msgId}              │
  │                              ├─ userId, text, timestamp      │
  │                              └─ lastMessageTimestamp ────> listener
  │                               │                              │
  │                               │ <──────── onSnapshot ────────┤
  │                               │                              │
  │                               │ ──── Cloud Function ───────> Push!
```

### 4.4. Sistema de Skins por Conquistas

```
1. User forma matches → checkAndUnlockSkins()
2. Verifica conquistas:
   ├─ 5 matches Sensorial → Skin "Veludo Rosa"
   ├─ 15 matches total → Skin "Oceano"
   └─ 50 matches total → Skin "Rose Gold"
3. Atualiza user.unlockedSkinIds[]
4. Modal mostra skins desbloqueadas
5. User ativa skin → SkinContext.applySkin()
6. CSS variables atualizam → UI reflete nova skin
```

### 4.5. Modal de Conexão (Periódico)

```
1. useCardPileLogic rastreia:
   └─ conexaoAccepted + conexaoRejected

2. Triggers:
   ├─ Inicial: 10 likes totais
   └─ Seguintes: A cada 5 matches

3. Modal mostra carta de Conexão:
   ├─ User aceita → conexaoAccepted++
   │                 └─ Vai para "Carinhos & Mimos"
   └─ User rejeita → conexaoRejected++

4. NÃO gera match (categoria especial)
```

## 5. Arquitetura v4.0 - Mudanças Principais

### Remoção de `partnerId`
**Problema (v3.x):** Campo redundante causava loops de permissão

**Solução (v4.0):** 
```typescript
// ANTES (v3.x)
const partnerId = user.partnerId; // ❌ Redundante

// DEPOIS (v4.0)
const coupleDoc = await getDoc(doc(db, 'couples', user.coupleId));
const partnerId = coupleDoc.data().members.find(id => id !== user.id); // ✅
```

**Benefícios:**
- ✅ Zero loops de permissão (cada user edita só seu doc)
- ✅ Regras Firestore simplificadas
- ✅ Menos redundância de dados
- ✅ Atomicidade garantida via transações

### Real-Time Sync com onSnapshot
Todos os dados críticos usam listeners em tempo real:
- Matches (`likedInteractions`)
- Mensagens (`cardChats/{cardId}/messages`)
- User updates (`users/{userId}`)
- Cartas customizadas (`userCards`)

### Otimizações de Performance
- Queries sem índices compostos (filtro em JS quando necessário)
- Debounce em listeners frequentes
- Lazy loading de imagens
- Service Worker para cache agressivo (PWA)

## 6. Documentação Adicional

Para entender fluxos específicos, consulte:

| Documento | Conteúdo |
|-----------|----------|
| `01-data-model.md` | Modelo de dados detalhado |
| `02-authentication-flow.md` | Fluxo de auth e sessões |
| `03-firestore-security-rules.md` | Regras de segurança |
| `04-couple-connection-flow.md` | Vinculação de casais |
| `05-card-interaction-flow.md` | Swipe e matches |
| `06-chat-flow.md` | Sistema de chat |
| `07-pendinglinks-collection.md` | Lógica de convites |

**Documentação Completa:** Ver [PROJECT_CONTEXT.md](../../../PROJECT_CONTEXT.md)

---

**Última Atualização:** Novembro 2025 | **Versão:** 4.0
