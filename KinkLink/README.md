# KinkLink (Aplicativo Frontend)

Este diretório contém o código-fonte do frontend do aplicativo KinkLink, desenvolvido com React, TypeScript e Vite.

## Visão Geral

KinkLink é um Progressive Web App (PWA) projetado para casais explorarem e descobrirem interesses e desejos mútuos (incluindo atividades cotidianas, românticas e NSFW) de forma anônima e gamificada. A interação principal ocorre através do swipe (aceitar/rejeitar) em cartas. Um "match" só é revelado quando ambos os parceiros expressam interesse na mesma carta, criando uma lista compartilhada.

## Tecnologias Utilizadas

* **Framework:** React.js
* **Linguagem:** TypeScript
* **Build Tool:** Vite
* **Backend (Serviços):** Firebase (Authentication, Firestore, Cloud Functions, Firebase Hosting, Firebase Storage)
* **Gerenciamento de Estado:** React Context/useState (inicialmente), com avaliação futura de Jotai ou Zustand.
* **Roteamento:** React Router

## Estrutura de Pastas (Simplificada)

KinkLink/
├── public/                 # Arquivos estáticos públicos
├── src/
│   ├── assets/             # Imagens, fontes, etc.
│   ├── components/         # Componentes React reutilizáveis
│   ├── contexts/           # Contextos React (ex: AuthContext)
│   ├── data/               # Dados estáticos (ex: definições de cartas)
│   ├── hooks/              # Hooks customizados React
│   ├── pages/              # Componentes de página (rotas principais)
│   ├── services/           # Lógica de interação com Firebase (além de Auth/Hooks)
│   ├── App.tsx             # Componente principal da aplicação e roteamento
│   ├── main.tsx            # Ponto de entrada da aplicação React
│   ├── firebase.ts         # Configuração e inicialização do Firebase
│   ├── index.css           # Estilos globais
│   └── ...                 # Outros arquivos e pastas de configuração
├── .eslintrc.cjs           # Configuração do ESLint (ou eslint.config.js)
├── index.html              # Ponto de entrada HTML
├── package.json            # Dependências e scripts do projeto
├── tsconfig.json           # Configuração principal do TypeScript
├── tsconfig.node.json      # Configuração do TypeScript para o ambiente Node (Vite)
└── vite.config.ts          # Configuração do Vite


## Scripts Disponíveis

No diretório do projeto, você pode executar:

### `npm install`

Instala todas as dependências do projeto.

### `npm run dev`

Executa o aplicativo no modo de desenvolvimento.
Abra [http://localhost:5173](http://localhost:5173) (ou a porta indicada pelo Vite) para visualizá-lo no navegador.

A página será recarregada se você fizer edições.
Você também verá quaisquer erros de lint no console.

### `npm run build`

Compila o aplicativo para produção na pasta `dist`.
Ele agrupa corretamente o React no modo de produção e otimiza a compilação para o melhor desempenho.

### `npm run lint`

Executa o ESLint para verificar erros de linting no código.

### `npm run preview`

Inicia um servidor local para pré-visualizar a build de produção contida na pasta `dist`.

## Funcionalidades Principais (MVP)

* Autenticação de usuários via Firebase (Email/Senha, Google, Facebook).
* **Vinculação de contas v4.0:** Sistema revolucionário de conexão entre parceiros
  - Código de 6 caracteres (A-Z, 0-9)
  - Couple criado instantaneamente pelo iniciador (status pending)
  - Cada usuário edita apenas seu próprio documento (zero problemas de permissão)
  - IDs aleatórios (não concatenação de UIDs)
  - Coleção `pendingLinks` para códigos temporários
* Visualização e interação (swipe/botões) com cartas pré-definidas e personalizadas.
* Cartas especiais de "Conexão" que não geram matches, mas registram interações para o casal.
* Criação de cartas personalizadas pelo casal, visíveis apenas para eles.
* Detecção de "match" quando ambos os parceiros curtem a mesma carta (exceto "Conexão").
* Lista de matches compartilhada.
* Chat interno para cada match, com persistência de mensagens no Firestore.
* Desvinculação de contas (simplificada - apenas coupleId necessário).
* Tela de perfil básica com opção de troca de tema.
* Aviso de conteúdo NSFW.
* Notificações Push para novos matches, mensagens e outras atividades.
* Sistema de Temas/Skins para personalização da interface.

## Arquitetura v4.0 (Novembro 2024)

**Mudança Fundamental:** Removido campo `partnerId` dos documentos de usuário. Informação de parceiro obtida dinamicamente da coleção `couples` através do campo `coupleId`.

**Benefícios:**
- ✅ Sem loops de permissão (cada user edita só seu documento)
- ✅ Regras Firestore simplificadas
- ✅ Menos redundância (partnerId era duplicação)
- ✅ Atomicidade garantida com transações

Veja `docs/architecture/04-couple-connection-flow.md` para detalhes completos.

## Próximos Passos (Desenvolvimento)

O desenvolvimento seguirá os marcos definidos no arquivo `project_context.json`, focando na integração com o backend Firebase e na implementação completa das funcionalidades do MVP.

---
