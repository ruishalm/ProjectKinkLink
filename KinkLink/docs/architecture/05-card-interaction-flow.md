# Fluxo de Interação com Cartas e Formação de "Links" (Matches)

Este documento descreve como os usuários interagem com as cartas de sugestões no KinkLink e como um "Link" (match) é formado quando ambos os membros de um casal demonstram interesse na mesma carta.

## 1. Visão Geral

Os usuários (dentro de um casal conectado) visualizam uma pilha de cartas. Para cada carta, eles podem indicar se gostaram ("like") ou não ("dislike"). Se ambos os usuários do casal derem "like" na mesma carta, um "Link" é criado, permitindo que eles discutam essa sugestão específica em um chat privado.

## 2. Componentes Envolvidos

*   **Frontend (React App):**
    *   `CardPilePage.tsx`: Exibe as cartas e lida com as interações de swipe/botão.
    *   `PlayingCard.tsx`: Componente que renderiza uma carta individual.
    *   `useUserCardInteractions.ts` (ou hook similar): Lógica para buscar cartas, registrar interações e verificar matches.
    *   `firestoreService.ts`: Funções para ler cartas e escrever interações/links no Firestore.
    *   `AuthContext.tsx`: Para obter o `userId` do usuário logado e o `coupleId`.
*   **Backend (Firestore):**
    *   `cards` (Coleção): Fonte das cartas padrão.
    *   `userCards` (Coleção): Fonte das cartas criadas por usuários (se aplicável e acessível na pilha principal).
    *   `users` (Coleção): Pode conter um campo `seenCards` (array de `cardId`) para cada usuário, ajudando a filtrar cartas já vistas pelo casal.
    *   `couples/{coupleId}/likedInteractions` (Subcoleção): Armazena as interações de "like" e o estado do match para cada carta dentro de um casal.

## 3. Fluxo Detalhado

### Parte 1: Apresentação e Interação com Cartas

1.  **Carregamento de Cartas:**
    *   Na `CardPilePage`, o hook `useUserCardInteractions` é acionado.
    *   O hook busca cartas da coleção `cards` (e `userCards`, se aplicável) no Firestore.
    *   **Filtragem:**
        *   Cartas já presentes na subcoleção `couples/{coupleId}/likedInteractions` (indicando que pelo menos um membro do casal já interagiu) são geralmente excluídas da pilha inicial para evitar repetições imediatas de decisão, ou podem ser tratadas de forma diferente se a lógica permitir re-interação.
        *   Opcionalmente, pode-se usar um campo `seenCards` nos documentos dos usuários (`users/{userId1}/seenCards` e `users/{userId2}/seenCards`) para filtrar cartas que ambos já viram de alguma forma, embora `likedInteractions` seja mais direto para o estado do match.
2.  **Exibição da Carta:**
    *   Uma carta é exibida ao usuário através do componente `PlayingCard`.
3.  **Interação do Usuário (Like/Dislike):**
    *   O usuário interage com a carta (swipe para a direita/esquerda ou botões "Like"/"Dislike").

### Parte 2: Registro da Interação e Verificação de Match

1.  **Usuário A Interage (Ex: "Like"):**
    *   O `userId` do Usuário A e o `cardId` da carta são capturados.
    *   O `coupleId` do casal é obtido (do `AuthContext` ou do perfil do usuário).
    *   **Operação no Firestore (dentro de `couples/{coupleId}/likedInteractions/{cardId}`):**
        *   **Se o documento `likedInteractions/{cardId}` NÃO existe:**
            *   Um novo documento é criado com:
                *   `cardData`: (Map) Cópia dos dados relevantes da carta (texto, categoria).
                *   `likedByUIDs`: (Array) Contendo `[userIdA]`.
                *   `isMatch`: `false`.
                *   `isHot`: `false` (ou valor padrão).
                *   `lastActivity`: Timestamp.
                *   `createdAt`: Timestamp.
            *   A regra de segurança para `create` em `likedInteractions` permite isso (um usuário do casal adicionando seu primeiro like).
        *   **Se o documento `likedInteractions/{cardId}` JÁ existe (significa que Usuário B já interagiu):**
            *   O documento é lido.
            *   Se o `userIdA` **não** está em `likedByUIDs` (evitando dupla contagem do mesmo usuário):
                *   O `userIdA` é adicionado ao array `likedByUIDs`.
                *   `isMatch` é definido como `true` (pois agora ambos os UIDs do casal estão em `likedByUIDs`).
                *   `lastActivity` é atualizado.
                *   A regra de segurança para `update` em `likedInteractions` permite essa transição para match.
    *   **Atualização de `seenCards` (Opcional, mas recomendado para o parceiro):**
        *   O `cardId` é adicionado ao array `seenCards` no documento do Usuário A (`users/{userIdA}`).
        *   Para otimizar a experiência do Usuário B, o `cardId` também é adicionado ao array `seenCards` do Usuário B (`users/{userIdB}`). Isso pode ser feito pelo cliente do Usuário A (se as regras permitirem, como no seu `firestore.rules`) ou por uma Cloud Function. Isso ajuda a evitar que o Usuário B veja uma carta que o Usuário A acabou de interagir e que já formou um match ou foi descartada.

2.  **Usuário B Interage (Ex: "Like" na mesma carta):**
    *   O fluxo é similar. Se o Usuário A já deu "like", a interação do Usuário B resultará na atualização do documento `likedInteractions/{cardId}` para `isMatch: true`.

### Parte 3: "Link" Formado

1.  **Detecção do Match:**
    *   Quando `isMatch` se torna `true` no documento `couples/{coupleId}/likedInteractions/{cardId}`, um "Link" é efetivamente formado.
2.  **Notificação/Feedback ao Usuário:**
    *   O aplicativo pode notificar os usuários (ambos, ou o último a interagir) sobre o novo "Link".
    *   A carta correspondente ao "Link" aparece na `MatchesPage` (ou `LinksPage`).
3.  **Habilitação do Chat:**
    *   O chat para esta carta específica (`couples/{coupleId}/cardChats/{cardId_do_match}`) agora pode ser acessado pelos usuários.

## 4. Considerações Adicionais

*   **Interação "Dislike":** Se um usuário der "dislike", essa informação pode ou não ser armazenada explicitamente. Se não for armazenada, a carta simplesmente não aparecerá em `likedInteractions` por aquele usuário. Se for armazenada (ex: para evitar mostrar a carta novamente), poderia ser em um campo separado ou em `seenCards`. A lógica atual do `likedInteractions` foca nos "likes".
*   **Atomicidade:** Para operações críticas como a formação de um match, o uso de transações Firestore ou escritas em lote (batched writes) pode ser considerado para garantir a consistência dos dados, especialmente se múltiplas atualizações precisarem ocorrer simultaneamente. As regras de segurança atuais para `likedInteractions` já lidam com os estados de criação e atualização de forma a construir o match.
*   **Performance:** Para casais com muitas interações, otimizar as consultas para a `CardPilePage` (para não mostrar cartas já "linkadas" ou descartadas) é importante. O uso de `seenCards` e a consulta eficiente de `likedInteractions` são chaves.

---
Este fluxo detalha a mecânica principal de interação com cartas e formação de matches, que é central para a experiência do KinkLink.