# Modelo de Dados (Firestore)

Este documento descreve a estrutura das principais coleções e documentos utilizados no Cloud Firestore para o aplicativo KinkLink.

## Visão Geral

O Firestore é usado como o principal banco de dados NoSQL para armazenar dados de usuários, cartas, interações, links (matches), chats e configurações. A estrutura é projetada para permitir consultas eficientes e escalabilidade.

## Coleções Principais

### 1. `users`
   Armazena informações sobre cada usuário registrado.

   *   **Documento ID:** `userId` (o UID fornecido pelo Firebase Authentication)
   *   **Campos:**
        *   `email`: (String) E-mail de cadastro do usuário.
        *   `username`: (String) Nome de usuário escolhido pelo usuário no cadastro.
        *   `createdAt`: (Timestamp) Data e hora de criação da conta.
        *   `coupleId`: (String, Opcional) ID do documento na coleção `couples` ao qual este usuário está vinculado. **Inicializado como `null`.**
        *   `bio`: (String, Opcional) Pequena biografia ou descrição do usuário (pode ser preenchido posteriormente).
        *   `seenCards`: (Array de Strings, Opcional) IDs das cartas que o usuário já viu/interagiu (inicializado como `[]`).
        *   `unlockedSkinIds`: (Array de Strings, Opcional) IDs das skins que o usuário desbloqueou (inicializado com skins padrão).
        *   `conexaoAccepted`: (Number, Opcional) Contador de interações de "conexão" aceitas (inicializado como `0`).
        *   `conexaoRejected`: (Number, Opcional) Contador de interações de "conexão" rejeitadas (inicializado como `0`).
        *   `birthDate`: (String, Opcional) Data de nascimento do usuário (formato YYYY-MM-DD).
        *   `sex`: (String, Opcional) Sexo atribuído ao nascer (ex: 'masculino', 'feminino', 'naoinformar_sexo').
        *   `gender`: (String, Opcional) Identidade de gênero do usuário (ex: 'homem_cis', 'mulher_trans', 'nao_binario').

   **Campos REMOVIDOS (v4.0):**
   - ❌ `linkCode` - Movido para coleção `pendingLinks`
   - ❌ `linkedPartnerId` - Redundante, info vem de `couple.members`

### 2. `couples`
   Representa a ligação entre dois usuários parceiros.

   *   **Documento ID:** ID aleatório gerado no formato `couple_${timestamp}_${random}` (v4.0)
   *   **Campos (v4.0):**
        *   `status`: (String) Status da conexão:
            - `"pending"`: Criado pelo User A, aguardando User B
            - `"completed"`: Vínculo completo com 2 membros
        *   `initiatorId`: (String) `userId` do usuário que criou o vínculo (User A)
        *   `members`: (Array de Strings) IDs dos membros do casal:
            - 1 membro quando `status='pending'`
            - 2 membros quando `status='completed'`
        *   `memberSymbols`: (Map) Símbolos associados a cada membro para identificação:
            ```typescript
            {
              [userId1]: '★',  // User A (iniciador)
              [userId2]: '▲'   // User B (aceitante)
            }
            ```
        *   `createdAt`: (Timestamp) Data e hora de criação do couple (pelo User A)

   **Mudanças v4.0:**
   - 🔄 ID aleatório (não concatenação de UIDs)
   - 🔄 `userIds` → `members` (nome mais claro)
   - ➕ `initiatorId` (rastreamento de quem criou)
   - ➕ `memberSymbols` (identificação visual)
   - ➕ Status `pending` (couple criado antes de aceite)

### 3. `cards`
   Contém todas as cartas disponíveis no aplicativo, tanto as padrão quanto as criadas por usuários.

   *   **Documento ID:** Gerado automaticamente pelo Firestore (ou um ID customizado para cartas padrão).
   *   **Campos:**
        *   `text`: (String) O texto principal da carta/sugestão.
        *   `category`: (String) Categoria da carta (ex: "Fantasia", "Poder", "Sensorial", "Exposição").
        *   `intensity`: (Number, Opcional) Nível de intensidade da carta.
        *   `isSystemCard`: (Boolean) `true` se for uma carta padrão do sistema, `false` se for criada por um usuário.
        *   `createdBy`: (String, Opcional) `userId` do usuário que criou a carta (se `isSystemCard` for `false`).
        *   `createdAt`: (Timestamp) Data de criação da carta.
        *   `imageUrl`: (String, Opcional) URL para uma imagem associada à carta (para cartas personalizadas com imagem).

