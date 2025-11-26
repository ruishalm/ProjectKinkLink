// CategoryCarousel.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { type MatchedCard } from '../contexts/AuthContext';
import { type CoupleCardChats } from '../hooks/useCoupleCardChats';
import { useCardNotificationStatus } from '../hooks/useCardNotificationStatus'; // <<< NOVO HOOK
import MatchCardItem, { type MatchCardItemProps } from './MatchCardItem';
import CardBack from './CardBack';
import styles from './CategoryCarousel.module.css';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, A11y } from 'swiper/modules';

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
  cardChatsData: CoupleCardChats; // Dados dos chats para verificar novas mensagens
  isCompletedCarousel?: boolean; // Indica se é o carrossel da seção "Realizadas"
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ 
  title, 
  cards, 
  onCardClick, 
  onToggleHot, 
  cardChatsData, 
  isCompletedCarousel = false 
}) => {
  const { user } = useAuth();
  
  // Hook customizado para verificar status de notificação das cartas
  const { getCardNotificationStatus } = useCardNotificationStatus(user, cardChatsData);

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
          spaceBetween={16}
          slidesPerView={'auto'}
          centeredSlides={true}
          loop={cards.length >= 3}
          navigation
          preventClicks={false}
          preventClicksPropagation={false}
          simulateTouch={true}
          allowTouchMove={true}
          className={styles.swiperInstance}
        >
          {cards.map(card => {
            // Prepara os dados para MatchCardItem
            const cardForDisplay: MatchCardItemProps['card'] = {
              id: card.id,
              text: card.text || '', // Garante que o texto seja sempre uma string
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
                  isHot={card.isHot} // Passa o status de hot
                  isNewMatch={getCardNotificationStatus(card).isNewMatch} // Passa se é um novo match
                  hasNewMessage={getCardNotificationStatus(card).hasNewMessage} // Passa se tem nova mensagem
                  lastMessageSnippet={getCardNotificationStatus(card).hasNewMessage ? cardChatsData[card.id]?.lastMessageTextSnippet : undefined} // Passa o snippet
                  onToggleHot={onToggleHot} // <<< ADICIONADO
                  isCompletedCard={isCompletedCarousel} // Passa se é seção de completadas
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
