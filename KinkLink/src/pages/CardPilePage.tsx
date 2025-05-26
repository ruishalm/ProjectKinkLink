// d:\Projetos\Github\app\KinkLink\KinkLink\src\pages\CardPilePage.tsx
import React, { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo
import { useDrag } from '@use-gesture/react'; // Importa o hook para gestos
import { Link } from 'react-router-dom';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import MatchModal from '../components/MatchModal';
import PlayingCard, { type CardData as PlayingCardDataType } from '../components/PlayingCard';
import CreateUserCardModal from '../components/CreateUserCardModal';
import ConexaoCardModal from '../components/ConexaoCardModal';
import { useCardPileLogic } from '../hooks/useCardPileLogic';
import CarinhosMimosModal from '../components/CarinhosMimosModal'; // Novo Modal
import CardBack from '../components/CardBack'; // Importação adicionada
import type { Card } from '../data/cards'; // Importa o tipo Card

// Estilos
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 120px)',
  padding: '20px',
  fontFamily: '"Trebuchet MS", sans-serif',
  color: '#e0e0e0',
  textAlign: 'center',
};

const noCardsMessageStyle: React.CSSProperties = {
  fontSize: '1.2em',
  color: '#aaa',
  marginTop: '30px',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center', // Centraliza os botões
  alignItems: 'center', // Alinha verticalmente
  gap: '20px', // Espaço entre os botões
  marginTop: '20px',
};

const buttonStyle: React.CSSProperties = {
  padding: '15px 30px',
  fontSize: '1.2em',
  borderRadius: '50px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
  minWidth: '120px',
};

const likeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#4CAF50',
  color: 'white',
};

const dislikeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#f44336',
  color: 'white',
};

// Estilo para o container das cartas (pilha)
const cardStackContainerStyle: React.CSSProperties = {
  position: 'relative', // Necessário para posicionar o CardBack absolutamente
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '420px', // Altura mínima para acomodar as cartas
  marginBottom: '25px',
};

// Estilo para a carta de fundo estática (a pilha)
const staticCardBackStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 1, // Atrás do PlayingCard
  transform: 'translateX(10px) translateY(10px) scale(0.95) rotate(2deg)', // Mesmo deslocamento da pilha anterior
  opacity: 0.7, // Opacidade constante para visibilidade
  // Nenhuma transição aqui, pois ela é estática
};

// Estilos para a nova barra de navegação inferior
const bottomNavContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between', // Distribui espaço entre os itens
  alignItems: 'center',
  width: '100%',
  maxWidth: '450px', // Um pouco mais largo para acomodar os botões
  padding: '10px 0',
  marginTop: '30px',
  borderTop: '1px solid #444',
};

const navButtonStyleBase: React.CSSProperties = {
  border: 'none',
  backgroundColor: 'transparent',
  color: '#b0b0b0',
  cursor: 'pointer',
  padding: '10px 15px',
  borderRadius: '8px',
  transition: 'background-color 0.2s ease, color 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none', // Para os <Link>
};

const matchesNavButtonStyle: React.CSSProperties = {
  ...navButtonStyleBase,
  backgroundColor: '#ff6b6b', // Cor de destaque (fogo/match)
  color: 'white',
  fontWeight: 'bold',
  fontSize: '1.1em',
  padding: '12px 25px', // Mais padding para ser chamativo
  flexGrow: 1, // Permite que ele ocupe mais espaço se necessário
  margin: '0 15px', // Margens laterais
};

const carinhosMimosButtonStyle: React.CSSProperties = { // Estilo para o novo botão de coração
  ...navButtonStyleBase,
  fontSize: '1.8em', // Tamanho do ícone de coração
  color: '#e0e0e0', // Cor do ícone
  padding: '8px',
  // backgroundColor: '#4f4f4f', // Opcional: fundo se quiser destacar mais
  // borderRadius: '50%',
};

const profileNavButtonStyle: React.CSSProperties = {
  ...navButtonStyleBase,
  backgroundColor: '#4f4f4f', // Fundo cinza um pouco mais claro para o círculo
  width: '44px', // Tamanho do botão redondo
  height: '44px',
  borderRadius: '50%', // Faz o botão ser redondo
  fontSize: '1.5em', // Tamanho do ícone (Unicode)
  padding: 0, // Remove padding para o ícone preencher
  color: '#e0e0e0', // Cor do ícone (busto) para garantir visibilidade no fundo mais claro
};

