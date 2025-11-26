# 📱 KinkLink

> **Progressive Web App para Casais Explorarem Desejos e Conexão**

Este diretório contém o código-fonte do frontend do aplicativo KinkLink, desenvolvido com React, TypeScript e Vite.

## 🎯 Visão Geral

**KinkLink** é um PWA gamificado onde casais exploram fetiches, fantasias e conexão emocional através de cartas interativas no estilo Tinder. Cada parceiro swipa cartas individualmente e, quando ambos curtem a mesma, forma-se um **"Link"** (match) que vai para uma lista compartilhada com chat integrado.

### Conceito Central
- **Privacidade:** Apenas revelar interesses mútuos
- **Gamificação:** Sistema de skins, conquistas e categorias
- **Conexão:** Cartas especiais focadas em intimidade emocional
- **Personalização:** Casais podem criar suas próprias cartas

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite |
| **Estilo** | CSS Modules + Sistema de Skins |
| **State** | Context API (Auth, Skins, Notifications) |
| **Routing** | React Router v6 |
| **Backend** | Firebase (Auth, Firestore, Functions, FCM) |
| **Animações** | CSS Transforms + React-Spring |
| **Gestos** | @use-gesture/react |

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

## ✨ Funcionalidades Principais

### 🔐 Autenticação & Vinculação
- Login com Email/Senha ou Google
- **Sistema de Vinculação v4.0:**
  - Código de 6 dígitos (A-Z, 0-9)
  - Criação instantânea de `couple` (status: pending)
  - Zero conflitos de permissão (cada user edita só seu doc)
  - Símbolos aleatórios: ▲ Triângulo ou ⭐ Estrela

### 🎴 Sistema de Cartas
- **5 Categorias:**
  - 🫦 Sensorial (tato, olfato, paladar)
  - ⚡ Poder (dom/sub, controle)
  - 🎭 Fantasia (roleplay, cenários)
  - 👁️ Exposição (voyeurismo, exibicionismo)
  - 💬 Conexão (intimidade emocional) - **não gera match**
- Swipe Left 👎 (Não Topo!) / Right 👍 (Topo!)
- **Oops!** - Desfazer último dislike
- Filtro de intensidade (1-5)
- Fila inteligente (2/3 likes do parceiro, 1/3 cartas gerais)

### 🔥 Matches & Chat
- **Top Links:** Cartas favoritadas
- **Outros Links:** Agrupados por categoria
- **Realizadas:** Cartas marcadas como completadas
- Chat individual por carta
- Notificações de mensagens não lidas
- Botões: Favoritar | Completar | Repetir | Desfazer Link

### 🎨 Personalização
- **Cartas Customizadas:** Casais criam suas próprias cartas
- **Sistema de Skins:** 15+ temas desbloqueáveis por conquistas
- **Carinhos & Mimos:** Lista de cartas de Conexão aceitas

### 🔔 Notificações
- Push notifications (FCM) para matches e mensagens
- Badges visuais de conteúdo não lido
- Toasts para feedback de ações

## 🏗️ Arquitetura v4.0 (Novembro 2025)

### Mudanças Principais

**Remoção de `partnerId`:**
- Informação derivada dinamicamente de `couple.members[]`
- ✅ Zero loops de permissão
- ✅ Regras Firestore simplificadas
- ✅ Menos redundância de dados

**Estrutura de Dados (Firestore):**
```
users/{userId}
  └─ coupleId, seenCards[], maxIntensity, unlockedSkinIds[]

couples/{coupleId}
  ├─ members[] (2 userIds)
  ├─ memberSymbols {userId: '▲' ou '⭐'}
  ├─ likedInteractions/{cardId}
  │   └─ isMatch, isHot, isCompleted, cardData
  └─ cardChats/{cardId}/messages/{msgId}

cards/{cardId}
  └─ text, category, intensity

userCards/{cardId}
  └─ coupleId, text, category, createdByUserId
```

**Real-Time Sync:**
- `onSnapshot` listeners para matches, messages, user updates
- Optimistic UI updates
- Auto-sync entre dispositivos

### 📚 Documentação Completa

Para entender todo o sistema, veja:
- **[PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)** - Documentação completa e atualizada
- `docs/architecture/` - Diagramas e fluxos técnicos
- `docs/user-guide/` - Guias de uso

## 🚀 Setup & Desenvolvimento

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ruishalm/kinklink.git
cd kinklink/KinkLink

# Instale dependências
npm install

# Configure Firebase (crie src/firebase.ts com suas credenciais)

# Rode em dev
npm run dev
```

### Scripts Principais

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (localhost:5173) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview da build |
| `npm run lint` | Verificar erros de linting |

### Variáveis de Ambiente

Crie `.env` na raiz:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
# ... outras configs do Firebase
```

## 🧪 Testes

**Abordagem Atual:** Testes manuais extensivos

**Checklist de Fluxos:**
- [ ] Cadastro e Login
- [ ] Vinculação de casal (criar/aceitar código)
- [ ] Swipe de cartas (likes, matches)
- [ ] Chat de cartas
- [ ] Favoritar/Completar cartas
- [ ] Modal de Conexão (periódico)
- [ ] Desbloqueio de skins
- [ ] Notificações push

**Futuro:** Testes automatizados com Jest + Playwright

## 📊 Status do Projeto

**Versão Atual:** v4.0 (MVP Completo)

**Próximos Passos:**
1. ⚠️ Resolver warnings de React Hook dependencies
2. 📜 Script de recuperação de matches perdidos
3. 📸 Álbum de fotos compartilhado
4. 📝 Sistema de Post-its no chat
5. 🌍 Internacionalização (i18n)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

**Convenções de Commit:**
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Refatoração
- `docs:` Documentação
- `style:` CSS/UI
- `test:` Testes

## 📞 Contato & Suporte

- **Issues:** [GitHub Issues](https://github.com/ruishalm/kinklink/issues)
- **Documentação:** [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)
- **Email:** [seu-email@exemplo.com]

## 📜 Licença

[Definir Licença - MIT, GPL, etc.]

---