### 4. `user_card_interactions` *(Subcoleção de `couples`)*
   Registra as interações de cada *casal* com cada carta para determinar os "Links".

   *   **Caminho:** `couples/{coupleId}/likedInteractions/{cardId}`
   *   **Documento ID:** `cardId`
   *   **Campos:**
        *   `coupleId`: (String) ID do casal (redundante mas útil para queries)
        *   `cardId`: (String) ID da carta
        *   `userInteractions`: (Map) Mapeia `userId` para a interação:
            ```typescript
            {
              [userId1]: "liked" | "disliked",
              [userId2]: "liked" | "disliked"
            }
            ```
        *   `isMatch`: (Boolean) `true` se ambos os usuários deram "liked"
        *   `isHot`: (Boolean, Opcional) `true` se marcado como "Top Link"
        *   `lastInteractionTimestamp`: (Timestamp) Data da última interação
        
   **Regras de Acesso (v4.0):** 
   - Apenas membros do couple (via `userHasCoupleId()`) podem ler/escrever

### 5. `links` (Alternativa ou Adição a `user_card_interactions`)
   Se for decidido separar os "Links" formados em sua própria coleção para facilitar consultas de matches.

   *   **Documento ID:** `coupleId_cardId` ou gerado automaticamente.
   *   **Campos:**
        *   `coupleId`: (String) ID do casal.
        *   `cardId`: (String) ID da carta que formou o Link.
        *   `cardData`: (Map) Cópia dos dados da carta (text, category) para evitar joins ou múltiplas leituras.
        *   `createdAt`: (Timestamp) Quando o Link foi formado.
        *   `isHot`: (Boolean) `true` se este Link é um "Top Link".
        *   `lastMessageTimestamp`: (Timestamp, Opcional) Timestamp da última mensagem no chat deste link, para ordenação e indicadores de não lido.
        *   `lastMessageSenderId`: (String, Opcional) ID do remetente da última mensagem.
        *   `lastMessageTextSnippet`: (String, Opcional) Trecho da última mensagem.

### 6. `chats` *(Subcoleção de `couples`)*
   Armazena os metadados de chat para cada "Link" entre um casal.

   *   **Caminho:** `couples/{coupleId}/cardChats/{cardId}`
   *   **Documento ID:** `cardId`
   *   **Campos:**
        *   `coupleId`: (String) ID do casal
        *   `cardId`: (String) ID da carta
        *   `cardText`: (String) Texto da carta (denormalizado)
        *   `createdAt`: (Timestamp) Quando o chat foi criado
        *   `lastMessageSenderId`: (String, Opcional) ID do remetente da última mensagem
        *   `lastMessageText`: (String, Opcional) Texto da última mensagem
        *   `lastMessageTimestamp`: (Timestamp, Opcional) Timestamp da última mensagem

   **Subcoleção de Mensagens:**
   *   **Caminho:** `couples/{coupleId}/cardChats/{cardId}/messages/{messageId}`
   *   **Documento ID:** Gerado automaticamente
   *   **Campos:**
        *   `senderId`: (String) `userId` do remetente
        *   `text`: (String) Conteúdo da mensagem
        *   `timestamp`: (Timestamp) Data/hora do envio
        *   `coupleId`: (String) ID do casal (para segurança)

   **Regras de Acesso (v4.0):**
   - Apenas membros do couple (via `userHasCoupleId()`) podem ler/escrever

### 7. `skins`
   Armazena as configurações das skins disponíveis no aplicativo.

   *   **Documento ID:** `skinId` (um identificador único para a skin, ex: "dark_mode", "forest_texture").
   *   **Campos:**
        *   `name`: (String) Nome amigável da skin (ex: "Modo Escuro", "Textura Floresta").
        *   `type`: (String) Tipo de skin (ex: "palette", "background_pile", "background_matches").
        *   `value`: (String ou Map) O valor da skin.
            *   Para `palette`: Um mapa de variáveis CSS e seus valores (ex: `{ "--cor-fundo-pagina": "#121212", "--cor-texto-primario": "#FFFFFF" }`).
            *   Para `background_pile` ou `background_matches`: URL da imagem de textura (armazenada no Firebase Storage).
        *   `previewImageUrl`: (String, Opcional) URL para uma imagem de preview da skin.
        *   `isDefault`: (Boolean, Opcional) `true` se for a skin padrão.
        *   `unlockConditions`: (Map, Opcional) Condições para desbloquear a skin (se houver gamificação).

## Relações e Considerações

*   **Denormalização:** Em alguns casos (como em `links` contendo `cardData`), a denormalização é usada para otimizar leituras e evitar consultas complexas.
*   **Índices:** Índices compostos podem ser necessários para consultas mais complexas (ex: buscar links de um casal ordenados por `lastMessageTimestamp`). O Firestore geralmente sugere a criação desses índices quando você tenta executar uma consulta que os requer.
*   **Regras de Segurança:** As regras de segurança do Firestore são cruciais para garantir que os usuários só possam acessar e modificar os dados aos quais têm permissão (ex: um usuário só pode ler/escrever mensagens em chats dos quais faz parte).

---

Este modelo de dados é uma representação. Ele pode evoluir conforme novas funcionalidades são adicionadas ou otimizações são necessárias.
