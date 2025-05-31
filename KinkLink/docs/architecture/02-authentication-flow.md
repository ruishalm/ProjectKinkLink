# Fluxo de Autenticação

Este documento descreve o processo de autenticação de usuários no aplicativo KinkLink, desde o cadastro e login até o gerenciamento da sessão.

## 1. Visão Geral

O KinkLink utiliza o **Firebase Authentication** para gerenciar todas as operações relacionadas à identidade do usuário. O método principal de autenticação é por e-mail e senha.

## 2. Componentes Envolvidos

*   **Frontend (React App):**
    *   `SignupPage.tsx`: Interface para o cadastro de novos usuários.
    *   `LoginPage.tsx`: Interface para o login de usuários existentes.
    *   `AuthContext.tsx`: Contexto React que armazena o estado do usuário autenticado e fornece funções relacionadas à autenticação para os componentes da aplicação.
    *   `firebaseAuth.ts` (em `src/services/`): Módulo que encapsula as chamadas diretas ao SDK do Firebase Authentication.
*   **Backend (Firebase):**
    *   Firebase Authentication: Serviço que lida com o armazenamento seguro de credenciais, verificação de e-mail (se habilitado) e emissão de tokens de sessão.

## 3. Fluxo de Cadastro (Signup)

1.  **Coleta de Dados**:
    - O usuário acessa a `SignupPage` e preenche o formulário com e-mail, nome de usuário (username), data de nascimento, sexo atribuído ao nascer, identidade de gênero e senha.
    - O usuário deve concordar com os Termos de Serviço.
2.  **Validação no Frontend**:
    - Verifica se todos os campos obrigatórios foram preenchidos.
    - Calcula a idade a partir da data de nascimento e verifica se o usuário tem 18 anos ou mais.
        - Se menor de 18, o cadastro é bloqueado e uma mensagem informativa é exibida.
    - Verifica se as senhas coincidem e se a senha atende aos critérios de complexidade (mínimo 6 caracteres).
    - Verifica se os Termos de Serviço foram aceitos.
3.  **Chamada ao Firebase:** A `SignupPage` (através de uma função no `AuthContext` que chama `firebaseAuth.ts`) invoca a função `createUserWithEmailAndPassword` do SDK do Firebase Authentication, passando e-mail e senha.
4.  **Criação no Firebase:** O Firebase Authentication tenta criar um novo usuário.
    *   **Sucesso:** Um novo registro de usuário é criado no Firebase Authentication. Um UID (User ID) único é gerado.
    *   **Falha:** Se o e-mail já existir, a senha for fraca (conforme políticas do Firebase), ou ocorrer outro erro, o Firebase retorna um erro.
5.  **Atualização do Perfil Firebase e Criação de Documento no Firestore:**
    *   Após o sucesso da criação do usuário no Firebase Authentication, a função `updateProfile` do Firebase Auth é chamada para definir o `displayName` do usuário com o `username` fornecido.
    *   Um documento correspondente é criado na coleção `users` do Firestore, usando o UID como ID do documento. Este documento armazena informações adicionais do perfil, incluindo `email`, `username`, `birthDate`, `sex`, `gender`, `linkCode` (gerado aleatoriamente), `linkedPartnerId` (inicialmente `null`), `coupleId` (inicialmente `null`), `seenCards` (array vazio), `conexaoAccepted` (0), `conexaoRejected` (0), `unlockedSkinIds` (array com IDs de skins padrão) e `createdAt` (timestamp).
6.  **Atualização do Estado no Frontend:** O `AuthContext` é atualizado com os dados do novo usuário autenticado, incluindo o `username`.
7.  **Redirecionamento:** O usuário é geralmente redirecionado para a `ProfilePage` ou para a tela principal do aplicativo.

## 4. Fluxo de Login

