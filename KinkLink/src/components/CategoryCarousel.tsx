// CategoryCarousel.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // <<< ADICIONADO
import { type Timestamp } from 'firebase/firestore';
import { type MatchedCard } from '../contexts/AuthContext'; // Usaremos o tipo MatchedCard
import { type CoupleCardChats } from '../hooks/useCoupleCardChats'; // Importa o tipo
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
  onToggleHot: (cardId: string, event: React.MouseEvent) => void; // <<< ADICIONADO
  cardChatsData: CoupleCardChats; // Dados dos chats para verificar novas mensagens
  userLastVisitedMatchesPage?: Timestamp; // Timestamp da última visita do usuário
}

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ title, cards, onCardClick, onToggleHot, cardChatsData, userLastVisitedMatchesPage }) => {
  const { user } = useAuth(); // <<< ADICIONADO

  // Função auxiliar para determinar o status de notificação de cada carta
  const getCardNotificationStatus = (card: MatchedCard) => {
    const lastVisited = userLastVisitedMatchesPage?.toDate();
    const matchCreatedAt = card.createdAt?.toDate();
    const chatLastMessageTimestamp = cardChatsData[card.id]?.lastMessageTimestamp?.toDate();
    const lastMessageSenderId = cardChatsData[card.id]?.lastMessageSenderId;

    let isNewMatch = false;
    let hasNewMessage = false;

    if (lastVisited) {
      if (matchCreatedAt && matchCreatedAt > lastVisited) {
        isNewMatch = true;
      }
      // Verifica se a última mensagem é mais recente que a visita E não foi enviada pelo próprio usuário
      if (chatLastMessageTimestamp && chatLastMessageTimestamp > lastVisited && lastMessageSenderId !== user?.id) {
        hasNewMessage = true;
      }
    }
    return { isNewMatch, hasNewMessage };
  };

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