const cardCountersStyle: React.CSSProperties = {
  fontSize: '0.85em',
  color: '#777',
  marginTop: '10px', // Espaço acima dos contadores
  width: '100%',
  textAlign: 'center',
};

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
    allConexaoCards, // Precisamos pegar todas as cartas de conexão
  } = useCardPileLogic();

  // Estado para controlar a animação de saída da carta atual
  const [exitingCard, setExitingCard] = useState<{ id: string; direction: 'left' | 'right' } | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(true); // Nova carta aparece virada (de costas)

  const [showCreateUserCardModal, setShowCreateUserCardModal] = useState(false);
  const [showCarinhosMimosModal, setShowCarinhosMimosModal] = useState(false); // Estado para o novo modal
  // A função handleCreateUserCard virá do useUserCardInteractions
  const { matchedCards, seenCards, handleCreateUserCard, toggleHotStatus } = useUserCardInteractions();

  // Filtra as cartas de conexão para mostrar apenas as que já foram vistas pelo usuário
  const seenConexaoCardsForModal = useMemo(() => {
    return (allConexaoCards || []).filter(card => seenCards.includes(card.id));
  }, [allConexaoCards, seenCards]);

  // Prepara os dados da carta atual para exibição, incluindo o status 'isHot'
  // e garante que currentCard seja do tipo CardData esperado por PlayingCard
  const cardForDisplay: PlayingCardDataType | null = currentCard
    ? {
        id: currentCard.id,
        text: currentCard.text,
        category: currentCard.category,
        intensity: currentCard.intensity,
        isHot: matchedCards.find(mc => mc.id === currentCard.id)?.isHot || false,
      }
    : null;

  // Efeito para "virar" a carta após ela aparecer de costas
  useEffect(() => {
    if (cardForDisplay && !exitingCard && isCardFlipped) {
      // Se uma nova carta está visível, não está saindo, e está atualmente "de costas"
      const timer = setTimeout(() => {
        setIsCardFlipped(false); // Vira para mostrar a frente
      }, 150); // Pequeno delay para a carta ser renderizada de costas antes de virar
      return () => clearTimeout(timer);
    }
    // Se não há carta ou a carta está saindo, e ela não está marcada como "flipped",
    // preparamos para a próxima carta aparecer de costas.
    if (!cardForDisplay && !isCardFlipped) {
        // setIsCardFlipped(true); // Comentado por enquanto, pode causar loop se mal posicionado
    }
  }, [cardForDisplay, exitingCard, isCardFlipped]);

  // Configuração do gesto de arrastar (swipe)
  const bindCardDrag = useDrag(({ down, movement: [mx], direction: [dx], velocity: [vx] }) => {
    // down: true se o usuário está pressionando, false ao soltar
    // movement: [mx, my] - deslocamento total do gesto
    // direction: [dx, dy] - direção do último movimento (-1, 0 ou 1)
    // velocity: [vx, vy] - velocidade do movimento

    if (!down && cardForDisplay && !exitingCard) { // Ao soltar o dedo, se houver carta e não estiver saindo
      const SWIPE_THRESHOLD = 0.3; // Quão "forte" o swipe precisa ser (ajuste conforme necessário)
      const SWIPE_VELOCITY_THRESHOLD = 0.2; // Velocidade mínima para considerar um swipe (ajuste)

      // Verifica se o swipe horizontal foi significativo
      if (Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD || Math.abs(mx) > targetWidth * SWIPE_THRESHOLD) {
        if (dx > 0) { // Swipe para a direita
          console.log("Swipe Direita detectado");
          setExitingCard({ id: cardForDisplay.id, direction: 'right' });
        } else if (dx < 0) { // Swipe para a esquerda
          console.log("Swipe Esquerda detectado");
          setExitingCard({ id: cardForDisplay.id, direction: 'left' });
        }
      }
    }
    // Poderíamos adicionar feedback visual enquanto arrasta (mx), mas o pedido foi simular o clique.
  });

  const targetWidth = 250; // Largura padrão da carta, para o cálculo do threshold do swipe

  if (!currentCard && unseenCardsCount === 0) {
    return (
      <div style={pageStyle}>
        <h2 style={{color: '#64b5f6'}}>Fim das Cartas!</h2>
        <p style={noCardsMessageStyle}>
          Você viu todas as cartas disponíveis por enquanto.
          <br />
          Volte mais tarde para novas sugestões ou crie as suas!
        </p>
        {/* O botão de criar kink quando não há cartas pode manter o estilo antigo ou ser ajustado depois */}
        <button 
          style={{width: '150px', height: '100px', backgroundColor: '#3a3f47', color: '#e0e0e0', borderRadius: '12px', border: '1px dashed #61dafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold', textAlign: 'center', padding: '10px', transition: 'border-color 0.2s ease, transform 0.1s ease', marginTop: '20px'}} 
          onClick={() => setShowCreateUserCardModal(true)}
        >Crie seu Kink</button>
      </div>
    );
  }


  return (
    <div style={pageStyle}>
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
            handleConexaoInteractionInModal(false);
          }}
        />
      )}

      {showCreateUserCardModal && (
        <CreateUserCardModal
          isOpen={showCreateUserCardModal}
          onClose={() => setShowCreateUserCardModal(false)}
          onSubmit={(category: Card['category'], text: string, intensity: number) => { // Adiciona intensity
            if (handleCreateUserCard) { // Verifica se a função existe
                 handleCreateUserCard(category, text, intensity); // Passa intensity
            }
            setShowCreateUserCardModal(false);
          }}
        />
      )}

      {showCarinhosMimosModal && (
        <CarinhosMimosModal
          isOpen={showCarinhosMimosModal}
          onClose={() => setShowCarinhosMimosModal(false)}
          conexaoCards={seenConexaoCardsForModal} // Passa apenas as cartas de conexão vistas
        />
      )}


      {/* O botão "Crie seu Kink" que estava aqui foi movido para junto dos botões de ação abaixo */}
      {cardForDisplay ? ( // Usa cardForDisplay aqui
        <>
          <div style={cardStackContainerStyle}>
            {/* Carta de fundo estática */}
            {cardForDisplay && ( /* Só mostra se houver uma carta principal */
              <div style={staticCardBackStyle}>
                <CardBack />
              </div>
            )}
            {/* Aplicamos o {...bindCardDrag()} ao div que contém a carta para capturar o gesto */}
            <div {...bindCardDrag()} style={{ position: 'relative', zIndex: 2, touchAction: 'pan-y' }}> {/* touchAction: 'pan-y' permite rolagem vertical da página se necessário */}
              <PlayingCard
                  key={cardForDisplay.id}
                  data={cardForDisplay}
                  targetWidth={targetWidth} // Passa a largura para o PlayingCard
                  isFlipped={exitingCard && exitingCard.id === cardForDisplay.id ? false : isCardFlipped} // Carta saindo mostra a frente, nova carta respeita isCardFlipped
                  exitDirection={exitingCard && exitingCard.id === cardForDisplay.id ? exitingCard.direction : null}
                onAnimationComplete={() => {
                  if (exitingCard) {
                    handleInteraction(exitingCard.direction === 'right');
                    setIsCardFlipped(true); // Prepara a próxima carta para aparecer de costas
                    setExitingCard(null); // Reseta o estado da animação
                  }
                }}
                  onToggleHot={(cardId) => {
                    if (toggleHotStatus) {
                      toggleHotStatus(cardId);
                    }
                  }}
              />
            </div> {/* Closes div for PlayingCard wrapper (zIndex: 2) */}

          </div> {/* THIS IS THE CORRECTED CLOSING TAG for cardStackContainerStyle */}

          <div style={buttonContainerStyle}>
            <button
              style={dislikeButtonStyle}
              onClick={() => {
                if (cardForDisplay && !exitingCard) { // Só anima se não estiver animando
                  setExitingCard({ id: cardForDisplay.id, direction: 'left' });
                }
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label="Rejeitar carta"
            >
              Passo
            </button>

            <button
              style={likeButtonStyle}
              onClick={() => {
                if (cardForDisplay && !exitingCard) { // Só anima se não estiver animando
                  setExitingCard({ id: cardForDisplay.id, direction: 'right' });
                }
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label="Aceitar carta"
            >
              Topo!
            </button>

            {/* Novo Botão Miniatura "Crie seu Kink" */}
            <div
              onClick={() => setShowCreateUserCardModal(true)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.1s ease-out',
                display: 'flex', // Para centralizar o CardBack escalado
                alignItems: 'center', // Para centralizar o CardBack escalado
                justifyContent: 'center', // Para centralizar o CardBack escalado
                width: '75px', // Largura da miniatura (250px * 0.3)
                height: '125px', // Altura para acomodar a miniatura e o texto
                position: 'relative', // Para o texto sobreposto
              }}
              title="Criar novo Kink" // Adicionado title para acessibilidade
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              role="button"
              aria-label="Criar novo Kink"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowCreateUserCardModal(true); }}
            >
              <div style={{ 
                transform: 'scale(0.3)', 
                width: '250px', // Dimensões originais para cálculo da escala
                height: '350px', // Dimensões originais para cálculo da escala
                display: 'flex', alignItems: 'center', justifyContent: 'center' // Para garantir que CardBack se comporte bem
              }}>
                <CardBack />
              </div>
              {/* Texto sobreposto */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#FFFFFF', // Texto branco para contraste
                fontSize: '0.8em', // Ajuste conforme necessário
                padding: '5px', // Pequeno padding para não colar nas bordas
                boxSizing: 'border-box',
                pointerEvents: 'none', // Permite que o clique passe para o div pai
              }}>
                <strong>Crie seu Kink</strong>
              </div>
              </div>
            {/* Este div fechava o buttonContainerStyle, mas o Fragmento <> ainda estava aberto */}
          </div>
        </>
      ) : (
        <p style={noCardsMessageStyle}>Carregando próxima carta...</p>
      )}

      {/* Nova Barra de Navegação Inferior */}
      <div style={bottomNavContainerStyle}>
        <button style={carinhosMimosButtonStyle} onClick={() => setShowCarinhosMimosModal(true)} title="Carinhos & Mimos">
          ❤️
        </button>
        <Link to="/matches" style={matchesNavButtonStyle}>
          Links ({matchedCards.length})
        </Link>
        <Link to="/profile" style={profileNavButtonStyle} aria-label="Perfil">
          👤 {/* Ícone de perfil Unicode */}
        </Link>
      </div>
      <div style={cardCountersStyle}>
        Cartas Vistas: {seenCards.length} | Restantes: {unseenCardsCount}
      </div>
    </div>
  );
}

export default CardPilePage;
