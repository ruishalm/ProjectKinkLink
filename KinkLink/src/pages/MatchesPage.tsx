// d:\Projetos\Github\app\KinkLink\KinkLink\src\pages\MatchesPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import type { MatchedCard } from '../contexts/AuthContext'; // Alterada a fonte da importação
import PlayingCard from '../components/PlayingCard';
import CardChatModal from '../components/CardChatModal';

// Constantes para dimensões e escala das cartas
const BASE_CARD_WIDTH = 250; // Dimensão base original do PlayingCard
const BASE_CARD_HEIGHT = 350; // Dimensão base original do PlayingCard
const HOT_MATCH_SCALE_FACTOR = 0.55; // Fator de escala para Top Matches
const OTHER_MATCH_SCALE_FACTOR = 0.5; // Fator de escala para Outros Matches

function MatchesPage() {
  const { matchedCards, toggleHotStatus } = useUserCardInteractions(); // Removido clearUserMatchesAndSeenCards e navigate
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedCardForChat, setSelectedCardForChat] = useState<MatchedCard | null>(null);

  const hotMatches = matchedCards.filter(card => card.isHot);
  const otherMatches = matchedCards.filter(card => !card.isHot);

  const handleOpenChat = (card: MatchedCard) => {
    setSelectedCardForChat(card);
    setIsChatModalOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatModalOpen(false);
    setSelectedCardForChat(null);
  };

  // Estilos da página
  const pageStyle: React.CSSProperties = {
    padding: '20px',
    fontFamily: '"Trebuchet MS", sans-serif',
    color: '#e0e0e0', // Cor de texto clara para tema escuro
    // A altura dinâmica da página é melhor controlada pelo CSS global (index.css)
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.8em',
    color: '#ff6b6b', // Cor de destaque para "Top Matches"
    borderBottom: '2px solid #ff6b6b',
    paddingBottom: '10px',
    marginBottom: '25px',
    textAlign: 'center',
  };

  const matchesGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '15px', // Espaçamento entre as cartas
  };

  // Estilo para o wrapper de cada carta (o item do grid que será clicável)
  const cardItemWrapperStyle: React.CSSProperties = {
    display: 'inline-block', // Faz o wrapper se ajustar ao conteúdo (PlayingCard escalado)
    cursor: 'pointer',
    transition: 'transform 0.15s ease-out', // Para um leve efeito de hover
    // NENHUMA width ou height explícita aqui.
  };

  const backToCardsButtonStyle: React.CSSProperties = {
    border: 'none',
    backgroundColor: '#ff6b6b',
    color: 'white',
    cursor: 'pointer',
    padding: '10px 20px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '0.9em',
  };

  const noMatchesCondition = hotMatches.length === 0 && otherMatches.length === 0;

  return (
    <div style={pageStyle}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <h1 style={{color: '#64b5f6', margin: 0}}>Seus Matches! 🎉</h1>
        <Link to="/cards" style={backToCardsButtonStyle}>
          Voltar para as Cartas
        </Link>
      </div>

      {noMatchesCondition ? (
        <p style={{ textAlign: 'center', fontSize: '1.1em', color: '#b0b0b0', marginTop: '50px' }}>
          Você ainda não tem matches. Continue explorando as cartas!
        </p>
      ) : (
        <>
          {hotMatches.length > 0 && (
            <section>
              <h2 style={sectionTitleStyle}>🔥 Top Matches</h2>
              <div style={matchesGridStyle}>
                {hotMatches.map((card: MatchedCard) => (
                  <div
                    key={card.id}
                    style={cardItemWrapperStyle} // Aplica apenas o estilo base do wrapper
                    onClick={() => handleOpenChat(card)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    role="button"
                    tabIndex={0}
                    aria-label={`Top match: ${card.text.substring(0,30)}...`}
                  >
                    <PlayingCard
                      data={card}
                      targetWidth={BASE_CARD_WIDTH * HOT_MATCH_SCALE_FACTOR}
                      targetHeight={BASE_CARD_HEIGHT * HOT_MATCH_SCALE_FACTOR}
                      onToggleHot={toggleHotStatus}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {otherMatches.length > 0 && (
            <section style={hotMatches.length > 0 ? { marginTop: '40px' } : {}}>
              <h2 style={{...sectionTitleStyle, borderBottomColor: '#64b5f6', color: '#64b5f6'}}>{hotMatches.length > 0 ? 'Outros Matches' : 'Seus Matches'}</h2>
              <div style={matchesGridStyle}>
                {otherMatches.map((card: MatchedCard) => (
                  <div
                    key={card.id}
                    style={cardItemWrapperStyle} // Aplica apenas o estilo base do wrapper
                    onClick={() => handleOpenChat(card)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir chat para o match: ${card.text.substring(0,30)}...`}
                  >
                    <PlayingCard
                      data={card}
                      targetWidth={BASE_CARD_WIDTH * OTHER_MATCH_SCALE_FACTOR}
                      targetHeight={BASE_CARD_HEIGHT * OTHER_MATCH_SCALE_FACTOR}
                      onToggleHot={toggleHotStatus}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {isChatModalOpen && selectedCardForChat && (
        <CardChatModal
          cardId={selectedCardForChat.id} // Corrigido: passar cardId
          cardTitle={selectedCardForChat.text} // Corrigido: passar cardTitle (usando .text como exemplo)
          onClose={handleCloseChat}
        />
      )}

      {/* Botão de Debug removido pois clearUserMatchesAndSeenCards não está disponível no hook */}
    </div>
  );
}

export default MatchesPage;
