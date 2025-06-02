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
        *   `linkCode`: (String, Opcional) Código de convite gerado pelo usuário para conectar-se a um parceiro (inicializado no cadastro).
        *   `coupleId`: (String, Opcional) ID do documento na coleção `couples` ao qual este usuário está vinculado.
        *   `linkedPartnerId`: (String, Opcional) `userId` do parceiro conectado (inicializado como `null`).
        *   `bio`: (String, Opcional) Pequena biografia ou descrição do usuário (pode ser preenchido posteriormente).
        *   `seenCards`: (Array de Strings, Opcional) IDs das cartas que o usuário já viu/interagiu (inicializado como `[]`).
        *   `unlockedSkinIds`: (Array de Strings, Opcional) IDs das skins que o usuário desbloqueou (inicializado com skins padrão).
        *   `conexaoAccepted`: (Number, Opcional) Contador de interações de "conexão" aceitas (inicializado como `0`).
        *   `conexaoRejected`: (Number, Opcional) Contador de interações de "conexão" rejeitadas (inicializado como `0`).
        *   `birthDate`: (String, Opcional) Data de nascimento do usuário (formato YYYY-MM-DD).
        *   `sex`: (String, Opcional) Sexo atribuído ao nascer (ex: 'masculino', 'feminino', 'naoinformar_sexo').
        *   `gender`: (String, Opcional) Identidade de gênero do usuário (ex: 'homem_cis', 'mulher_trans', 'nao_binario').
        // `activeSkinId` e `preferences` foram removidos pois não são inicializados no cadastro via AuthContext e podem ser gerenciados de outra forma ou adicionados posteriormente se necessário.

### 2. `couples`
   Representa a ligação entre dois usuários parceiros.

   *   **Documento ID:** Gerado automaticamente pelo Firestore (ou pode ser um ID customizado).
   *   **Campos:**
        *   `userIds`: (Array de Strings) Contém os `userId` dos dois usuários que formam o casal. Ex: `["userId1", "userId2"]`.
        *   `createdAt`: (Timestamp) Data e hora em que a conexão do casal foi estabelecida.
        *   `status`: (String) Status da conexão (ex: "active", "pending").

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

### 4. `user_card_interactions`
   Registra as interações de cada *casal* com cada carta para determinar os "Links".

   *   **Documento ID:** `coupleId_cardId` (Combinação do ID do casal e ID da carta para unicidade e fácil consulta).
   *   **Campos:**
        *   `coupleId`: (String) ID do casal.
        *   `cardId`: (String) ID da carta.
        *   `userInteractions`: (Map) Mapeia `userId` para a interação.
            *   `[userId1]`: (String) "liked" ou "disliked".
            *   `[userId2]`: (String) "liked" ou "disliked".
        *   `isMatch`: (Boolean) `true` se ambos os usuários no `userInteractions` deram "liked".
        *   `isHot`: (Boolean, Opcional) `true` se este link foi marcado como "Top Link" pelo casal. (Pode também ser um campo no documento do link na coleção `links` se for mais conveniente).
        *   `lastInteractionTimestamp`: (Timestamp) Data da última interação com esta carta por este casal.

   *Alternativa para `isHot` e `isMatch`*: Em vez de `user_card_interactions`, poderia haver uma coleção `links` que só é criada quando `isMatch` se torna `true`.

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

### 6. `chats`
   Armazena as mensagens de chat para cada "Link" entre um casal.

   *   **Estrutura:** Subcoleção dentro de cada documento da coleção `links` (ou `user_card_interactions` se `links` não for usada).
        *   Caminho: `links/{linkId}/messages/{messageId}`
   *   **Coleção:** `messages`
   *   **Documento ID (`messageId`):** Gerado automaticamente pelo Firestore.
   *   **Campos do Documento de Mensagem:**
        *   `senderId`: (String) `userId` de quem enviou a mensagem.
        *   `text`: (String) Conteúdo da mensagem.
        *   `timestamp`: (Timestamp) Data e hora do envio da mensagem.
        *   `coupleId`: (String) ID do casal (para regras de segurança).

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
