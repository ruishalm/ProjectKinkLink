// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\pages\CardPilePage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDrag } from '@use-gesture/react';
import { Link, useNavigate } from 'react-router-dom';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import MatchModal from '../components/MatchModal';
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CreateUserCardModal from '../components/CreateUserCardModal';
import ConexaoCardModal from '../components/ConexaoCardModal';
import { useCardPileLogic } from '../hooks/useCardPileLogic';
import CarinhosMimosModal from '../components/CarinhosMimosModal';
import CardBack from '../components/CardBack';
import type { Card } from '../data/cards';
import { useSkin } from '../contexts/SkinContext';
import SideTipMessages from '../components/SideTipMessages';
import styles from './CardPilePage.module.css';

function CardPilePage() {
  const {
    currentCard,
    handleInteraction,
    showMatchModal,
    currentMatchCard,
    setShowMatchModal,
    unseenCardsCount,
    showConexaoModal,
    currentConexaoCardForModal,
    handleConexaoInteractionInModal,
    allConexaoCards,
  } = useCardPileLogic();
  const { isLoadingSkins } = useSkin();

  const { matchedCards, seenCards, handleCreateUserCard, toggleHotStatus } = useUserCardInteractions();
  const navigate = useNavigate();

  const [exitingCard, setExitingCard] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true);
  const [showCreateUserCardModal, setShowCreateUserCardModal] = useState(false);
  const [showCarinhosMimosModal, setShowCarinhosMimosModal] = useState(false);
  const [dragVisuals, setDragVisuals] = useState({ x: 0, active: false, dir: 0 });
  const [cardDimensions, setCardDimensions] = useState({ width: 250, height: 350 });
  const [hasUnseenMatches, setHasUnseenMatches] = useState(false);

  const [activeLeftTip, setActiveLeftTip] = useState<string | null>(null);
  const [activeRightTip, setActiveRightTip] = useState<string | null>(null);
  const [animateTipsIn, setAnimateTipsIn] = useState(false);

  type TipSet = { left: string[]; right: string[] };
  const categorySpecificTips: Record<Card['category'] | 'default', TipSet> = {
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

  const seenConexaoCardsForModal = useMemo(() => {
    return (allConexaoCards || []).filter(card => seenCards.includes(card.id));
  }, [allConexaoCards, seenCards]);

  const cardForDisplay: PlayingCardDataType | null = currentCard
    ? {
        id: currentCard.id,
        text: currentCard.text,
        category: currentCard.category,
        intensity: currentCard.intensity,
        isHot: matchedCards.find(mc => mc.id === currentCard.id)?.isHot || false,
      }
    : null;

  useEffect(() => {
    const lastSeenMatchesCount = parseInt(localStorage.getItem('kinklink_lastSeenMatchesCount') || '0', 10);
    if (matchedCards.length > lastSeenMatchesCount) {
      setHasUnseenMatches(true);
    } else {
      setHasUnseenMatches(false);
    }
  }, [matchedCards]);

  const handleMatchesButtonClick = () => {
    localStorage.setItem('kinklink_lastSeenMatchesCount', String(matchedCards.length));
    setHasUnseenMatches(false);
    navigate('/matches');
  };

  useEffect(() => {
    const calculateCardDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const aspectRatio = 350 / 250;

      let newCardWidth = screenWidth * 0.8;
      if (screenWidth > 600) {
        newCardWidth = screenWidth * 0.5;
      }
      newCardWidth = Math.max(220, Math.min(newCardWidth, 320));
      let newCardHeight = newCardWidth * aspectRatio;
      const availableHeightForCard = screenHeight * 0.9 - 180;
      
      if (newCardHeight > availableHeightForCard) {
        newCardHeight = availableHeightForCard;
        newCardWidth = newCardHeight / aspectRatio;
      }
      newCardWidth = Math.max(220, newCardWidth);
      newCardHeight = newCardWidth * aspectRatio;

      setCardDimensions({ width: Math.round(newCardWidth), height: Math.round(newCardHeight) });
    };
    calculateCardDimensions();
    window.addEventListener('resize', calculateCardDimensions);
    return () => window.removeEventListener('resize', calculateCardDimensions);
  }, []);

  useEffect(() => {
    if (cardForDisplay && !exitingCard && isCardFlipped) {
      const timer = setTimeout(() => {
        setIsCardFlipped(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [cardForDisplay, exitingCard, isCardFlipped]);

  useEffect(() => {
    setAnimateTipsIn(false); 

    if (currentCard) {
      const tipsForCategory = categorySpecificTips[currentCard.category] || categorySpecificTips.default;

      let newLeftTip: string | null = null;
      let newRightTip: string | null = null;

      if (tipsForCategory.left.length > 0) {
        newLeftTip = tipsForCategory.left[Math.floor(Math.random() * tipsForCategory.left.length)];
      }
      if (tipsForCategory.right.length > 0) {
        newRightTip = tipsForCategory.right[Math.floor(Math.random() * tipsForCategory.right.length)];
      }
        
      setActiveLeftTip(newLeftTip);
      setActiveRightTip(newRightTip);

      const fadeInDelay = 5000;
      const timerId = setTimeout(() => {
        setAnimateTipsIn(true);
      }, fadeInDelay);

      return () => clearTimeout(timerId);
    } else {
      setActiveLeftTip(null);
      setActiveRightTip(null);
    }
  }, [currentCard]);

  const triggerHapticFeedback = (pattern: number | number[] = 30) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn("Haptic feedback failed:", e);
      }
    }
  };

  const bindCardDrag = useDrag(({ active, movement: [mx], direction: [dx], velocity: [vx] }) => {
    if (active) {
      setDragVisuals({ x: mx, active: true, dir: dx });
    } else {
      setDragVisuals({ x: 0, active: false, dir: 0 });
      if (cardForDisplay && !exitingCard) {
        const SWIPE_CONFIRM_DISTANCE_THRESHOLD = cardDimensions.width * 0.35;
        const SWIPE_VELOCITY_THRESHOLD = 0.3;
        if (Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD || Math.abs(mx) > SWIPE_CONFIRM_DISTANCE_THRESHOLD) {
          if (dx > 0) {
            triggerHapticFeedback();
            setAnimateTipsIn(false);
            setExitingCard({ id: cardForDisplay.id, direction: 'right' });
          } else if (dx < 0) {
            triggerHapticFeedback();
            setAnimateTipsIn(false);
            setExitingCard({ id: cardForDisplay.id, direction: 'left' });
          }
        }
      }
    }
  });

  if (isLoadingSkins) {
    return <div className={styles.page}><p>Carregando skins...</p></div>;
  }

  return (
    <div className={styles.page}>
      {showMatchModal && currentMatchCard && (
        <MatchModal
          card={currentMatchCard}
          onClose={() => setShowMatchModal(false)}
        />
      )}

      {showConexaoModal && currentConexaoCardForModal && (
        <ConexaoCardModal
          isOpen={showConexaoModal}
          card={currentConexaoCardForModal}
          onAccept={() => handleConexaoInteractionInModal(true)}
          onReject={() => handleConexaoInteractionInModal(false)}
          onClose={() => {
            handleConexaoInteractionInModal(false); // Considera fechar como rejeitar
          }}
        />
      )}

      {showCreateUserCardModal && (
        <CreateUserCardModal
          isOpen={showCreateUserCardModal}
          onClose={() => setShowCreateUserCardModal(false)}
          onSubmit={(category: Card['category'], text: string, intensity: number) => {
            if (handleCreateUserCard) {
                 handleCreateUserCard(category, text, intensity);
            }
            setShowCreateUserCardModal(false);
          }}
        />
      )}

      {showCarinhosMimosModal && (
        <CarinhosMimosModal
          isOpen={showCarinhosMimosModal}
          onClose={() => setShowCarinhosMimosModal(false)}
          conexaoCards={seenConexaoCardsForModal}
        />
      )}

      <div className={styles.contentArea}>
        {cardForDisplay ? (
          <>
            <div className={styles.cardStackContainer}>
              <SideTipMessages
                leftMessage={activeLeftTip}
                rightMessage={activeRightTip}
                animateIn={animateTipsIn}
                cardWidth={cardDimensions.width}
              />
              {cardForDisplay && (
                <div className={styles.staticCardBack}>
                  <CardBack
                    targetWidth={cardDimensions.width}
                    targetHeight={cardDimensions.height}
                  />
                </div>
              )}
              <div {...bindCardDrag()} className={styles.playingCardWrapper}>
                <PlayingCard
                    key={cardForDisplay.id}
                    data={cardForDisplay}
                    targetWidth={cardDimensions.width}
                    targetHeight={cardDimensions.height}
                    dragVisuals={dragVisuals}
                    isFlipped={exitingCard && exitingCard.id === cardForDisplay.id ? false : isCardFlipped}
                    exitDirection={exitingCard && exitingCard.id === cardForDisplay.id ? exitingCard.direction : null}
                  onAnimationComplete={() => {
                    if (exitingCard) {
                      handleInteraction(exitingCard.direction === 'right');
                      setIsCardFlipped(true);
                      setExitingCard(null);
                    }
                  }}
                    onToggleHot={(cardId) => {
                      if (toggleHotStatus) {
                        toggleHotStatus(cardId);
                      }
                    }}
                />
              </div>
            </div>

            {/* Botão "Crie seu Kink" MOVIDO PARA CÁ */}
            <button
              onClick={() => setShowCreateUserCardModal(true)}
              className={`${styles.createKinkButton} genericButton`}
              title="Criar novo Kink"
              aria-label="Criar novo Kink"
            >
              Criar Kink
            </button>

            <div className={`${styles.allButtonsPanel} klnkl-themed-panel`}>
              <div className={styles.buttonContainer}>
                <button
                  className={`${styles.dislikeButton} ${styles.botaoDecisao} genericButton dislikeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !exitingCard) {
                      setAnimateTipsIn(false);
                      setExitingCard({ id: cardForDisplay.id, direction: 'left' });
                    }
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Rejeitar carta"
                >
              👎 Nao Topo!
                </button>

                <button
                  className={`${styles.likeButton} ${styles.botaoDecisao} genericButton likeButton actionButton`}
                  onClick={() => {
                    if (cardForDisplay && !exitingCard) {
                      setAnimateTipsIn(false);
                      setExitingCard({ id: cardForDisplay.id, direction: 'right' });
                    }
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label="Aceitar carta"
                >
              ❤️ Topo!
                </button>
              </div>

              <div className={styles.bottomNavContainer}>
                <button className={`${styles.bottomNavIconStyle} ${styles.ballButton} genericButton klnkl-icon-nav-button klnkl-nav-cards`} onClick={() => setShowCarinhosMimosModal(true)} title="Carinhos & Mimos">
                  ❤️
                </button>
                <button
                  onClick={handleMatchesButtonClick}
                  className={`${styles.matchesNavButton} ${styles.linkButton} genericButton klnkl-nav-matches ${hasUnseenMatches ? styles.shakeAnimation : ''}`}
                >
                  Links ({matchedCards.length})
                </button>
                <Link to="/profile" className={`${styles.bottomNavIconStyle} ${styles.ballButton} genericButton klnkl-icon-nav-button klnkl-nav-profile`} aria-label="Perfil" title="Perfil">
                  👤
                </Link>
              </div>
            </div>
          </>
        ) : (
          unseenCardsCount === 0 ? (
            <div className={`${styles.noCardsViewContainer} klnkl-themed-panel`}>
              <h2 className={styles.pageTitle}>Fim das Cartas!</h2>
              <p className={styles.noCardsMessage}>
                Você viu todas as cartas disponíveis por enquanto.
                <br />
                Volte mais tarde para novas sugestões ou crie as suas!
              </p>
              <div
                onClick={() => setShowCreateUserCardModal(true)}
                className={`${styles.createKinkMiniButton} ${styles.centeredCreateKinkButton}`}
                title="Criar novo Kink"
                role="button"
                aria-label="Criar novo Kink"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowCreateUserCardModal(true); }}
              >
                <div className={styles.createKinkMiniCardBackWrapper}>
                  <CardBack targetWidth={30} targetHeight={42} />
                </div>
                <div className={styles.createKinkMiniTextOverlay}>Crie<br/>seu Kink</div>
              </div>
            </div>
          ) : (
            <p className={styles.noCardsMessage}>Carregando próxima carta...</p>
          )
        )}
      </div>
      {/* Contadores de cartas voltam a ser um elemento simples */}
      <div className={styles.cardCounters}>
        <span className={styles.counterItem}>
          Cartas Vistas: <span className={styles.counterValue}>{seenCards.length}</span>
        </span>
        <span className={styles.counterSeparator}>|</span>
        <span className={styles.counterItem}>
          Restantes: <span className={styles.counterValue}>{unseenCardsCount}</span>
        </span>
      </div>
    </div>
  );
}

export default CardPilePage;
