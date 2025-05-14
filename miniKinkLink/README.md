# miniKinkLink - Protótipo

## Descrição

`miniKinkLink` é um protótipo simples de aplicativo web construído com HTML, CSS e JavaScript puro. Seu objetivo é testar e validar as mecânicas centrais de um sistema de descoberta de interesses mútuos entre um casal ("Usuário Quadrado 🔲" e "Usuário Bolinha ⚪"). A interação é baseada na apresentação individual de "cartas" de interesse, no estilo "Tinder", onde os usuários indicam se têm interesse ou não na carta apresentada.

Este protótipo utiliza o `localStorage` do navegador para persistir o estado do aplicativo, incluindo as cartas disponíveis, as seleções dos usuários, e o progresso de visualização das cartas.

## Funcionalidades Implementadas

* **Apresentação Individual de Cartas:** As cartas de interesse são mostradas uma por vez.
* **Interação "Quero" / "Não Quero":** Usuários interagem com cada carta através de botões.
* **Dois Usuários Fixos:** Simula a experiência para um casal pré-definido.
* **Troca de Usuário:** Permite alternar entre os dois usuários para simular a interação de ambos.
* **Criação Dinâmica de Cartas:** Usuários podem adicionar novas cartas ao sistema (com descrição, categoria e intensidade).
* **"Like" Automático:** A carta criada é automaticamente "curtida" pelo usuário que a criou.
* **Prioridade para Novas Cartas:** Cartas recém-criadas são exibidas logo em seguida.
* **Cálculo de Matches:** O sistema identifica e exibe as cartas que foram "curtidas" por ambos os usuários.
* **Persistência Local:** Todo o estado do jogo é salvo no `localStorage` do navegador.
* **Conjunto Inicial de Cartas:** O protótipo inicia com um conjunto de aproximadamente 40 cartas.
* **Estilização por Categoria:** As cartas exibidas possuem cores de fundo/borda baseadas em sua categoria para melhor identificação visual.
* **Sorteio Aleatório:** As cartas são sorteadas aleatoriamente dentre as ainda não vistas.
* **Reset de Cartas Vistas:** Um botão de debug permite limpar o histórico de cartas já sorteadas.

## Tech Stack

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* `localStorage` API do Navegador

## Estrutura de Arquivos

miniKinkLink/
├── index.html       # Estrutura principal da página
├── style.css        # Estilos visuais
└── script.js        # Lógica do aplicativo


## Como Executar

1.  Certifique-se de que os arquivos `index.html`, `style.css`, e `script.js` estão todos na mesma pasta (idealmente chamada `miniKinkLink`).
2.  Abra o arquivo `index.html` em qualquer navegador web moderno (Chrome, Firefox, Edge, Safari, etc.).

## Como Usar

1.  **Usuário Atual:** A página indicará qual usuário está ativo ("Usuário Quadrado 🔲" ou "Usuário Bolinha ⚪").
2.  **Trocar Usuário:** Clique no botão "Trocar Usuário" para alternar entre os dois.
3.  **Interagir com Cartas:**
    * Uma carta será exibida na área "Carta Atual".
    * Clique em "Quero" se o usuário atual tem interesse na carta.
    * Clique em "Não Quero" se o usuário atual não tem interesse.
    * Após a interação, uma nova carta será sorteada e exibida.
4.  **Criar Novas Cartas:**
    * Preencha a descrição, selecione uma categoria e defina a intensidade na seção "Criar Nova Carta".
    * Clique em "Criar Carta". A nova carta será adicionada ao baralho, "curtida" automaticamente por você e exibida em seguida.
5.  **Ver Matches:** Os interesses em comum (cartas curtidas por ambos os usuários) serão listados na seção "Interesses em Comum (Matches)".
6.  **Resetar Cartas Vistas (Debug):** Se quiser ver todas as cartas novamente desde o início (como se nenhuma tivesse sido sorteada ainda), clique no botão "Resetar Cartas Vistas". As seleções ("likes") não são afetadas por este reset.

## Dados Iniciais e `localStorage`

* O arquivo `script.js` contém uma variável `cartasIniciaisPadrao` com um conjunto de aproximadamente 40 cartas. Você pode editar esta lista para adicionar/remover/modificar as cartas iniciais.
* O aplicativo salva o seguinte no `localStorage` do seu navegador:
    * `miniKinkLink_idUsuarioAtual`: ID do último usuário ativo.
    * `miniKinkLink_todosOsInteresses`: A lista completa de todas as cartas (iniciais + criadas).
    * `miniKinkLink_selecoesQuadrado`: IDs das cartas curtidas pelo Usuário Quadrado.
    * `miniKinkLink_selecoesBolinha`: IDs das cartas curtidas pelo Usuário Bolinha.
    * `miniKinkLink_indicesJaSorteados`: Índices das cartas que já foram sorteadas e exibidas.
* Para limpar completamente os dados e recomeçar do zero, você pode limpar o `localStorage` do seu navegador para este site (geralmente através das ferramentas de desenvolvedor do navegador).

## Notas

Este é um protótipo simplificado para testar conceitos de jogabilidade. Ele não possui backend, funcionalidades de conta de usuário online ou medidas de segurança robustas, pois todos os dados são locais.