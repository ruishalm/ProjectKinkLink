# Regras de Segurança do Firestore

Este documento descreve a lógica e a estrutura das regras de segurança do Cloud Firestore para o aplicativo KinkLink. As regras de segurança são essenciais para proteger os dados dos usuários, garantindo que apenas usuários autenticados e autorizados possam acessar ou modificar informações.

## 1. Visão Geral

As regras de segurança do Firestore são escritas em uma sintaxe própria e são aplicadas no servidor do Firebase. Elas permitem um controle granular sobre as operações de leitura (`get`, `list`), escrita (`create`, `update`, `delete`).

O princípio fundamental é "negar por padrão": se nenhuma regra permitir explicitamente uma operação, ela será negada.

## 2. Estrutura Geral do Arquivo de Regras (`firestore.rules`)

```firestore-rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Funções auxiliares (helper functions)
    function isAuthenticated() {
      return request.auth != null;
    }

    function isUser(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isPartOfCouple(coupleId) {
      // Verifica se o usuário autenticado pertence ao casal especificado
      return isAuthenticated() && get(/databases/$(database)/documents/couples/$(coupleId)).data.userIds[0] == request.auth.uid ||
             get(/databases/$(database)/documents/couples/$(coupleId)).data.userIds[1] == request.auth.uid;
    }

    // Regras para cada coleção
    match /users/{userId} {
      allow read: if isAuthenticated(); // Qualquer usuário autenticado pode ler perfis (para buscar parceiro, por exemplo)
      allow create: if request.auth.uid == userId; // Usuário só pode criar seu próprio perfil
      allow update: if isUser(userId); // Usuário só pode atualizar seu próprio perfil
      // allow delete: if isUser(userId); // Considerar implicações antes de habilitar
    }

    match /couples/{coupleId} {
      allow read: if isPartOfCouple(coupleId); // Só membros do casal podem ler os dados do casal
      allow create: if isAuthenticated(); // Qualquer usuário autenticado pode iniciar a criação de um 'couple' (ao gerar código)
      allow update: if isPartOfCouple(coupleId); // Só membros do casal podem atualizar (ex: aceitar convite, desvincular)
      // allow delete: if isPartOfCouple(coupleId); // Considerar implicações
    }

    match /cards/{cardId} {
      allow read: if isAuthenticated(); // Todas as cartas são públicas para usuários autenticados
      allow create: if isAuthenticated(); // Usuários autenticados podem criar cartas personalizadas
      // allow update, delete: if get(/databases/$(database)/documents/cards/$(cardId)).data.createdBy == request.auth.uid || isAdmin(); // Só quem criou ou admin pode modificar/deletar
    }

    match /user_card_interactions/{interactionId} {
      // interactionId é coupleId_cardId
      let coupleId = interactionId.split('_')[0];
      allow read, write: if isPartOfCouple(coupleId); // Só membros do casal podem ler/escrever interações
    }

    // Se usar a coleção 'links' separadamente:
    match /links/{linkId} {
      // linkId pode ser coupleId_cardId ou um ID automático
      // Se for automático, o coupleId precisaria ser um campo no documento do link
      let coupleId = resource.data.coupleId; // Assumindo que coupleId é um campo
      allow read, write: if isPartOfCouple(coupleId);

      // Para subcoleção de mensagens dentro de links
      match /messages/{messageId} {
        allow read, create: if isPartOfCouple(get(/databases/$(database)/documents/links/$(linkId)).data.coupleId);
        // Não permitir update/delete de mensagens para manter histórico, a menos que seja uma funcionalidade
      }
    }

    // Se a subcoleção de chats estiver em user_card_interactions:
    // match /user_card_interactions/{interactionId}/messages/{messageId} {
    //   let coupleId = interactionId.split('_')[0];
    //   allow read, create: if isPartOfCouple(coupleId);
    // }

    match /skins/{skinId} {
      allow read: if isAuthenticated(); // Skins são públicas para usuários autenticados
      // allow write: if isAdmin(); // Apenas administradores podem adicionar/modificar skins
    }

    // Adicionar aqui regras para outras coleções, se houver.
  }
}
```

## 3. Principais Considerações e Lógicas

*   **Autenticação:** A maioria das regras exige que o usuário esteja autenticado (`request.auth != null`).
*   **Propriedade dos Dados:** Muitas regras garantem que um usuário só possa modificar seus próprios dados (ex: `users/{userId}` onde `request.auth.uid == userId`).
*   **Acesso de Casal:** Para dados compartilhados por um casal (como `couples`, `user_card_interactions`, `links`, `chats`), as regras verificam se o `request.auth.uid` está presente no array `userIds` do documento `couples` correspondente. A função `isPartOfCouple()` encapsula essa lógica.
*   **Dados Públicos (Leitura):** Algumas coleções, como `cards` e `skins`, podem ser legíveis por qualquer usuário autenticado.
*   **Criação de Cartas:** Usuários autenticados podem criar novas cartas. A modificação/exclusão de cartas poderia ser restrita ao criador ou a um administrador (não implementado no exemplo acima).
*   **Segurança Granular para Chats:** As mensagens de chat são geralmente uma subcoleção de um "Link". As regras garantem que apenas os membros do casal associado ao Link possam ler ou criar mensagens naquele chat.

## 4. Testando Regras

O Firebase Console oferece um "Simulador de Regras" que permite testar suas regras com diferentes tipos de operações (leitura, escrita), caminhos de documentos e estados de autenticação (autenticado com um UID específico ou não autenticado). É crucial testar exaustivamente as regras antes de aplicá-las em produção.

---
Estas regras são um ponto de partida e devem ser adaptadas e expandidas conforme a evolução do aplicativo e a necessidade de controles de acesso mais específicos. A segurança dos dados é uma responsabilidade contínua.