# Fluxo de Conexão de Casal

Este documento descreve o processo pelo qual dois usuários do KinkLink podem conectar suas contas para formar um casal dentro do aplicativo.

## 1. Visão Geral

A conexão de casal permite que os usuários compartilhem interações com cartas, formem "Links" (matches) e utilizem o chat integrado. O processo geralmente envolve um usuário iniciando um convite (gerando um código) e o outro usuário aceitando esse convite (inserindo o código).

## 2. Componentes Envolvidos

*   **Frontend (React App):**
    *   `ProfilePage.tsx` (ou uma seção/página dedicada à conexão): Interface para iniciar a conexão (gerar código) ou inserir um código de convite.
    *   `AuthContext.tsx`: Pode ser usado para acessar o `userId` do usuário logado.
    *   `firestoreService.ts` (ou similar): Funções para interagir com o Firestore (criar/atualizar `pendingLinks`, criar `couples`, atualizar `users`).
*   **Backend (Firestore):**
    *   `pendingLinks` (Coleção): Armazena convites pendentes com um código único, o ID do iniciador e o status.
    *   `users` (Coleção): Documentos dos usuários são atualizados com o `coupleId` e `linkedPartnerId` após a conexão.
    *   `couples` (Coleção): Um novo documento é criado para representar o casal conectado, armazenando os `userIds` dos membros.

## 3. Fluxo Detalhado

### Parte 1: Iniciando a Conexão (Usuário A - Iniciador)

1.  **Geração de Código:**
    *   O Usuário A navega para a seção de conexão no aplicativo.
    *   O aplicativo gera um código de convite único e com tempo de expiração (ex: 6 caracteres alfanuméricos, válido por X minutos/horas).
    *   Um novo documento é criado na coleção `pendingLinks` no Firestore com:
        *   `linkCode`: O código gerado.
        *   `initiatorUserId`: `userId` do Usuário A.
        *   `status`: "pending".
        *   `createdAt`: Timestamp da criação.
        *   `expiresAt`: Timestamp de expiração do código.
    *   O código é exibido para o Usuário A, para que ele possa compartilhá-lo com o Usuário B.

### Parte 2: Aceitando a Conexão (Usuário B - Receptor)

1.  **Inserção do Código:**
    *   O Usuário B recebe o código do Usuário A e o insere na seção de conexão do seu aplicativo.
2.  **Validação do Código:**
    *   O aplicativo consulta a coleção `pendingLinks` no Firestore pelo `linkCode` fornecido.
    *   **Verificações:**
        *   O código existe?
        *   O status é "pending"?
        *   O código não expirou?
        *   O `initiatorUserId` não é o mesmo que o `userId` do Usuário B (para evitar auto-conexão)?
        *   O Usuário A e o Usuário B já não estão em outros casais ativos? (Esta verificação pode ser feita lendo os documentos dos usuários).
3.  **Confirmação da Conexão (Transação Firestore):**
    *   Se todas as validações passarem, uma transação do Firestore é ideal para garantir a atomicidade das seguintes operações:
        1.  **Criar Documento `couples`:**
            *   Um novo documento é criado na coleção `couples`.
            *   `members`: Array contendo `[initiatorUserId, acceptedByUserId (userId do Usuário B)]`.
            *   `createdAt`: Timestamp.
            *   O ID deste novo documento (`coupleId`) é obtido.
        2.  **Atualizar Documento `pendingLinks`:**
            *   O status do documento em `pendingLinks` é atualizado para "completed".
            *   `acceptedBy`: `userId` do Usuário B.
            *   `coupleId`: O `coupleId` recém-criado.
        3.  **Atualizar Documento do Usuário A (`users/{initiatorUserId}`):**
            *   `coupleId`: O `coupleId` recém-criado.
            *   `linkedPartnerId`: `userId` do Usuário B.
        4.  **Atualizar Documento do Usuário B (`users/{acceptedByUserId}`):**
            *   `coupleId`: O `coupleId` recém-criado.
            *   `linkedPartnerId`: `userId` do Usuário A.
4.  **Feedback ao Usuário:**
    *   Ambos os usuários (ou pelo menos o Usuário B, e o Usuário A na próxima vez que carregar os dados) são notificados do sucesso da conexão.
    *   A interface do aplicativo é atualizada para refletir o estado de conectado.

## 4. Considerações Adicionais

*   **Cancelamento/Expiração:** Lógica para lidar com códigos expirados ou se o iniciador cancelar o convite antes de ser aceito (atualizando o status em `pendingLinks`).
*   **Desvinculação:** Um fluxo separado seria necessário para permitir que os usuários desfaçam a conexão do casal. Isso envolveria remover/atualizar os campos `coupleId` e `linkedPartnerId` nos documentos dos usuários e, possivelmente, arquivar ou excluir o documento `couples`.
*   **Interface do Usuário:** A UI deve guiar claramente os usuários através do processo, informando sobre o status do código e o sucesso/falha da conexão.

---
Este fluxo descreve uma abordagem comum para conectar casais. As implementações exatas podem variar com base nos requisitos específicos e na estrutura de dados do `firestore.rules` que você já possui.