# Gerenciando Seus Links

Quando você e seu parceiro(a) conectado(a) demonstram interesse mútuo em uma mesma carta (ambos dão "Like"), essa carta se transforma em um "Link". A seção "Links" (acessível pela barra de navegação inferior) é onde todas essas conexões especiais são armazenadas e organizadas.

## Acessando "Seus Links" (`MatchesPage`)

Ao entrar nesta seção, você verá uma visão geral de todas as ideias que ressoaram com ambos. A página é dividida para facilitar a visualização:

*   **Top Links:** Uma área de destaque para as cartas que vocês consideram mais interessantes ou prioritárias.
*   **Links por Categoria:** As demais cartas são agrupadas por suas respectivas categorias (Fantasia, Poder, etc.), permitindo uma navegação temática.

## 🔥 Top Links

Os "Top Links" são suas cartas favoritas, aquelas que vocês realmente querem explorar ou discutir mais a fundo.

*   **Como Adicionar/Remover uma Carta dos Top Links:**
    *   Dentro da `MatchesPage`, cada carta (seja nos Top Links ou nos carrosséis de categoria) geralmente possui um ícone de chama (🔥).
    *   **Para adicionar aos Top Links:** Clique no ícone de chama de uma carta que está nos carrosséis de categoria. Ele ficará mais destacado, e a carta será movida para a seção "Top Links".
    *   **Para remover dos Top Links:** Clique no ícone de chama de uma carta que já está na seção "Top Links". Ele ficará menos destacado (ou apagado), e a carta retornará ao seu respectivo carrossel de categoria.
*   **Visualização:** Os Top Links são exibidos em uma grade (`matchesGrid`), facilitando a visualização rápida das suas principais escolhas.
*   **Bordas Progressivas:** Assim como nos carrosséis, a área dos "Top Links" também pode ter uma borda que se torna mais elaborada e temática (lembrando fogo) conforme o número de Top Links aumenta, indicando visualmente o quão "quente" está essa seção!

## Links por Categoria

As cartas que não foram marcadas como "Top Links" são organizadas em carrosséis, cada um representando uma categoria.

*   **Navegando pelos Carrosséis (`CategoryCarousel`):**
    *   Use as setas laterais ou deslize horizontalmente para ver todas as cartas dentro de uma categoria específica.
    *   O título da categoria é exibido acima de cada carrossel.
*   **Bordas Progressivas dos Carrosséis:**
    *   Você notará que a "moldura" ou célula (`carouselCell`) de cada carrossel de categoria possui um estilo de borda que muda.
    *   Essa borda se torna mais elaborada (com mais linhas, cores ou detalhes) conforme o número de cartas que vocês têm naquela categoria aumenta. É uma forma visual de celebrar seus interesses em comum!
        *   **Nível 0 (0-1 Link):** Fundo cinza, sem borda proeminente.
        *   **Nível 1 (2-4 Links):** Uma borda colorida simples.
        *   **Nível 2 (5-9 Links):** Duas bordas coloridas.
        *   **Nível 3 (10-14 Links):** Uma borda mais rebuscada.
        *   **Nível 4 (15+ Links):** Uma borda ainda mais elaborada.
    *   A cor da borda geralmente corresponde à cor tema da categoria.

## Indicadores de Mensagens Não Lidas

Para ajudar você a não perder nenhuma novidade nas conversas sobre seus Links:

*   **Ponto de Notificação:** Cartas que possuem novas mensagens não lidas no chat associado podem exibir um pequeno indicador visual (como um ponto colorido - `unreadIndicator`).
*   **Snippet da Última Mensagem:** Em alguns casos, um trecho da última mensagem não lida pode ser exibido diretamente no card do Link (`matchCardSnippet`), dando um gostinho do que espera por você no chat.

*(Opcional: Adicionar uma captura de tela da `MatchesPage` destacando a seção de Top Links, um carrossel de categoria com sua borda, e um card com indicador de não lido).*

Com seus Links organizados, o próximo passo é aprofundar a conexão. A seção "Conversando com seu Par" mostrará como usar o chat para discutir essas ideias e planejar seus próximos momentos juntos.
