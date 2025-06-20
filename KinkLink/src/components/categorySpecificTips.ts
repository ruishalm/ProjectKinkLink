// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\components\categorySpecificTips.ts
import type { Card } from '../data/cards'; // Assuming Card type is exported from here

type TipSet = { left: string[]; right: string[] };
export const categorySpecificTips: Record<Card['category'] | 'default', TipSet> = {
    poder: {
      left: [
        "Não curtiu a dinâmica? Sem problemas.",
        "Se não é para você, está tudo certo.",
        "Limites são essenciais. Passe.",
        "Poder só com conforto. Rejeite.",
        "Não sentiu a troca? Jogue para cá.",
        "Seu 'não' é a regra aqui.",
        "Ok não estar nessa vibe hoje.",
        "Domínio só se ambos quiserem.",
        "Submissão? Só se for sua vontade.",
        "Ninguém te julga por passar.",
        "Sua segurança em primeiro lugar.",
        "Não é debate, é sua escolha.",
        "Forçar não combina com prazer.",
        "Confie na sua intuição. Rejeite.",
        "Essa não te pegou? Normal.",
        "O poder é seu de dizer não.",
        "Não gostou? Próxima carta!",
        "Respeite seus próprios limites.",
        "Intenso demais? Sem crise.",
        "Aqui, seu conforto é lei."
      ],
      right: [
        "Consentimento é a base de tudo!",
        "Palavra de segurança definida?",
        "Lembrem-se: o prazer é o objetivo.",
        "Comunicação clara sobre limites.",
        "Explorem o poder com respeito mútuo.",
        "Confiança é sexy. Divirtam-se!",
        "Definam bem os papéis e curtam.",
        "Segurança em primeiro, tesão em segundo.",
        "O 'sim' de ambos abre o jogo.",
        "Limites claros, prazer sem culpa.",
        "Negociem os termos da brincadeira.",
        "Aftercare é importante após cenas intensas.",
        "Divirtam-se com a troca de poder!",
        "O consentimento pode ser retirado, ok?",
        "Certifiquem-se que ambos estão 100%.",
        "Explore, mas sempre com cuidado.",
        "A entrega mútua é poderosa.",
        "Escutem o corpo e os sinais.",
        "Redefinam 'poder' juntos.",
        "Que a força (do tesão) esteja com vocês!"
      ],
    },
    sensorial: {
      left: [
        "Não despertou seus sentidos? Ok.",
        "Prefere outras texturas/aromas?",
        "Ninguém é obrigado a gostar de tudo.",
        "Se não parece prazeroso, rejeite.",
        "Essa sensação não te atrai? Passe.",
        "Seu corpo, suas regras de prazer.",
        "Pele sensível? Melhor não arriscar.",
        "Não curtiu a proposta? Sem problemas.",
        "Escute seu corpo e seus limites.",
        "Ok não querer essa experiência.",
        "Algumas sensações não são para todos.",
        "Se não for relaxante/excitante, pule.",
        "Conforto sensorial é prioridade.",
        "Pode ser que outra te agrade mais.",
        "Sua intuição diz não? Confie nela.",
        "Não force uma sensação.",
        "Se não te arrepia (do jeito bom), não vá.",
        "Algumas coisas são melhores só na ideia.",
        "Intenso demais para seus sentidos?",
        "Passe essa e espere a próxima onda."
      ],
      right: [
        "JAMAIS ferir o(a) parceiro(a)!",
        "Consentimento em cada toque.",
        "Se não der prazer, PAREM.",
        "Palavra de segurança ATIVADA?",
        "Comunicação é essencial aqui.",
        "Conectem-se com cada sensação.",
        "Explorem com cuidado e carinho.",
        "Limites são para serem respeitados.",
        "Não ultrapassem o combinado.",
        "Prazer e segurança andam juntos.",
        "O 'PARE' não é debatível.",
        "Atenção às reações do(a) parceiro(a).",
        "Vão com calma, descubram juntos.",
        "Menos é mais, às vezes.",
        "Dor só se for prazerosa e combinada.",
        "Estejam atentos um ao outro.",
        "Se algo incomodar, avisem NA HORA.",
        "O objetivo é o prazer mútuo.",
        "Respeitem o ritmo de cada um.",
        "Aproveitem a jornada sensorial!"
      ],
    },
    fantasia: {
      left: [
        "Essa história não te inspira? Ok.",
        "Não é sua vibe de roleplay? Passe.",
        "Outra imaginação em mente? Sem problemas.",
        "Criatividade não pode ser forçada.",
        "Se o cenário não agrada, rejeite.",
        "Não é obrigado(a) a entrar na peça.",
        "Talvez um roteiro mais leve?",
        "Ok não querer encenar isso.",
        "Sua zona de conforto primeiro.",
        "Não curtiu o personagem? Próximo!",
        "A imaginação é livre, inclusive para dizer não.",
        "Se não for divertido, não vale.",
        "Essa fantasia ficou para depois.",
        "Sem pressão para embarcar.",
        "Pode ser que outra história agrade mais.",
        "Sinta-se livre para passar essa.",
        "Não é toda fantasia que encaixa.",
        "Seu conforto dita o roteiro.",
        "Prefere algo mais 'real'? Ok.",
        "Essa não acendeu sua chama."
      ],
      right: [
        "Deixem a imaginação voar alto!",
        "Consentimento é o feitiço principal.",
        "Criem essa história juntos.",
        "Segurança com locais e acessórios!",
        "Definam limites antes de começar.",
        "Divirtam-se construindo o personagem.",
        "Comunicação é chave no roleplay.",
        "Entrem no personagem e aproveitem.",
        "Usem a criatividade sem medo.",
        "Lembrem-se: é uma brincadeira!",
        "Cuidado com objetos/cenários.",
        "Estejam confortáveis com o enredo.",
        "Acessórios? Testem antes!",
        "O objetivo é a diversão mútua.",
        "Pausem se algo sair do script.",
        "Combinem sinais de segurança.",
        "Realizem desejos com responsabilidade.",
        "A fantasia é um convite, não ordem.",
        "Explorem juntos esse universo.",
        "Que comece o espetáculo!"
      ],
    },
    exposicao: {
      left: [
        "Muito ousado por agora? Tudo bem.",
        "Prefere manter só entre vocês?",
        "Vergonha é natural, sem pressão.",
        "Se não se sentir seguro(a), rejeite.",
        "Não está no clima para se expor?",
        "Sua privacidade em primeiro lugar.",
        "Ok não querer plateia hoje.",
        "Expor-se só se for confortável.",
        "Limites são importantes aqui.",
        "Não curtiu a ideia? Passe.",
        "Seu corpo, sua decisão de mostrar.",
        "Não precisa provar nada a ninguém.",
        "Sinta-se à vontade para dizer não.",
        "Se não for divertido, por que fazer?",
        "Talvez outro tipo de ousadia?",
        "Não se force a nada.",
        "A adrenalina não compensa o desconforto.",
        "Confie nos seus sentimentos.",
        "Essa não rolou? Normal.",
        "Ainda não é o momento para isso."
      ],
      right: [
        "Consentimento de TODOS os envolvidos!",
        "Cuidado com as leis locais!",
        "Atenção total aos arredores.",
        "Segurança em primeiro lugar, sempre.",
        "Definam bem os limites antes.",
        "Adrenalina e confiança andam juntas.",
        "A diversão está em se permitir com juízo.",
        "Se envolver terceiros, diálogo claro!",
        "Lembrem-se do que é público vs. privado.",
        "Pensem nas consequências antes.",
        "Privacidade digital é crucial se filmar/fotografar.",
        "A espontaneidade tem seus riscos; avaliem.",
        "Se for em público, discrição é amiga.",
        "Confiem um no outro para se protegerem.",
        "Combinem sinais se algo sair do controle.",
        "Ousadia sim, perigo não!",
        "O objetivo é excitar, não se encrencar.",
        "Certifiquem-se que o local é seguro.",
        "A cumplicidade do casal é fundamental.",
        "Divirtam-se, mas com responsabilidade!"
      ],
    },
    conexao: {
      left: [
        "Não sentiu a conexão com essa proposta? Ok.",
        "Prefere outra forma de se conectar agora?",
        "Se não parece íntimo o suficiente, passe.",
        "Sua intuição sobre a conexão é válida.",
        "Não está no clima para essa interação? Sem problemas."
      ],
      right: [
        "Comunicação aberta fortalece os laços.",
        "Estejam presentes um para o outro.",
        "Pequenos gestos fazem grande diferença.",
        "A vulnerabilidade aproxima.",
        "Celebrem os momentos juntos."
      ],
    },
    default: {
      left: [
        "Não curtiu? Sem problemas, próxima!",
        "Se não é pra você, tudo bem.",
        "Passe se não sentir a vibe.",
        "Sua escolha é o que importa.",
        "Ok não gostar dessa."
      ],
      right: [
        "Divirtam-se explorando!",
        "Comunicação é a chave.",
        "Respeitem os limites um do outro.",
        "Consentimento sempre!",
        "Aproveitem a jornada juntos."
      ],
    },
};