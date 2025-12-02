# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (embora estejamos em estágio inicial, < 1.0.0).

## [Unreleased]

### Added
- **Recuperação de Senha:** Funcionalidade para usuários redefinirem suas senhas via e-mail.
- (Futuras funcionalidades a serem adicionadas antes do próximo release)

### Changed
- (Mudanças em funcionalidades existentes)

### Fixed
- (Correções de bugs)

## [0.2.0-alpha] - 2024-11-XX

### 🚀 BREAKING CHANGES - Arquitetura v4.0

**Refatoração Completa do Sistema de Vínculo de Casal**

Esta versão introduz uma reformulação radical da arquitetura de conexão entre usuários, resolvendo problemas críticos de permissão e loops infinitos.

#### Mudanças Estruturais

**Removido:**
- ❌ Campo `partnerId` em documentos `users` (redundante)
- ❌ Campo `linkedPartnerId` em documentos `users` (redundante)
- ❌ Campo `linkCode` em documentos `users` (movido para coleção dedicada)
- ❌ Edição cruzada de documentos (User B editando User A)

**Adicionado:**
- ✅ Coleção `/pendingLinks` para códigos de vínculo
- ✅ Status `pending` em `couples` (criado antes do aceite)
- ✅ Campo `initiatorId` em `couples` (rastreamento)
- ✅ Campo `memberSymbols` em `couples` (identificação visual)
- ✅ Geração de `coupleId` aleatório (não concatenação de UIDs)

#### Nova Arquitetura de Linking

**Princípio Fundamental:** Cada usuário edita APENAS seu próprio documento.

**Fluxo v4.0:**
1. **User A cria código:**
   - Gera `coupleId` aleatório: `couple_${timestamp}_${random}`
   - Cria `couples/{coupleId}` (status='pending', 1 membro)
   - Cria `pendingLinks/{code}` apontando para coupleId
   - Atualiza próprio perfil: `{ coupleId }`

2. **User B aceita código:**
   - Busca `pendingLinks/{code}` → obtém coupleId
   - Atualiza próprio perfil: `{ coupleId }`
   - Completa couple: status='completed', 2 membros
   - Deleta pendingLink

3. **Desvínculo:**
   - Simplificado: apenas `coupleId` necessário
   - Loop através de `couple.members` para resetar ambos

#### Impacto no Código

**Serviços Reescritos:**
- `linkService.ts`: Reescrita completa das funções
  - `createLink()`: Nova lógica de couple+pendingLink
  - `acceptLink()`: Busca por código, não por userId
  - `unlinkCouple()`: Assinatura simplificada (só coupleId)

**Componentes Atualizados:**
- `App.tsx`: Detecção de vínculo via `coupleId` (não `partnerId`)
- `LinkedRoute.tsx`: Guard atualizado para `coupleId`
- `ProfilePage.tsx`: Busca parceiro de `couple.members`
- `LinkCouplePage.tsx`: Busca parceiro de `couple.members`

**Hooks Atualizados:**
- `useLinkCompletionListener.ts`: Remove checagens de `partnerId`
- `useCoupleLinking.ts`: Deprecado `unlinkPartner()`
- `useUserCardInteractions.ts`: Usa apenas `coupleId`

**Regras Firestore:**
- `pendingLinks`: Leitura aberta (qualquer autenticado)
- `couples` create: Permite status='pending' + 1 membro
- `couples` update: Permite se user em `members`
- Subcoleções: Todas usam `userHasCoupleId()`

#### Vantagens da v4.0

✅ **Zero Loops de Permissão:** Arquitetura auto-editável  
✅ **Regras Simplificadas:** Checagens baseadas em arrays  
✅ **Mais Flexível:** IDs aleatórios permitem extensões  
✅ **Menos Redundância:** Info de parceiro vem de couple  
✅ **Atomicidade Garantida:** Todas operações em transações  

### Fixed
- 🐛 Loops infinitos no sistema de linking (10+ iterações)
- 🐛 Erros de permissão durante vinculação (User B editando User A)
- 🐛 `LinkedRoute` bloqueando acesso a cartas após vínculo
- 🐛 Inconsistências entre `partnerId` e `coupleId`
- 🐛 Função `unlinkCouple` com assinatura complexa (3 params → 1)

### Documentation
- 📚 Atualizado `04-couple-connection-flow.md` com arquitetura v4.0
- 📚 Atualizado `01-data-model.md` com novos campos e remoções
- 📚 Criado `07-pendinglinks-collection.md` (nova coleção)
- 📚 Adicionada tabela comparativa v3.x vs v4.0

### Migration Notes
**⚠️ Dados existentes precisam de migração:**
- Usuários com `partnerId` precisam ter apenas `coupleId`
- Couples precisam ter `status`, `initiatorId`, `memberSymbols`
- Campo `linkCode` em users pode ser removido
- Considere script de migração se houver dados em produção

## [0.1.0-alpha] - 2024-07-25

### Added
- **Autenticação de Usuários:** Cadastro e Login com e-mail/senha.
- **Conexão de Casal:** Funcionalidade para usuários se conectarem através de um código.
- **Pilha de Cartas:** Visualização e interação (like/dislike) com cartas de sugestão.
- **Formação de "Links" (Matches):** Criação de um "Link" quando ambos os usuários do casal curtem a mesma carta.
- **Chat por Link:** Sistema de chat privado para cada "Link" formado.
- **Criação de Cartas Personalizadas:** Usuários podem adicionar suas próprias cartas.
- **Sistema de Skins (Gamificação):** Personalização visual básica do aplicativo.
- **Estrutura Inicial de Documentação:** Manual do Usuário e Documentação da Arquitetura.
- **Notificações Push:** Alertas para novos matches e outras atividades importantes.

### Changed
- Estrutura inicial do banco de dados Firestore definida.
- Regras de segurança iniciais do Firestore implementadas.

### Fixed
- (Nenhum bug conhecido corrigido nesta versão inicial)