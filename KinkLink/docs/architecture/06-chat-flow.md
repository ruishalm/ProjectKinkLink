# Fluxo de Chat

Este documento descreve o funcionamento do sistema de chat no KinkLink, que permite aos casais conectados discutirem as cartas com as quais formaram um "Link" (match).

## 1. Visão Geral

Após um casal formar um "Link" com uma carta, um chat específico para essa carta é habilitado. Os usuários podem enviar e receber mensagens em tempo real dentro desse contexto.

## 2. Componentes Envolvidos

*   **Frontend (React App):**
    *   `MatchesPage.tsx` (ou `LinksPage.tsx`): Exibe a lista de "Links" formados. Ao clicar em um Link, o chat correspondente é aberto.
    *   `CardChatModal.tsx` (ou componente similar): Modal ou tela que exibe a interface do chat para um "Link" específico.
    *   `useCoupleCardChats.ts` (ou hook similar dentro do `CardChatModal`): Lógica para buscar mensagens existentes, escutar novas mensagens em tempo real e enviar novas mensagens.
    *   `firestoreService.ts`: Funções para interagir com o Firestore (ler e escrever mensagens).
    *   `AuthContext.tsx`: Para obter o `userId` do usuário logado e o `coupleId`.
*   **Backend (Firestore):**
    *   `couples/{coupleId}/likedInteractions/{cardId}`: O documento do "Link" que serve como ponto de entrada ou referência para o chat.
    *   `couples/{coupleId}/cardChats/{cardId_do_match}`: Documento que pode armazenar metadados do chat (como `lastMessageTimestamp`, `lastMessageSenderId`, `lastMessageTextSnippet`).
    *   `couples/{coupleId}/cardChats/{cardId_do_match}/messages` (Subcoleção): Armazena todas as mensagens de um chat específico.
        *   **Documento de Mensagem:**
            *   `userId`: (String) ID do remetente.
            *   `username`: (String) Nome de usuário do remetente (denormalizado para fácil exibição).
            *   `text`: (String) Conteúdo da mensagem.
            *   `timestamp`: (Timestamp) Data e hora do envio.

## 3. Fluxo Detalhado

### Parte 1: Acessando o Chat

1.  **Seleção do Link:**
    *   O usuário navega para a `MatchesPage` (ou `LinksPage`).
    *   A página exibe uma lista de "Links" (matches) baseados nos documentos da subcoleção `couples/{coupleId}/likedInteractions` onde `isMatch` é `true`.
    *   O usuário clica em um "Link" específico para abrir o chat.
2.  **Abertura do Chat:**
    *   O `CardChatModal` (ou tela de chat) é aberto, passando o `cardId` (ou `cardId_do_match`) do "Link" selecionado e o `coupleId`.

### Parte 2: Carregamento e Exibição de Mensagens

1.  **Busca Inicial e Escuta em Tempo Real:**
    *   Dentro do `CardChatModal`, o hook `useCoupleCardChats` (ou lógica similar) é ativado.
    *   Ele constrói o caminho para a subcoleção de mensagens: `couples/{coupleId}/cardChats/{cardId_do_match}/messages`.
    *   Uma consulta é feita para buscar as mensagens existentes, geralmente ordenadas por `timestamp`.
    *   Um listener em tempo real (ex: `onSnapshot` do Firestore) é configurado para essa subcoleção para receber novas mensagens assim que forem adicionadas.
2.  **Renderização das Mensagens:**
    *   As mensagens são exibidas na interface do chat, mostrando o `username` do remetente, o `text` da mensagem e, opcionalmente, o `timestamp`.

### Parte 3: Enviando uma Nova Mensagem

1.  **Interação do Usuário:**
    *   O usuário digita uma mensagem no campo de entrada do chat e clica em "Enviar".
2.  **Criação do Documento da Mensagem:**
    *   O `userId` e `username` do remetente são obtidos.
    *   Um novo documento é adicionado à subcoleção `couples/{coupleId}/cardChats/{cardId_do_match}/messages` com:
        *   `userId`: `userId` do remetente.
        *   `username`: `username` do remetente.
        *   `text`: Conteúdo da mensagem.
        *   `timestamp`: `serverTimestamp()` do Firestore (para garantir consistência).
3.  **Atualização de Metadados do Chat (Opcional, mas recomendado):**
    *   Após enviar a mensagem, o documento `couples/{coupleId}/cardChats/{cardId_do_match}` pode ser atualizado com:
        *   `lastMessageTextSnippet`: Um trecho da nova mensagem.
        *   `lastMessageTimestamp`: O timestamp da nova mensagem.
        *   `lastMessageSenderId`: O `userId` do remetente.
    *   Isso é útil para exibir informações resumidas na lista de "Links" (`MatchesPage`) sem precisar ler todas as mensagens de cada chat. As regras de segurança (`firestore.rules`) permitem essa atualização.
4.  **Atualização em Tempo Real:**
    *   Devido ao listener `onSnapshot`, a nova mensagem aparecerá automaticamente nas interfaces de chat de ambos os usuários do casal.

## 4. Considerações Adicionais

*   **Indicadores de "Não Lido":** A lógica para indicadores de mensagens não lidas pode ser implementada comparando o `lastMessageTimestamp` do chat com um timestamp de "última leitura" armazenado para cada usuário em relação àquele chat.
*   **Notificações Push:** Para notificações fora do aplicativo, Cloud Functions poderiam ser usadas para escutar novas mensagens e enviar notificações push para o destinatário.
*   **Performance:** Para chats muito longos, a paginação de mensagens pode ser considerada, carregando apenas as N mensagens mais recentes inicialmente e permitindo que o usuário carregue mais mensagens antigas conforme rola para cima.

---
Este fluxo descreve a funcionalidade de chat, que é vital para a comunicação do casal após um "Link" ser formado.