document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DA TELA (DOM) ---
    const nomeUsuarioAtualEl = document.getElementById('nomeUsuarioAtual');
    const botaoTrocarUsuarioEl = document.getElementById('botaoTrocarUsuario');

    const containerCartaUnicaEl = document.getElementById('containerCartaUnica');
    const areaCartaUnicaEl = document.getElementById('areaCartaUnica');
    const semCartasMsgEl = document.getElementById('semCartasMsg');
    const botaoNaoQueroEl = document.getElementById('botaoNaoQuero');
    const botaoQueroEl = document.getElementById('botaoQuero');

    const inputNovaCartaDescricaoEl = document.getElementById('inputNovaCartaDescricao');
    const selectNovaCartaCategoriaEl = document.getElementById('selectNovaCartaCategoria');
    const inputNovaCartaIntensidadeEl = document.getElementById('inputNovaCartaIntensidade');
    const botaoCriarCartaEl = document.getElementById('botaoCriarCarta');

    const listaInteressesEmComumEl = document.getElementById('listaInteressesEmComum');
    const semMatchesMsgEl = document.getElementById('semMatchesMsg');

    const botaoResetarAppEl = document.getElementById('botaoResetarApp'); // ID atualizado no HTML

    // Elementos do Modal do Chat
    const modalChatOverlayEl = document.getElementById('modalChatOverlay');
    const modalChatConteudoEl = document.getElementById('modalChatConteudo');
    const botaoFecharModalChatEl = document.getElementById('botaoFecharModalChat');
    const modalChatIntensidadeEl = document.getElementById('modalChatIntensidade');
    const modalChatNaipeEl = document.getElementById('modalChatNaipe');
    const modalChatTituloCartaEl = document.getElementById('modalChatTituloCarta');
    const chatMensagensAreaEl = document.getElementById('chatMensagensArea');
    const inputMensagemChatEl = document.getElementById('inputMensagemChat');
    const botaoEnviarMensagemChatEl = document.getElementById('botaoEnviarMensagemChat');

    // --- DADOS E ESTADO DO APP ---
    const usuarioQuadrado = { id: 'quadrado', name: 'Usuário Quadrado 🔲' };
    const usuarioBolinha = { id: 'bolinha', name: 'Usuário Bolinha ⚪' };

    const cartasIniciaisPadrao = [
      // Sensorial (10 cartas)
      { id: 'c1', description: 'Usar venda nos olhos', category: 'sensorial', intensity: 1 },
      { id: 'c2', description: 'Usar brinquedos sexuais na hora H', category: 'sensorial', intensity: 1 },
      { id: 'c3', description: 'Fazer uma massagem com um final feliz', category: 'sensorial', intensity: 1 },
      { id: 'c4', description: 'Usar gelo pelo corpo do parceiro', category: 'sensorial', intensity: 1 },
      { id: 'c5', description: 'Sexo oral com caldas de frutas e/ou mel no parceiro', category: 'sensorial', intensity: 2 },
      { id: 'c6', description: 'Sexo dentro duma piscina', category: 'sensorial', intensity: 2 },
      { id: 'c7', description: 'Mordidas leves e chupões em lugares variados', category: 'sensorial', intensity: 2 },
      { id: 'c8', description: 'O parceiro usar um vibrador em você', category: 'sensorial', intensity: 2 },
      { id: 'c9', description: 'Sexo enebriado (uso leve de alcool ou outros)', category: 'sensorial', intensity: 3 },
      { id: 'c10', description: 'Enquanto usando venda, outra pessoa tocar seu corpo', category: 'sensorial', intensity: 3 },
      // Poder (10 cartas)
      { id: 'c11', description: 'Deixar parceiro escolher posição', category: 'poder', intensity: 1 },
      { id: 'c12', description: 'Um decide o que o outro vai vestir para um encontro (dentro dos limites)', category: 'poder', intensity: 1 },
      { id: 'c13', description: 'Obedecer a um comando simples imediatamente', category: 'poder', intensity: 2 },
      { id: 'c14', description: 'Sussurrar ordens ou desejos no ouvido do parceiro durante o sexo', category: 'poder', intensity: 2 },
      { id: 'c15', description: 'Usar palavras de comando', category: 'poder', intensity: 3 },
      { id: 'c16', description: 'Um parceiro serve o outro (ex: um jantar, uma bebida, e alem) de forma submissa', category: 'poder', intensity: 3 },
      { id: 'c17', description: 'Vendar o parceiro e guiá-lo com ordens no sexo', category: 'poder', intensity: 3 },
      { id: 'c18', description: 'Ser imobilizado pelo pareiro e se submeter', category: 'poder', intensity: 3 },
      { id: 'c19', description: 'Servir de forma obediente ao parceiro e mais um convidado', category: 'poder', intensity: 4 },
      { id: 'c20', description: 'Spanking: Tapas na bunda', category: 'poder', intensity: 3 },
      // Fantasia (10 cartas)
      { id: 'c21', description: 'Fantasiar cenários eróticos durante o sexo', category: 'fantasia', intensity: 1 },
      { id: 'c22', description: 'Contar uma fantasia sexual um para o outro em detalhes enquanto toca o parceiro', category: 'fantasia', intensity: 1 },
      { id: 'c23', description: 'Assistir a um filme porno juntos e discutir o que gostaram', category: 'fantasia', intensity: 1 },
      { id: 'c24', description: 'Criar um cenário em casa (velas, objetos, música)', category: 'fantasia', intensity: 2 },
      { id: 'c25', description: 'Usar fantasia (roupa) temática', category: 'fantasia', intensity: 2 },
      { id: 'c26', description: 'Roleplay: Mestre e estudante ', category: 'fantasia', intensity: 2 },
      { id: 'c27', description: 'Roleplay: Médico(a) e Paciente (exame intimo)', category: 'fantasia', intensity: 3 },
      { id: 'c28', description: 'Roleplay: Ataque simulado', category: 'fantasia', intensity: 4 },
      { id: 'c29', description: 'Roleplay: dois amigos dividindo alguemm', category: 'fantasia', intensity: 5 },
      { id: 'c30', description: 'Roleplay: Estranhos se encontrando em um bar e convencendoo outro ali mesmo', category: 'fantasia', intensity: 3 },
      // Exposição (10 cartas)
      { id: 'c31', description: 'Gravar um video íntimo para o parceiro', category: 'exposicao', intensity: 1 },
      { id: 'c32', description: 'Não usar nad apor baixo, faça questao de que seu parceiro veja', category: 'exposicao', intensity: 1 },
      { id: 'c33', description: 'Fazer striptease para o parceiro', category: 'exposicao', intensity: 1 },
      { id: 'c34', description: 'Deixar a porta do banheiro entreaberta enquanto toma banho com visita em casa', category: 'exposicao', intensity: 3 },
      { id: 'c35', description: 'Enviar foto sensual/semi-nude para terceiro', category: 'exposicao', intensity: 2 },
      { id: 'c36', description: 'Andar pela casa apenas de lingerie ou de toalha com terceiros na casa', category: 'exposicao', intensity: 2 },
      { id: 'c37', description: 'Filmar um ato sexual seu mascarados e postar anonimamente', category: 'exposicao', intensity: 4 },
      { id: 'c38', description: 'Deixar o parceiro observar você se masturbar', category: 'exposicao', intensity: 2 },
      { id: 'c39', description: 'Fazer sexo em um local semi-público com baixo risco de ser pego', category: 'exposicao', intensity: 3 },
      { id: 'c40', description: 'Ser exibido pelo parceiro em sites de cameras roletas', category: 'exposicao', intensity: 4 },
      { id: 'c41', description: 'Masturba-se no carro em Auto estrada - Plateia rotativa', category: 'exposicao', intensity: 4 },
      { id: 'c42', description: 'Pedir informações com roupas largas quase a mostra', category: 'exposicao', intensity: 2 },
      { id: 'c43', description: 'Receber um delivery somente de toalha ou lingerie', category: 'exposicao', intensity: 3 },
      { id: 'c44', description: 'Receber um delivery somente de toalha e acientalmente derrubar a toalha toda ou aprialmente', category: 'exposicao', intensity: 4 },
      { id: 'c45', description: 'Compartilhar um print com terceiros onde "acidentalmente" aparece uma foto nua no rolo de imagens', category: 'exposicao', intensity: 2 },
      { id: 'c46', description: 'Entregar seu celular para alguem ver uma foto qualquer. as fotos antes e depois daquela exibida devem ser fotos sensuais/sexuais', category: 'exposicao', intensity: 3 },
      { id: 'c47', description: 'Fazer sexo no carro em uma area de Voyurs', category: 'exposicao', intensity: 3 },
      { id: 'c48', description: 'Beijar e lamber os pes do parceiro em submissão durante o ato', category: 'poder', intensity: 3 },
      { id: 'c49', description: 'Spankin: tapas na cara durante ato ou masturbacao', category: 'poder', intensity: 3 },
      { id: 'c50', description: 'Roleplay: nada dito! No chat dessa carta marquem algo difernete, acertem e marquem tudo pelo chat. nenhuma palavra sobre pessoalemtne', category: 'fantasia', intensity: 3 },
      { id: 'c51', description: 'Roleplay: Prostituição de rua: "contrate" os serviços do parceiro numa esquina.', category: 'fantasia', intensity: 4 },
      { id: 'c52', description: 'Dar banho no parceiro de forma submissiva', category: 'poder', intensity: 2 },
      { id: 'c53', description: 'Dar banho no parceiro de forma dominante', category: 'poder', intensity: 2 },
      { id: 'c54', description: 'Usar preservativos texturizados', category: 'sensorial', intensity: 1 },
      { id: 'c55', description: 'Masturbaçãoem lugar exposto(mas seguro) usando uma venda. Parceiro fica de guarda', category: 'exposicao', intensity: 3 },
      { id: 'c56', description: 'Sair em casal com  roupa chamativa, sem nada por baixo', category: 'exposicao', intensity: 3 },
      { id: 'c57', description: 'Roupa curta sem nada por baixo. deixeque alguem note', category: 'exposicao', intensity: 3 },
      { id: 'c58', description: 'Exposição leve (seios ou similar) em local sabidamente filmado', category: 'exposicao', intensity: 3 },
      { id: 'c59', description: 'Expocição leve para o parceiro em local movimentado', category: 'exposicao', intensity: 2 },
      { id: 'c60', description: 'Usar um vibrador sem fio em publico, parceiro controla', category: 'poder', intensity: 3 },
      { id: 'c61', description: 'Usar um vibrador sem fio em publico, um terceiro cntrola', category: 'exposicao', intensity: 4 }
    ];

    let idUsuarioAtual;
    let todosOsInteresses = [];
    let selecoesQuadrado = [];
    let selecoesBolinha = [];
    let interacoesQuadrado = []; 
    let interacoesBolinha = [];  
    let cartaAtualVisivel = null;
    let interagindoComCarta = false;
    let cartaPrioritariaParaOutroUsuario = null; 
    let idsMatchesAnunciados = [];
    let todosOsChats = {}; // Nova variável para os chats { 'cardId': [mensagens] }
    let chatAtualCardId = null; // Para saber qual chat está aberto no modal

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
                return valorPadrao;
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
            todosOsInteresses = JSON.parse(JSON.stringify(cartasIniciaisPadrao));
            salvarNoLocalStorage('miniKinkLink_todosOsInteresses', todosOsInteresses);
        }

        selecoesQuadrado = carregarDoLocalStorage('miniKinkLink_selecoesQuadrado', []);
        selecoesBolinha = carregarDoLocalStorage('miniKinkLink_selecoesBolinha', []);
        interacoesQuadrado = carregarDoLocalStorage('miniKinkLink_interacoesQuadrado', []);
        interacoesBolinha = carregarDoLocalStorage('miniKinkLink_interacoesBolinha', []);
        
        cartaPrioritariaParaOutroUsuario = carregarDoLocalStorage('miniKinkLink_cartaPrioritariaOutro', null);
        idsMatchesAnunciados = carregarDoLocalStorage('miniKinkLink_matchesAnunciados', []);
        todosOsChats = carregarDoLocalStorage('miniKinkLink_todosOsChats', {}); // Carrega chats

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
        if(botaoResetarAppEl) botaoResetarAppEl.addEventListener('click', resetarAplicativoCompletamente); // Verifique se o ID do botão de reset está correto
        document.addEventListener('keydown', lidarComTeclado);

        // Ouvintes do Modal do Chat
        botaoFecharModalChatEl.addEventListener('click', fecharModalChat);
        botaoEnviarMensagemChatEl.addEventListener('click', enviarMensagemDoModal);
        inputMensagemChatEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                enviarMensagemDoModal();
            }
        });
         // Fechar modal clicando no overlay
        modalChatOverlayEl.addEventListener('click', (event) => {
            if (event.target === modalChatOverlayEl) {
                fecharModalChat();
            }
        });
    }

    function desenharInfoUsuario() {
        const bodyEl = document.body;
        if (nomeUsuarioAtualEl) { 
            if (idUsuarioAtual === usuarioQuadrado.id) {
                nomeUsuarioAtualEl.textContent = usuarioQuadrado.name;
                bodyEl.classList.remove('fundo-usuario-bolinha');
                bodyEl.classList.add('fundo-usuario-quadrado');
            } else {
                nomeUsuarioAtualEl.textContent = usuarioBolinha.name;
                bodyEl.classList.remove('fundo-usuario-quadrado');
                bodyEl.classList.add('fundo-usuario-bolinha');
            }
        } else {
            console.error("Elemento nomeUsuarioAtualEl não encontrado no DOM.");
        }
    }

    function puxarProximaCartaAleatoria() {
        cartaAtualVisivel = null;
        interagindoComCarta = false;

        const interacoesDoUsuarioAtual = (idUsuarioAtual === usuarioQuadrado.id) ? interacoesQuadrado : interacoesBolinha;

        if (cartaPrioritariaParaOutroUsuario && cartaPrioritariaParaOutroUsuario.targetUserId === idUsuarioAtual) {
            const cartaEncontrada = todosOsInteresses.find(c => c.id === cartaPrioritariaParaOutroUsuario.cardId);
            if (cartaEncontrada && !interacoesDoUsuarioAtual.includes(cartaEncontrada.id)) { 
                cartaAtualVisivel = cartaEncontrada;
                cartaPrioritariaParaOutroUsuario = null; 
                salvarNoLocalStorage('miniKinkLink_cartaPrioritariaOutro', cartaPrioritariaParaOutroUsuario);
            } else {
                cartaPrioritariaParaOutroUsuario = null;
                salvarNoLocalStorage('miniKinkLink_cartaPrioritariaOutro', cartaPrioritariaParaOutroUsuario);
            }
        }
        
        if (!cartaAtualVisivel) {
            const cartasDisponiveisParaUsuario = todosOsInteresses.filter(
                carta => !interacoesDoUsuarioAtual.includes(carta.id)
            );

            if (cartasDisponiveisParaUsuario.length > 0) {
                const indiceSorteadoNaListaDisponivel = Math.floor(Math.random() * cartasDisponiveisParaUsuario.length);
                cartaAtualVisivel = cartasDisponiveisParaUsuario[indiceSorteadoNaListaDisponivel];
            } else {
                cartaAtualVisivel = null; 
            }
        }
        desenharCartaAtual();
    }

    function desenharCartaAtual() {
        const cantosAntigos = containerCartaUnicaEl.querySelectorAll('.carta-canto');
        cantosAntigos.forEach(canto => canto.remove());
        areaCartaUnicaEl.innerHTML = '';
        containerCartaUnicaEl.className = 'container-carta-individual'; 

        if (cartaAtualVisivel) {
            semCartasMsgEl.style.display = 'none';

            if (cartaAtualVisivel.category) {
                containerCartaUnicaEl.classList.add('carta-' + cartaAtualVisivel.category.toLowerCase());
            }

            const intensidadeElCanto = document.createElement('div');
            intensidadeElCanto.classList.add('carta-canto', 'canto-superior-esquerdo');
            intensidadeElCanto.textContent = cartaAtualVisivel.intensity;
            containerCartaUnicaEl.appendChild(intensidadeElCanto);

            const naipeElCanto = document.createElement('div');
            naipeElCanto.classList.add('carta-canto', 'canto-superior-direito');
            naipeElCanto.textContent = cartaAtualVisivel.category.charAt(0).toUpperCase() + cartaAtualVisivel.category.slice(1);
            containerCartaUnicaEl.appendChild(naipeElCanto);

            const descEl = document.createElement('p');
            descEl.textContent = cartaAtualVisivel.description;
            descEl.className = 'descricao-carta';

            const catTextEl = document.createElement('p');
            catTextEl.textContent = `Cat: ${cartaAtualVisivel.category}`;
            catTextEl.className = 'categoria-carta-texto';
            
            areaCartaUnicaEl.appendChild(descEl);
            areaCartaUnicaEl.appendChild(catTextEl);
            
            botaoQueroEl.disabled = false;
            botaoNaoQueroEl.disabled = false;
        } else {
             semCartasMsgEl.style.display = 'block';
             botaoQueroEl.disabled = true;
             botaoNaoQueroEl.disabled = true;
        }
    }

    function registrarInteracao(foiLike) {
        if (!cartaAtualVisivel || interagindoComCarta) return;
        interagindoComCarta = true;

        const interacoesAtuaisLista = (idUsuarioAtual === usuarioQuadrado.id) ? interacoesQuadrado : interacoesBolinha;
        if (!interacoesAtuaisLista.includes(cartaAtualVisivel.id)) {
            interacoesAtuaisLista.push(cartaAtualVisivel.id);
        }
        
        const selecoesAtuais = (idUsuarioAtual === usuarioQuadrado.id) ? selecoesQuadrado : selecoesBolinha;
        const indexNaSelecao = selecoesAtuais.indexOf(cartaAtualVisivel.id);

        if (foiLike) {
            containerCartaUnicaEl.classList.add('saindo-direita');
            if (indexNaSelecao === -1) { 
                selecoesAtuais.push(cartaAtualVisivel.id);
            }
        } else { 
            containerCartaUnicaEl.classList.add('saindo-esquerda');
            if (indexNaSelecao > -1) { 
                selecoesAtuais.splice(indexNaSelecao, 1);
            }
        }

        if (idUsuarioAtual === usuarioQuadrado.id) {
            salvarNoLocalStorage('miniKinkLink_interacoesQuadrado', interacoesQuadrado);
            salvarNoLocalStorage('miniKinkLink_selecoesQuadrado', selecoesQuadrado);
        } else {
            salvarNoLocalStorage('miniKinkLink_interacoesBolinha', interacoesBolinha);
            salvarNoLocalStorage('miniKinkLink_selecoesBolinha', selecoesBolinha);
        }
        
        if(foiLike) { 
            verificarEAlertarNovoMatch(cartaAtualVisivel);
        }
        desenharInteressesEmComum(); 

        setTimeout(() => {
            puxarProximaCartaAleatoria();
        }, 400);
    }
    
    function verificarEAlertarNovoMatch(cartaInteragida) {
        const sq = Array.isArray(selecoesQuadrado) ? selecoesQuadrado : [];
        const sb = Array.isArray(selecoesBolinha) ? selecoesBolinha : [];

        if (sq.includes(cartaInteragida.id) && sb.includes(cartaInteragida.id)) {
            if (!idsMatchesAnunciados.includes(cartaInteragida.id)) {
                setTimeout(() => {
                    alert(`✨ MATCH! ✨\n\nVocês dois curtiram:\n"${cartaInteragida.description}"`);
                }, 500); 
                idsMatchesAnunciados.push(cartaInteragida.id);
                salvarNoLocalStorage('miniKinkLink_matchesAnunciados', idsMatchesAnunciados);
            }
        }
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
        const interacoesDoCriador = (idUsuarioAtual === usuarioQuadrado.id) ? interacoesQuadrado : interacoesBolinha;

        if (!selecoesDoCriador.includes(novaCarta.id)) {
            selecoesDoCriador.push(novaCarta.id);
        }
        if (!interacoesDoCriador.includes(novaCarta.id)) { 
            interacoesDoCriador.push(novaCarta.id);
        }

        if (idUsuarioAtual === usuarioQuadrado.id) {
            salvarNoLocalStorage('miniKinkLink_selecoesQuadrado', selecoesQuadrado);
            salvarNoLocalStorage('miniKinkLink_interacoesQuadrado', interacoesQuadrado);
        } else {
            salvarNoLocalStorage('miniKinkLink_selecoesBolinha', selecoesBolinha);
            salvarNoLocalStorage('miniKinkLink_interacoesBolinha', interacoesBolinha);
        }
        
        desenharInteressesEmComum();

        cartaPrioritariaParaOutroUsuario = {
            cardId: novaCarta.id,
            targetUserId: (idUsuarioAtual === usuarioQuadrado.id) ? usuarioBolinha.id : usuarioQuadrado.id
        };
        salvarNoLocalStorage('miniKinkLink_cartaPrioritariaOutro', cartaPrioritariaParaOutroUsuario);
        
        inputNovaCartaDescricaoEl.value = '';
        inputNovaCartaIntensidadeEl.value = '1';
        selectNovaCartaCategoriaEl.value = 'sensorial';

        alert('Nova carta criada e adicionada aos seus likes! Seu parceiro a verá em breve.');
        puxarProximaCartaAleatoria();
    }

    function trocarUsuario() {
        if (interagindoComCarta) return;
        idUsuarioAtual = (idUsuarioAtual === usuarioQuadrado.id) ? usuarioBolinha.id : usuarioQuadrado.id;
        salvarNoLocalStorage('miniKinkLink_idUsuarioAtual', idUsuarioAtual);
        desenharInfoUsuario();
        puxarProximaCartaAleatoria(); 
    }

    function desenharInteressesEmComum() {
        listaInteressesEmComumEl.innerHTML = '';
        semMatchesMsgEl.style.display = 'none';

        const matches = [];
        const sq = Array.isArray(selecoesQuadrado) ? selecoesQuadrado : [];
        const sb = Array.isArray(selecoesBolinha) ? selecoesBolinha : [];

        for (const idCarta of sq) {
            if (sb.includes(idCarta)) {
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
                li.dataset.cardId = carta.id; // Adiciona o ID da carta para identificar o chat
                li.classList.add('match-item-clicavel'); // Classe para estilizar e identificar
                li.addEventListener('click', () => abrirModalChat(carta)); // Passa o objeto da carta
                listaInteressesEmComumEl.appendChild(li);
            });
        }
    }
    
    // --- FUNÇÕES DO CHAT ---
    function abrirModalChat(cartaDoMatch) {
        if (!cartaDoMatch) return;
        chatAtualCardId = cartaDoMatch.id;

        // Estiliza o modal como a carta
        modalChatConteudoEl.className = 'container-carta-individual modal-chat-carta'; // Reseta e adiciona classes base
        if (cartaDoMatch.category) {
            modalChatConteudoEl.classList.add('carta-' + cartaDoMatch.category.toLowerCase());
        }

        // Preenche cabeçalho do modal-carta
        modalChatIntensidadeEl.textContent = cartaDoMatch.intensity;
        modalChatNaipeEl.textContent = cartaDoMatch.category.charAt(0).toUpperCase() + cartaDoMatch.category.slice(1);
        modalChatTituloCartaEl.textContent = `Chat sobre: "${cartaDoMatch.description}"`;
        
        desenharMensagensNoModal(chatAtualCardId);
        modalChatOverlayEl.style.display = 'flex';
        inputMensagemChatEl.focus();
    }

    function fecharModalChat() {
        modalChatOverlayEl.style.display = 'none';
        chatAtualCardId = null;
    }

    function desenharMensagensNoModal(cardId) {
        chatMensagensAreaEl.innerHTML = '';
        const mensagens = todosOsChats[cardId] || [];

        mensagens.forEach(msg => {
            const divMensagem = document.createElement('div');
            divMensagem.classList.add('mensagem-chat');
            divMensagem.classList.add(msg.senderId === usuarioQuadrado.id ? 'mensagem-quadrado' : 'mensagem-bolinha');

            const remetenteSpan = document.createElement('span');
            remetenteSpan.className = 'remetente-chat';
            remetenteSpan.textContent = (msg.senderId === usuarioQuadrado.id ? usuarioQuadrado.name : usuarioBolinha.name) + ':';
            
            const textoSpan = document.createElement('span');
            textoSpan.className = 'texto-chat';
            textoSpan.textContent = msg.text;

            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'timestamp-chat';
            timestampSpan.textContent = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            divMensagem.appendChild(remetenteSpan);
            divMensagem.appendChild(textoSpan);
            divMensagem.appendChild(timestampSpan);
            chatMensagensAreaEl.appendChild(divMensagem);
        });
        // Scroll para a última mensagem
        chatMensagensAreaEl.scrollTop = chatMensagensAreaEl.scrollHeight;
    }

    function enviarMensagemDoModal() {
        const textoMensagem = inputMensagemChatEl.value.trim();
        if (!textoMensagem || !chatAtualCardId) return;

        const novaMensagem = {
            senderId: idUsuarioAtual,
            text: textoMensagem,
            timestamp: new Date().toISOString()
        };

        if (!todosOsChats[chatAtualCardId]) {
            todosOsChats[chatAtualCardId] = [];
        }
        todosOsChats[chatAtualCardId].push(novaMensagem);
        salvarNoLocalStorage('miniKinkLink_todosOsChats', todosOsChats);

        desenharMensagensNoModal(chatAtualCardId);
        inputMensagemChatEl.value = '';
        inputMensagemChatEl.focus();
    }

    // --- FIM DAS FUNÇÕES DO CHAT ---

    function resetarAplicativoCompletamente() { 
        if (confirm("Tem certeza que deseja resetar TODO o progresso do app?\n\nIsso irá:\n- Limpar o histórico de interações com as cartas por ambos.\n- Apagar TODOS os 'likes' já dados.\n- Remover TODAS as cartas criadas por vocês.\n- Limpar a lista de matches e alertas de match.\n- Apagar TODOS os CHATS dos matches.\n\nO app voltará ao estado inicial com as cartas padrão.")) {
            
            interacoesQuadrado = [];
            interacoesBolinha = [];
            selecoesQuadrado = [];
            selecoesBolinha = [];
            todosOsInteresses = JSON.parse(JSON.stringify(cartasIniciaisPadrao)); // Restaura para o padrão
            idsMatchesAnunciados = []; 
            cartaPrioritariaParaOutroUsuario = null; 
            todosOsChats = {}; // Reseta os chats

            salvarNoLocalStorage('miniKinkLink_interacoesQuadrado', interacoesQuadrado);
            salvarNoLocalStorage('miniKinkLink_interacoesBolinha', interacoesBolinha);
            salvarNoLocalStorage('miniKinkLink_selecoesQuadrado', selecoesQuadrado);
            salvarNoLocalStorage('miniKinkLink_selecoesBolinha', selecoesBolinha);
            salvarNoLocalStorage('miniKinkLink_todosOsInteresses', todosOsInteresses);
            salvarNoLocalStorage('miniKinkLink_matchesAnunciados', idsMatchesAnunciados);
            salvarNoLocalStorage('miniKinkLink_cartaPrioritariaOutro', cartaPrioritariaParaOutroUsuario);
            salvarNoLocalStorage('miniKinkLink_todosOsChats', todosOsChats);
            
            interagindoComCarta = false; 
            
            desenharInteressesEmComum();
            alert("Aplicativo resetado para o estado inicial!");
            
            puxarProximaCartaAleatoria();
        } else {
            console.log("Reset completo cancelado pelo usuário.");
        }
    }

    function lidarComTeclado(evento) {
        // Não processar teclado se o modal do chat estiver aberto e o foco não estiver no input de mensagem
        if (modalChatOverlayEl.style.display === 'flex' && evento.target !== inputMensagemChatEl) {
            return;
        }
        // Se o foco ESTÁ no input de mensagem do chat, não fazer nada com as setas (deixa o usuário navegar no texto)
        if (evento.target === inputMensagemChatEl && (evento.key === 'ArrowLeft' || evento.key === 'ArrowRight')) {
            return;
        }

        if (interagindoComCarta || !cartaAtualVisivel) return; 

        if (evento.key === 'ArrowLeft') {
            evento.preventDefault(); 
            botaoNaoQueroEl.click();
        } else if (evento.key === 'ArrowRight') {
            evento.preventDefault();
            botaoQueroEl.click();
        }
    }

    // --- INICIA O APP ---
    iniciarApp();
});     