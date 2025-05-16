# miniKinkLink - Protótipo Final

## Descrição

`miniKinkLink` é um protótipo simples de aplicativo web construído com HTML, CSS e JavaScript puro. Seu objetivo é testar e validar as mecânicas centrais de um sistema de descoberta de interesses mútuos entre um casal ("Usuário Quadrado 🔲" e "Usuário Bolinha ⚪"). A interação é baseada na apresentação individual de "cartas" de interesse, no estilo "Tinder", onde os usuários indicam se têm interesse ("Topo!") ou não ("Não Topo") na carta apresentada.

Este protótipo utiliza o `localStorage` do navegador para persistir o estado do aplicativo, incluindo as cartas disponíveis, as seleções dos usuários, e o progresso de interação de cada usuário com as cartas.

## Funcionalidades Implementadas

* **Apresentação Individual de Cartas:** Cartas de interesse são mostradas uma por vez, com visual estilizado de carta de baralho (cor de fundo baseada na categoria, intensidade e nome da categoria nos cantos).
* **Interação "Topo!" / "Não Topo":** Usuários interagem com cada carta através de botões. A carta possui animação de deslize ao ser descartada.
* **Controles via Teclado:** Setas Esquerda e Direita podem ser usadas para "Não Topo" e "Topo!", respectivamente.
* **Dois Usuários Fixos:** Simula a experiência para um casal pré-definido.
* **Troca de Usuário:** Permite alternar entre os dois usuários. O fundo da página muda suavemente de cor (Verde para Quadrado, Amarelo para Bolinha) para indicar o usuário ativo.
* **Criação Dinâmica de Cartas:** Usuários podem adicionar novas cartas ao sistema (com descrição, categoria e intensidade).
* **"Like" Automático e Rejeição:** A carta criada é automaticamente "curtida" pelo usuário que a criou. Se o criador posteriormente rejeitar sua própria carta, o "like" é removido.
* **Prioridade para Cartas Criadas:** Uma carta recém-criada por um usuário é priorizada para exibição para o *outro* usuário. O criador recebe uma carta aleatória normal em seguida.
* **Alerta de Match:** Um alerta (`alert()`) é exibido quando um "Topo!" de um usuário resulta em um novo match.
* **Cálculo de Matches:** O sistema identifica e exibe as cartas que foram "curtidas" por ambos os usuários na lista "Interesses em Comum".
* **Persistência Local:** Todo o estado do jogo é salvo no `localStorage`.
* **Conjunto Inicial de Cartas:** O protótipo inicia com um conjunto de 40 cartas pré-definidas.
* **Sorteio Aleatório por Usuário:** Cada usuário recebe cartas aleatoriamente do conjunto de cartas com as quais ainda não interagiu. O histórico de interação é individual.
* **Reset Completo do Aplicativo:** Um botão permite limpar todo o progresso (interações, likes, cartas criadas, matches, etc.), restaurando o app ao seu estado inicial com as cartas padrão.

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

1.  **Usuário Atual:** A página indicará qual usuário está ativo e o fundo da página terá uma cor sutil correspondente.
2.  **Trocar Usuário:** Clique no botão "Trocar Usuário" para alternar.
3.  **Interagir com Cartas:**
    * Uma carta será exibida.
    * Clique em "Topo!" ou pressione a Seta Direita ➡️ se o usuário atual tem interesse.
    * Clique em "Não Topo" ou pressione a Seta Esquerda ⬅️ se não tem interesse.
    * A carta animará para fora e uma nova será sorteada.
4.  **Criar Novas Cartas:**
    * Preencha a descrição, selecione uma categoria e defina a intensidade.
    * Clique em "Criar Carta". A carta será adicionada, "curtida" por você, e priorizada para seu parceiro. Você verá uma carta aleatória em seguida.
5.  **Ver Matches:** Se ambos os usuários derem "Topo!" na mesma carta, um alerta de match aparecerá, e a carta será listada em "Interesses em Comum".
6.  **Resetar Aplicativo:** O botão "Resetar Histórico de Interações" (ou nome similar) agora limpa *todo* o progresso, incluindo likes, cartas criadas e matches, retornando o app ao estado inicial.

## Dados Iniciais e `localStorage`

* O arquivo `script.js` contém a variável `cartasIniciaisPadrao` com 40 cartas.
* O aplicativo salva os seguintes dados no `localStorage`:
    * `miniKinkLink_idUsuarioAtual`: ID do último usuário ativo.
    * `miniKinkLink_todosOsInteresses`: Lista completa de todas as cartas.
    * `miniKinkLink_selecoesQuadrado`: IDs das cartas curtidas pelo Usuário Quadrado.
    * `miniKinkLink_selecoesBolinha`: IDs das cartas curtidas pelo Usuário Bolinha.
    * `miniKinkLink_interacoesQuadrado`: IDs das cartas interagidas pelo Usuário Quadrado.
    * `miniKinkLink_interacoesBolinha`: IDs das cartas interagidas pelo Usuário Bolinha.
    * `miniKinkLink_cartaPrioritariaOutro`: Informação da carta criada para ser priorizada para o outro usuário.
    * `miniKinkLink_matchesAnunciados`: IDs de matches já anunciados.
* Para limpar completamente os dados e recomeçar do zero (se o botão de reset não for usado), você pode limpar o `localStorage` do seu navegador para este site (via ferramentas de desenvolvedor).

## Notas

Este é um protótipo para testar conceitos. Não possui backend ou funcionalidades de conta online.