1.  **Interação do Usuário:** O usuário acessa a `LoginPage` e insere seu e-mail e senha.
2.  **Chamada ao Firebase:** A `LoginPage` (através do `AuthContext` que chama `firebaseAuth.ts`) invoca a função `signInWithEmailAndPassword` do SDK do Firebase Authentication.
3.  **Verificação no Firebase:** O Firebase Authentication verifica as credenciais fornecidas.
    *   **Sucesso:** As credenciais são válidas.
    *   **Falha:** E-mail não encontrado, senha incorreta, conta desabilitada, etc. O Firebase retorna um erro.
4.  **Atualização do Estado no Frontend:** Em caso de sucesso, o `AuthContext` é atualizado com os dados do usuário autenticado.
5.  **Redirecionamento:** O usuário é redirecionado para a tela principal do aplicativo.

## 5. Gerenciamento de Sessão

*   **Persistência:** O Firebase Authentication SDK gerencia a persistência da sessão do usuário. Por padrão (configurável), a sessão é mantida mesmo que o usuário feche e reabra o navegador/aplicativo, até que um logout explícito ocorra ou o token expire (o SDK lida com a renovação de tokens).
*   **Observador de Estado de Autenticação (`onAuthStateChanged`):**
    *   O `AuthContext` utiliza o observador `onAuthStateChanged` do Firebase. Este observador é notificado sempre que o estado de autenticação do usuário muda (login, logout).
    *   Isso garante que o estado da aplicação (quem está logado) seja mantido sincronizado com o Firebase.
*   **Tokens ID:** O Firebase Authentication emite Tokens ID JWT (JSON Web Tokens) para os usuários autenticados. Embora o KinkLink possa não estar usando esses tokens diretamente para proteger APIs customizadas (já que a lógica principal está no cliente e as regras de segurança do Firestore protegem os dados), eles são fundamentais para o funcionamento interno do Firebase.

## 6. Fluxo de Logout

1.  **Interação do Usuário:** O usuário clica no botão "Sair" (geralmente na `ProfilePage`).
2.  **Chamada ao Firebase:** Uma função no `AuthContext` (que chama `firebaseAuth.ts`) invoca a função `signOut` do SDK do Firebase Authentication.
3.  **Encerramento da Sessão no Firebase:** A sessão do usuário é invalidada no Firebase.
4.  **Limpeza do Estado no Frontend:** O `AuthContext` é atualizado para refletir que não há usuário autenticado (estado do usuário é definido como `null`).
5.  **Redirecionamento:** O usuário é geralmente redirecionado para a `LoginPage`.

## 7. Recuperação de Senha (Esqueci Minha Senha)

O KinkLink permite que os usuários solicitem a redefinição de suas senhas caso as esqueçam.

1.  **Solicitação do Usuário:**
    *   Na `LoginPage` (ou através de um link "Esqueci minha senha"), o usuário acessa uma interface para recuperação de senha.
    *   O usuário insere o endereço de e-mail associado à sua conta KinkLink.
2.  **Chamada ao Firebase:**
    *   O frontend invoca a função `sendPasswordResetEmail` do SDK do Firebase Authentication, passando o e-mail fornecido.
3.  **Envio do E-mail pelo Firebase:**
    *   O Firebase Authentication verifica se o e-mail existe.
    *   Se o e-mail for válido e estiver registrado, o Firebase envia um e-mail contendo um link seguro para redefinição de senha. A aparência e o idioma deste e-mail e da página de redefinição podem ser personalizados no console do Firebase.
4.  **Redefinição pelo Usuário:**
    *   O usuário clica no link recebido por e-mail.
    *   Ele é direcionado para uma página (hospedada pelo Firebase) onde pode inserir e confirmar uma nova senha.
5.  **Login com Nova Senha:** Após redefinir a senha com sucesso, o usuário pode fazer login no KinkLink com suas novas credenciais.

---
Este fluxo descreve as operações padrão de autenticação. Medidas de segurança adicionais, como verificação de e-mail ou autenticação de dois fatores, podem ser adicionadas através das configurações do Firebase Authentication.