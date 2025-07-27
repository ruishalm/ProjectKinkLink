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