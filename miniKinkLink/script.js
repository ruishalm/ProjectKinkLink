document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DA TELA (DOM) ---
    const nomeUsuarioAtualEl = document.getElementById('nomeUsuarioAtual');
    const botaoTrocarUsuarioEl = document.getElementById('botaoTrocarUsuario');

    const containerCartaUnicaEl = document.getElementById('containerCartaUnica'); // O div que receberá a classe de categoria
    const areaCartaUnicaEl = document.getElementById('areaCartaUnica'); // O div interno para o conteúdo da carta
    const semCartasMsgEl = document.getElementById('semCartasMsg');
    const botaoNaoQueroEl = document.getElementById('botaoNaoQuero');
    const botaoQueroEl = document.getElementById('botaoQuero');

    const inputNovaCartaDescricaoEl = document.getElementById('inputNovaCartaDescricao');
    const selectNovaCartaCategoriaEl = document.getElementById('selectNovaCartaCategoria');
    const inputNovaCartaIntensidadeEl = document.getElementById('inputNovaCartaIntensidade');
    const botaoCriarCartaEl = document.getElementById('botaoCriarCarta');

    const listaInteressesEmComumEl = document.getElementById('listaInteressesEmComum');
    const semMatchesMsgEl = document.getElementById('semMatchesMsg');

    const botaoResetarVistasEl = document.getElementById('botaoResetarVistas');

    // --- DADOS E ESTADO DO APP ---
    const usuarioQuadrado = { id: 'quadrado', name: 'Usuário Quadrado 🔲' };
    const usuarioBolinha = { id: 'bolinha', name: 'Usuário Bolinha ⚪' };

    const cartasIniciaisPadrao = [
      // Sensorial (10 cartas)
      { id: 'c1', description: 'Usar venda nos olhos', category: 'sensorial', intensity: 1 },
      { id: 'c2', description: 'Tocar com penas ou tecidos macios', category: 'sensorial', intensity: 1 },
      { id: 'c3', description: 'Fazer uma massagem sensual um no outro', category: 'sensorial', intensity: 1 },
      { id: 'c4', description: 'Beijos molhados no pescoço e orelhas', category: 'sensorial', intensity: 1 },
      { id: 'c5', description: 'Sexo com óleo ou lubrificante aromático', category: 'sensorial', intensity: 2 },
      { id: 'c6', description: 'Brincadeiras com temperatura (gelo/quente)', category: 'sensorial', intensity: 2 },
      { id: 'c7', description: 'Mordidas leves e chupões em lugares variados', category: 'sensorial', intensity: 2 },
      { id: 'c8', description: 'Usar um vibrador pequeno em zonas erógenas', category: 'sensorial', intensity: 2 },
      { id: 'c9', description: 'Brincadeiras com tecidos ásperos ou couro', category: 'sensorial', intensity: 3 },
      { id: 'c10', description: 'Sexo oral focado apenas no prazer de quem recebe', category: 'sensorial', intensity: 3 },

      // Poder (10 cartas)
      { id: 'c11', description: 'Deixar parceiro escolher posição', category: 'poder', intensity: 1 },
      { id: 'c12', description: 'Um decide o que o outro vai vestir para um encontro (dentro dos limites)', category: 'poder', intensity: 1 },
      { id: 'c13', description: 'Obedecer a um comando simples durante o dia (ex: trazer um café)', category: 'poder', intensity: 1 },
      { id: 'c14', description: 'Sussurrar ordens ou desejos no ouvido do parceiro durante o sexo', category: 'poder', intensity: 1 },
      { id: 'c15', description: 'Usar palavras de comando (brincadeira leve)', category: 'poder', intensity: 2 },
      { id: 'c16', description: 'Um parceiro serve o outro (ex: um jantar, uma bebida) de forma submissa', category: 'poder', intensity: 2 },
      { id: 'c17', description: 'Vendar o parceiro e guiá-lo pela casa apenas com comandos de voz', category: 'poder', intensity: 2 },
      { id: 'c18', description: 'Ser imobilizado com panos ou mãos', category: 'poder', intensity: 3 },
      { id: 'c19', description: 'Um parceiro tem controle total do ritmo e profundidade da penetração', category: 'poder', intensity: 3 },
      { id: 'c20', description: 'Dar tapas leves no bumbum', category: 'poder', intensity: 3 },

      // Fantasia (10 cartas)
      { id: 'c21', description: 'Fantasiar cenários eróticos durante o sexo', category: 'fantasia', intensity: 1 },
      { id: 'c22', description: 'Contar uma fantasia sexual um para o outro em detalhes', category: 'fantasia', intensity: 1 },
      { id: 'c23', description: 'Assistir a um filme erótico leve juntos e discutir o que gostaram', category: 'fantasia', intensity: 1 },
      { id: 'c24', description: 'Criar um cenário romântico e sensual em casa (velas, música)', category: 'fantasia', intensity: 1 },
      { id: 'c25', description: 'Usar fantasia (roupa) temática', category: 'fantasia', intensity: 2 },
      { id: 'c26', description: 'Roleplay: Aluno(a) e Professor(a) (cenário sensual, não explícito)', category: 'fantasia', intensity: 2 },
      { id: 'c27', description: 'Roleplay: Médico(a) e Paciente (exame sensual)', category: 'fantasia', intensity: 2 },
      { id: 'c28', description: 'Recriar uma cena de filme romântico/erótico que ambos gostem', category: 'fantasia', intensity: 2 },
      { id: 'c29', description: 'Criar personagem e encenar', category: 'fantasia', intensity: 3 },
      { id: 'c30', description: 'Roleplay: Estranhos se encontrando em um bar e seduzindo um ao outro', category: 'fantasia', intensity: 3 },

      // Exposição (10 cartas)
      { id: 'c31', description: 'Contar uma fantasia íntima para o parceiro', category: 'exposicao', intensity: 1 },
      { id: 'c32', description: 'Usar lingerie provocante sob a roupa comum, faca questao de que seu parceiro veja', category: 'exposicao', intensity: 1 },
      { id: 'c33', description: 'Fazer striptease apenas para o parceiro', category: 'exposicao', intensity: 1 },
      { id: 'c34', description: 'Deixar a porta do banheiro entreaberta enquanto toma banho', category: 'exposicao', intensity: 1 },
      { id: 'c35', description: 'Enviar foto sensual (vestido) para terceiro', category: 'exposicao', intensity: 2 }, // Atenção a esta carta, pode requerer mais discussão sobre limites
      { id: 'c36', description: 'Andar pela casa apenas de lingerie ou nu na frente do parceiro', category: 'exposicao', intensity: 2 },
      { id: 'c37', description: 'Fazer sexo com as luzes totalmente acesas', category: 'exposicao', intensity: 2 },
      { id: 'c38', description: 'Deixar o parceiro observar você se masturbar', category: 'exposicao', intensity: 2 },
      { id: 'c39', description: 'Fazer sexo em um local semi-público com baixo risco de ser pego (varanda)', category: 'exposicao', intensity: 3 },
      { id: 'c40', description: 'Ser observado por um terceiro com consentimento de ambos', category: 'exposicao', intensity: 3 } // Atenção a esta carta
    ];


    let idUsuarioAtual;
    let todosOsInteresses = [];
    let selecoesQuadrado = [];
    let selecoesBolinha = [];
    let indicesJaSorteadosGlobalmente = [];
    let cartaAtualVisivel = null;

    // --- FUNÇÕES DE INICIALIZAÇÃO E PERSISTÊNCIA ---
    function salvarNoLocalStorage(chave, valor) {
        localStorage.setItem(chave, JSON.stringify(valor));
    }

    function carregarDoLocalStorage(chave, valorPadrao = null) {
        const valorSalvo = localStorage.getItem(chave);
        if (valorSalvo !== null) {
            try {
                return JSON.parse(valorSalvo);
            } catch (e) {
                console.error("Erro ao parsear JSON do localStorage para a chave:", chave, e);
                return valorPadrao; // Retorna padrão em caso de erro de parse
            }
        }
        return valorPadrao;
    }

    function iniciarApp() {
        idUsuarioAtual = carregarDoLocalStorage('miniKinkLink_idUsuarioAtual', usuarioQuadrado.id);
        
        const cartasSalvas = carregarDoLocalStorage('miniKinkLink_todosOsInteresses');
        if (cartasSalvas && cartasSalvas.length > 0) {
            todosOsInteresses = cartasSalvas;
        } else {
            todosOsInteresses = JSON.parse(JSON.stringify(cartasIniciaisPadrao)); // Cópia profunda para não alterar o original
            salvarNoLocalStorage('miniKinkLink_todosOsInteresses', todosOsInteresses);
        }

        selecoesQuadrado = carregarDoLocalStorage('miniKinkLink_selecoesQuadrado', []);
        selecoesBolinha = carregarDoLocalStorage('miniKinkLink_selecoesBolinha', []);
        indicesJaSorteadosGlobalmente = carregarDoLocalStorage('miniKinkLink_indicesJaSorteados', []);

        configurarOuvintes();
        desenharInfoUsuario();
        puxarProximaCartaAleatoria();
        desenharInteressesEmComum();
    }

    function configurarOuvintes() {
        botaoTrocarUsuarioEl.addEventListener('click', trocarUsuario);
        botaoQueroEl.addEventListener('click', () => registrarInteracao(true));
        botaoNaoQueroEl.addEventListener('click', () => registrarInteracao(false));
        botaoCriarCartaEl.addEventListener('click', criarNovaCarta);
        botaoResetarVistasEl.addEventListener('click', resetarCartasVistas);
    }

    // --- FUNÇÕES DE LÓGICA DO APP ---
    function desenharInfoUsuario() {
        nomeUsuarioAtualEl.textContent = (idUsuarioAtual === usuarioQuadrado.id) ? usuarioQuadrado.name : usuarioBolinha.name;
    }

    function puxarProximaCartaAleatoria(cartaParaPriorizar = null) {
        cartaAtualVisivel = null;
        
        // Limpa classes de categoria anteriores do container principal da carta
        containerCartaUnicaEl.className = 'container-carta-individual'; // Reseta para a classe base

        if (cartaParaPriorizar) {
            cartaAtualVisivel = cartaParaPriorizar;
            const indexPrioritario = todosOsInteresses.findIndex(c => c.id === cartaParaPriorizar.id);
            if (indexPrioritario !== -1 && !indicesJaSorteadosGlobalmente.includes(indexPrioritario)) {
                indicesJaSorteadosGlobalmente.push(indexPrioritario);
            }
        } else {
            const indicesDisponiveis = todosOsInteresses
                .map((_, index) => index)
                .filter(index => !indicesJaSorteadosGlobalmente.includes(index));

            if (indicesDisponiveis.length === 0) {
                // semCartasMsgEl já é tratado em desenharCartaAtual
            } else {
                const indiceSorteadoAleatorio = indicesDisponiveis[Math.floor(Math.random() * indicesDisponiveis.length)];
                cartaAtualVisivel = todosOsInteresses[indiceSorteadoAleatorio];
                indicesJaSorteadosGlobalmente.push(indiceSorteadoAleatorio);
            }
        }

        salvarNoLocalStorage('miniKinkLink_indicesJaSorteados', indicesJaSorteadosGlobalmente);
        desenharCartaAtual();
    }

    function desenharCartaAtual() {
        areaCartaUnicaEl.innerHTML = ''; // Limpa conteúdo interno da carta
        // A classe de categoria será adicionada ao containerCartaUnicaEl
        containerCartaUnicaEl.className = 'container-carta-individual'; // Reseta para classe base

        if (cartaAtualVisivel) {
            semCartasMsgEl.style.display = 'none';

            // Adiciona a classe de categoria ao container da carta
            if (cartaAtualVisivel.category) {
                containerCartaUnicaEl.classList.add('carta-' + cartaAtualVisivel.category.toLowerCase());
            }

            const descEl = document.createElement('p');
            descEl.textContent = cartaAtualVisivel.description;
            descEl.className = 'descricao-carta';

            const catEl = document.createElement('p');
            catEl.textContent = `Categoria: ${cartaAtualVisivel.category}`;
            catEl.className = 'categoria-carta';

            const intEl = document.createElement('p');
            intEl.textContent = `Intensidade: ${cartaAtualVisivel.intensity}`;
            intEl.className = 'intensidade-carta';

            areaCartaUnicaEl.appendChild(descEl);
            areaCartaUnicaEl.appendChild(catEl);
            areaCartaUnicaEl.appendChild(intEl);
            
            botaoQueroEl.disabled = false;
            botaoNaoQueroEl.disabled = false;
        } else {
             semCartasMsgEl.style.display = 'block';
             botaoQueroEl.disabled = true;
             botaoNaoQueroEl.disabled = true;
        }
    }

    function registrarInteracao(foiLike) {
        if (!cartaAtualVisivel) return;

        if (foiLike) {
            const selecoesAtuais = (idUsuarioAtual === usuarioQuadrado.id) ? selecoesQuadrado : selecoesBolinha;
            if (!selecoesAtuais.includes(cartaAtualVisivel.id)) {
                selecoesAtuais.push(cartaAtualVisivel.id);
            }
            if (idUsuarioAtual === usuarioQuadrado.id) {
                salvarNoLocalStorage('miniKinkLink_selecoesQuadrado', selecoesQuadrado);
            } else {
                salvarNoLocalStorage('miniKinkLink_selecoesBolinha', selecoesBolinha);
            }
            desenharInteressesEmComum();
        }
        puxarProximaCartaAleatoria();
    }

    function criarNovaCarta() {
        const descricao = inputNovaCartaDescricaoEl.value.trim();
        const categoria = selectNovaCartaCategoriaEl.value;
        const intensidade = parseInt(inputNovaCartaIntensidadeEl.value) || 1;

        if (!descricao) {
            alert('A descrição da carta não pode ser vazia!');
            return;
        }

        const novaCarta = {
            id: 'user_' + new Date().getTime(),
            description: descricao,
            category: categoria,
            intensity: intensidade
        };

        todosOsInteresses.push(novaCarta);
        salvarNoLocalStorage('miniKinkLink_todosOsInteresses', todosOsInteresses);

        const selecoesDoCriador = (idUsuarioAtual === usuarioQuadrado.id) ? selecoesQuadrado : selecoesBolinha;
        if (!selecoesDoCriador.includes(novaCarta.id)) {
            selecoesDoCriador.push(novaCarta.id);
        }
        if (idUsuarioAtual === usuarioQuadrado.id) {
            salvarNoLocalStorage('miniKinkLink_selecoesQuadrado', selecoesQuadrado);
        } else {
            salvarNoLocalStorage('miniKinkLink_selecoesBolinha', selecoesBolinha);
        }
        
        desenharInteressesEmComum();

        inputNovaCartaDescricaoEl.value = '';
        inputNovaCartaIntensidadeEl.value = '1';
        selectNovaCartaCategoriaEl.value = 'sensorial'; // Reseta para o primeiro valor

        puxarProximaCartaAleatoria(novaCarta);
        alert('Nova carta criada, adicionada à sua lista de likes e será a próxima a ser exibida!');
    }

    function trocarUsuario() {
        idUsuarioAtual = (idUsuarioAtual === usuarioQuadrado.id) ? usuarioBolinha.id : usuarioQuadrado.id;
        salvarNoLocalStorage('miniKinkLink_idUsuarioAtual', idUsuarioAtual);
        desenharInfoUsuario();
        puxarProximaCartaAleatoria(); 
    }

    function desenharInteressesEmComum() {
        listaInteressesEmComumEl.innerHTML = '';
        semMatchesMsgEl.style.display = 'none';

        const matches = [];
        for (const idCarta of selecoesQuadrado) {
            if (selecoesBolinha.includes(idCarta)) {
                const cartaMatch = todosOsInteresses.find(carta => carta.id === idCarta);
                if (cartaMatch) {
                    matches.push(cartaMatch);
                }
            }
        }

        if (matches.length === 0) {
            semMatchesMsgEl.style.display = 'block';
        } else {
            matches.forEach(carta => {
                const li = document.createElement('li');
                li.textContent = `${carta.description} (Cat: ${carta.category}, Int: ${carta.intensity})`;
                listaInteressesEmComumEl.appendChild(li);
            });
        }
    }
    
    function resetarCartasVistas() {
        if (confirm("Tem certeza que deseja resetar o histórico de cartas vistas? Você começará a ver todas as cartas novamente (exceto se já tiverem sido 'curtidas' por ambos, o que não é afetado).")) {
            indicesJaSorteadosGlobalmente = [];
            salvarNoLocalStorage('miniKinkLink_indicesJaSorteados', indicesJaSorteadosGlobalmente);
            alert("Histórico de cartas vistas resetado!");
            puxarProximaCartaAleatoria();
        }
    }

    // --- INICIA O APP ---
    iniciarApp();
});