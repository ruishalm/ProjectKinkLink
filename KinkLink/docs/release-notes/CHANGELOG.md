# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (embora estejamos em estágio inicial, < 1.0.0).

## [0.1.0] - 2024-05-23 

### ✨ Novas Funcionalidades (Added)
- **Cadastro Detalhado**: Adicionados campos de "Data de Nascimento", "Sexo Atribuído ao Nascer" e "Identidade de Gênero" ao formulário de cadastro.
- **Restrição de Idade**: Implementada verificação de idade no cadastro, permitindo apenas usuários com 18 anos ou mais.
- **Cabeçalho Global**: Introduzido um componente de cabeçalho global presente na maioria das páginas, contendo o logo da aplicação e um link para "Suporte e Contato".
- **Página de Suporte**: Criada uma nova página (`/suporte`) com informações de contato.
- **Recuperação de Senha:** Funcionalidade para usuários redefinirem suas senhas via e-mail.

### 💄 Melhorias de UI/UX (Changed)
- **Exibição de Novos Dados no Perfil**: A página de perfil agora exibe a data de nascimento, sexo e gênero do usuário.
- O botão de cadastro na página de signup agora fica desabilitado até que todos os campos obrigatórios sejam preenchidos e válidos.
- Adicionados indicadores de campos obrigatórios (`*`) na página de signup.

## [0.1.0-alpha] - YYYY-MM-DD (Data de referência anterior)

### Added
- **Autenticação de Usuários:** Cadastro e Login com e-mail/senha.
- **Conexão de Casal:** Funcionalidade para usuários se conectarem através de um código.
- **Pilha de Cartas:** Visualização e interação (like/dislike) com cartas de sugestão.
- **Formação de "Links" (Matches):** Criação de um "Link" quando ambos os usuários do casal curtem a mesma carta.
- **Chat por Link:** Sistema de chat privado para cada "Link" formado.
- **Criação de Cartas Personalizadas:** Usuários podem adicionar suas próprias cartas.
- **Sistema de Skins:** Personalização visual básica do aplicativo (ex: Modo Escuro).
- **Estrutura Inicial de Documentação:** Manual do Usuário e Documentação da Arquitetura.

### Changed
- Estrutura inicial do banco de dados Firestore definida.
- Regras de segurança iniciais do Firestore implementadas.

### Fixed
- (Nenhum bug conhecido corrigido nesta versão inicial)
