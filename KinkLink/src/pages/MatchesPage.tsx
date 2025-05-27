// d:\Projetos\Github\app\KinkLink\KinkLink\src\pages\MatchesPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserCardInteractions } from '../hooks/useUserCardInteractions';
import type { MatchedCard } from '../contexts/AuthContext'; // Alterada a fonte da importação
import PlayingCard from '../components/PlayingCard';
import CardChatModal from '../components/CardChatModal';
import styles from './MatchesPage.module.css'; // Importa os CSS Modules

// Constantes para dimensões e escala das cartas
const BASE_CARD_WIDTH = 250; // Dimensão base original do PlayingCard
const BASE_CARD_HEIGHT = 350; // Dimensão base original do PlayingCard
const HOT_MATCH_SCALE_FACTOR = 0.55; // Fator de escala para Top Matches
const OTHER_MATCH_SCALE_FACTOR = 0.5; // Fator de escala para Outros Matches

function MatchesPage() {
  // Hooks e Estados
  const { matchedCards, toggleHotStatus } = useUserCardInteractions();
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

  // Lógica de Renderização e Variáveis Auxiliares
  const noMatchesCondition = hotMatches.length === 0 && otherMatches.length === 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Seus Links</h1>
        <Link to="/cards" className={styles.backToCardsButton}>
          Cartas
        </Link>
      </div>

      {noMatchesCondition ? (
        <p className={styles.noMatchesText}>
          Você ainda não tem Links. Continue explorando as cartas!
        </p>
      ) : (
        <>
          {hotMatches.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>🔥 Top Links</h2>
              <div className={styles.matchesGrid}>
                {hotMatches.map((card: MatchedCard) => (
                  <div
                    key={card.id}
                    className={styles.cardItemWrapper}
                    onClick={() => handleOpenChat(card)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    role="button"
                    tabIndex={0}
                    aria-label={`Top Link: ${card.text.substring(0,30)}...`}
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
            <section className={styles.section} style={hotMatches.length > 0 ? { marginTop: '40px' } : {}}>
              <h2 className={`${styles.sectionTitle} ${styles.sectionTitleOthers}`}>
                {hotMatches.length > 0 ? 'Outros Links' : 'Seus Links'}
              </h2>
              <div className={styles.matchesGrid}>
                {otherMatches.map((card: MatchedCard) => (
                  <div
                    key={card.id}
                    className={styles.cardItemWrapper}
                    onClick={() => handleOpenChat(card)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir chat para o Link: ${card.text.substring(0,30)}...`}
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
    </div>
  );
}

export default MatchesPage;
