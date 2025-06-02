# Visão Geral da Arquitetura do KinkLink

Este documento fornece uma visão geral da arquitetura técnica do aplicativo KinkLink, descrevendo seus principais componentes, tecnologias utilizadas e fluxos de dados.

## 1. Introdução

O KinkLink é um aplicativo interativo projetado para casais, com o objetivo de facilitar a descoberta de novos interesses e fortalecer a conexão através de sugestões de atividades e um sistema de chat integrado. A arquitetura foi pensada para ser escalável, utilizando tecnologias modernas e serviços gerenciados para garantir uma boa experiência ao usuário e facilitar a manutenção.

## 2. Pilha Tecnológica (Tech Stack)

O KinkLink é composto por um frontend (aplicativo cliente) e utiliza os serviços do Firebase como backend.

### 2.1. Frontend

*   **Framework/Biblioteca Principal:** React (com TypeScript) para a construção da interface de usuário.
*   **Bundler/Servidor de Desenvolvimento:** Vite, proporcionando um desenvolvimento rápido e eficiente.
*   **Roteamento:** React Router DOM para a navegação entre as diferentes telas (páginas) do aplicativo.
*   **Estilização:** CSS Modules para escopo local de estilos, garantindo que os estilos de um componente não afetem outros inesperadamente. Variáveis CSS globais são usadas para temas (Skins).
*   **Gerenciamento de Estado:**
    *   Context API do React para estados globais como autenticação (`AuthContext`) e skins (`SkinContext`).
    *   Hooks customizados para encapsular lógicas de estado e efeitos colaterais complexos (ex: `useUserCardInteractions`, `useCoupleCardChats`).
*   **Interações com Gestos:** `use-gesture` para interações de arrastar (swipe) nas cartas.
*   **Carrosséis:** Swiper.js para os carrosséis de categorias na página de "Links".

### 2.2. Backend e Serviços (Firebase)

O KinkLink utiliza extensivamente a plataforma Firebase para suas necessidades de backend:

*   **Firebase Authentication:**
    *   Responsável pelo gerenciamento de usuários: cadastro (e-mail/senha), login e gerenciamento de sessão.
*   **Firestore (Cloud Firestore):**
    *   Banco de dados NoSQL principal.
    *   Armazena:
        *   Dados dos usuários (perfis, ID do parceiro conectado).
        *   Cartas (padrão e criadas por usuários).
        *   "Links" (matches entre usuários e cartas).
        *   Mensagens de chat associadas a cada Link.
        *   Configurações de skins disponíveis.
*   **Firebase Storage:**
    *   Utilizado para armazenar assets estáticos, como:
        *   Imagens de textura para as skins de fundo.
        *   (Potencialmente) Imagens para cartas personalizadas, se essa funcionalidade for expandida.
*   **Cloud Functions for Firebase (Opcional/Futuro):**
    *   Atualmente, a lógica de match e outras operações são majoritariamente tratadas no cliente.
    *   Cloud Functions poderiam ser usadas no futuro para:
        *   Lógica de backend mais complexa (ex: notificações push).
        *   Operações que exigem privilégios administrativos ou segurança aprimorada.
        *   Processamento de dados em segundo plano.

## 3. Estrutura de Pastas Principais do Frontend (`src/`)

A organização do código no frontend segue uma estrutura modular para facilitar a manutenção e o desenvolvimento:

*   `assets/`: Contém imagens, fontes e outros arquivos estáticos.
*   `components/`: Componentes React reutilizáveis que formam blocos de construção da UI (ex: `PlayingCard.tsx`, `CategoryCarousel.tsx`, `CardChatModal.tsx`).
*   `contexts/`: Definições dos Contextos React para gerenciamento de estado compartilhado (ex: `AuthContext.tsx`, `SkinContext.tsx`).
*   `hooks/`: Hooks customizados que encapsulam lógica de estado e efeitos colaterais (ex: `useUserCardInteractions.ts`, `useCoupleCardChats.ts`).
*   `pages/`: Componentes React que representam as diferentes telas/rotas principais da aplicação (ex: `CardPilePage.tsx`, `MatchesPage.tsx`, `ProfilePage.tsx`).
*   `services/`: Módulos com funções para interagir com os serviços do Firebase (ex: `firebaseAuth.ts`, `firestoreService.ts`).
*   `styles/`: Arquivos de CSS globais, variáveis CSS para temas (skins), e resets.
*   `utils/`: Funções utilitárias genéricas usadas em várias partes do aplicativo.
*   `App.tsx`: Componente raiz da aplicação, onde o roteamento principal é configurado.
*   `main.tsx`: Ponto de entrada da aplicação, onde o React é renderizado no DOM.

## 4. Principais Fluxos de Dados (Exemplos)

*   **Autenticação de Usuário:**
    1.  Usuário insere e-mail/senha na `SignupPage` ou `LoginPage`.
    2.  Funções do `firebaseAuth.ts` interagem com o Firebase Authentication.
    3.  Em caso de sucesso, o `AuthContext` é atualizado com os dados do usuário, e a sessão é persistida.
*   **Carregamento e Interação com Cartas:**
    1.  `CardPilePage` utiliza o hook `useUserCardInteractions`.
    2.  O hook busca cartas do Firestore (filtrando as já vistas/interagidas pelo casal).
    3.  O usuário interage (swipe/botão) com uma `PlayingCard`.
    4.  A interação é registrada no Firestore (ex: `user_interactions` ou similar).
    5.  Se ambos os parceiros conectados curtem a mesma carta, um "Link" é formado.
*   **Sistema de Chat:**
    1.  Na `MatchesPage`, ao clicar em um Link, o `CardChatModal` é aberto.
    2.  O hook `useCoupleCardChats` (ou lógica similar dentro do modal) busca/escuta mensagens do Firestore para o `coupleId` e `cardId` específicos.
    3.  Novas mensagens são salvas no Firestore na coleção apropriada.
*   **Aplicação de Skins:**
    1.  `SkinsPage` exibe as skins disponíveis (buscadas do Firestore ou definidas localmente).
    2.  Usuário seleciona e ativa uma skin.
    3.  O `SkinContext` é atualizado.
    4.  Variáveis CSS globais são alteradas dinamicamente, refletindo a nova skin em toda a aplicação.

## 5. Diagrama de Arquitetura de Alto Nível

*(Um diagrama visual será adicionado aqui posteriormente ).*

---

Este documento fornece uma base para o entendimento da arquitetura do KinkLink. Detalhes adicionais sobre componentes específicos ou fluxos podem ser encontrados em documentações mais granulares ou diretamente no código-fonte comentado.
