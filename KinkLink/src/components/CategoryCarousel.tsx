// CategoryCarousel.tsx
import React from 'react';
import { type MatchedCard } from '../contexts/AuthContext'; // Usaremos o tipo MatchedCard
import MatchCardItem, { type MatchCardItemProps } from './MatchCardItem'; // Importa o componente refatorado
import CardBack from './CardBack'; // Para a carta vazia
import styles from './CategoryCarousel.module.css';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y } from 'swiper/modules'; // A11y para acessibilidade

// Import Swiper styles
// @ts-expect-error ts eh doido
import 'swiper/css';
// @ts-expect-error ts eh doido
import 'swiper/css/navigation';

interface CategoryCarouselProps {
  title: string;
  cards: MatchedCard[];
  onCardClick: (card: MatchedCard) => void;
  onToggleHot: (cardId: string, event: React.MouseEvent) => void;
  // Precisamos saber quais cartas estão não lidas e seus snippets
  unreadStatuses: { [key: string]: boolean };
  cardChatsData: { [key: string]: { lastMessageTextSnippet?: string } };
  newlyMatchedCardIds: string[]; // NOVO: IDs das cartas recém-combinadas
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ title, cards, onCardClick, onToggleHot, unreadStatuses, cardChatsData, newlyMatchedCardIds }) => {
  if (cards.length === 0) {
    return (
      <div className={styles.carouselSection}>
        <h3 className={styles.categoryTitle}>{title}</h3>
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyCard}>
            <CardBack targetHeight={175} targetWidth={125} /> {/* Ajuste o tamanho conforme necessário */}
            <div className={styles.emptyCardText}>Vazio</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.carouselSection}>
      <h3 className={styles.categoryTitle}>{title}</h3>
      <div className={styles.swiperContainer}>
        <Swiper
          modules={[Navigation, A11y]}
          spaceBetween={16} // Espaço entre os slides (1rem)
          slidesPerView={'auto'} // Para o efeito de "espiar"
          centeredSlides={true} // Centraliza o slide ativo
          // Ativar o loop apenas se houver cartas suficientes para uma boa experiência de "peek"
          // Ex: 3 ou mais cartas. Ajuste o número conforme necessário.
          loop={cards.length > 2}
          // slidesPerGroup={1} // Com slidesPerView: 'auto' e loop, slidesPerGroup pode não ser necessário ou desejado
          navigation // Habilita as setas de navegação
          preventClicks={false} // Tenta garantir que cliques nas cartas funcionem
          preventClicksPropagation={false} // Ajuda a propagar o clique para os elementos filhos
          simulateTouch={true} // HABILITA a simulação de toque para mouse (opcional, mas bom para desktop)
          allowTouchMove={true} // HABILITA o arrastar/swipe
          className={styles.swiperInstance} // Classe para estilização customizada se necessário
        >
          {cards.map(card => {
            // Prepara os dados para MatchCardItem
            const cardForDisplay: MatchCardItemProps['card'] = {
              id: card.id,
              text: card.text,
              category: card.category,
              intensity: card.intensity,
              isHot: card.isHot,
            };
            return (
              <SwiperSlide key={card.id} className={styles.swiperSlide}>
                <MatchCardItem
                  card={cardForDisplay}
                  onClick={() => {
                    console.log(`CategoryCarousel: MatchCardItem clicado! Card ID: ${card.id}, Texto: "${card.text.substring(0,30)}..."`);
                    onCardClick(card);
                  }}
                  isHot={card.isHot || false}
                  onToggleHot={onToggleHot}
                  isUnread={unreadStatuses[card.id] || false}
                  isNewlyMatched={newlyMatchedCardIds.includes(card.id)} // Passa a nova prop
                  lastMessageSnippet={unreadStatuses[card.id] ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
};

export default CategoryCarousel;
