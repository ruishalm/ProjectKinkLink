Crie um diagrama de arquitetura de software claro e moderno para um aplicativo web chamado "KinkLink".

**Elementos Principais e Layout:**

1.  **Usuário (Actor):** Representado por um ícone de pessoa estilizado, posicionado à esquerda do diagrama.
2.  **Frontend Application (React & Vite):** Uma caixa retangular proeminente no centro-esquerda. Dentro desta caixa, mencione sutilmente "React", "Vite". Pode ter um pequeno ícone do React.
3.  **Firebase Backend Services:** Um grupo de caixas ou uma nuvem estilizada à direita do Frontend. Este grupo deve conter:
    *   **Firebase Authentication:** Uma caixa conectada ao Frontend.
    *   **Cloud Firestore:** Uma caixa (talvez com um ícone de banco de dados) conectada ao Frontend.
    *   **Firebase Storage:** Uma caixa (talvez com um ícone de armazenamento/bucket) conectada ao Frontend.
    *   **(Opcional) Cloud Functions:** Uma caixa menor, talvez conectada ao Firestore ou ao Frontend, indicando uso futuro ou opcional.

**Conexões:**

*   Use setas limpas e direcionais para mostrar as interações:
    *   Usuário <-> Frontend Application (interação bidirecional ou seta do usuário para o app).
    *   Frontend Application <-> Firebase Authentication (para login/cadastro).
    *   Frontend Application <-> Cloud Firestore (para leitura/escrita de dados principais: cartas, links, chats).
    *   Frontend Application <-> Firebase Storage (para assets como texturas de skins).
    *   (Opcional) Frontend Application <-> Cloud Functions, ou Cloud Functions <-> Firestore.

**Estilo Visual:**

*   **Estilo:** Técnico, limpo, profissional, com um toque moderno.
*   **Cores:** Use uma paleta de cores coesa e agradável. Pode ser predominantemente tons de azul, cinza, com um ou dois acentos de cor (talvez um laranja ou roxo sutil, se combinar com a identidade visual do KinkLink, mas sem exagerar). Evite cores muito vibrantes ou infantis.
*   **Tipografia:** Fontes sans-serif legíveis para todas as legendas.
*   **Fundo:** Um fundo simples, branco ou cinza muito claro.
*   **Ícones:** Ícones minimalistas e reconhecíveis para React e Firebase (se possível e se a IA suportar bem).
*   **Detalhes:** Linhas finas, cantos levemente arredondados nas caixas podem adicionar um toque moderno.

**Composição Geral:**

*   O diagrama deve ser bem organizado e fácil de seguir.
*   Bom espaçamento entre os elementos.
*   Fluxo lógico da esquerda (usuário) para a direita (backend).

**Palavras-chave adicionais para a IA (dependendo da ferramenta):**
`software architecture diagram, web application, cloud services, data flow, UI, backend, database, authentication, storage, clean design, modern, tech illustration, infographic style, vector art (se quiser um estilo mais limpo)`

**Como usar o prompt:**

1.  **Escolha sua IA de Imagem:** Midjourney, DALL-E 3 (via ChatGPT Plus ou Bing Image Creator), Stable Diffusion (existem várias interfaces), Leonardo.ai, etc.
2.  **Adapte o Prompt:**
    *   Se a IA tiver um limite de caracteres, você pode precisar encurtar.
    *   Algumas IAs respondem melhor a frases mais diretas, outras a descrições mais narrativas.
    *   Você pode tentar variações, removendo ou adicionando detalhes. Por exemplo, se a IA não entender bem "ícone do React", simplifique.
3.  **Itere:** A primeira imagem gerada pode não ser perfeita. Use-a como base para refinar seu prompt.
    *   Se algo estiver faltando, adicione explicitamente.
    *   Se algo estiver estranho, descreva como você gostaria que fosse diferente.
    *   Muitas IAs permitem que você use uma imagem gerada como "semente" ou inspiração para novas variações.

**Exemplo de uma parte do prompt mais concisa para IAs com limite:**

"Diagrama de arquitetura de software para app KinkLink. Usuário à esquerda. App React/Vite no centro. Firebase (Auth, Firestore, Storage) à direita. Setas mostrando fluxo de dados. Estilo limpo, moderno, técnico. Fundo claro."

Experimente e veja o que a IA consegue criar! Pode ser que você precise de algumas tentativas para chegar a um resultado que te agrade e que represente bem a arquitetura. Depois, você pode salvar a imagem e incorporá-la no seu arquivo `00-overview.md`.
