// InteractiveDemo.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import DemoCard from './DemoCard';
import { demoCards } from './demoCardData';
import styles from './InteractiveDemo.module.css';
import { useDrag } from '@use-gesture/react';

// Função para embaralhar um array (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const InteractiveDemo: React.FC = () => {
  const { t } = useTranslation();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [dragVisuals, setDragVisuals] = useState({ x: 0, active: false, dir: 0 });
  const [exitingDirection, setExitingDirection] = useState<'left' | 'right' | null>(null);

  // IDs das cartas que o "Parceiro Simulado" já curtiu
  const simulatedPartnerLikes: string[] = ['c1', 'c3', 'c5'];

  // Embaralha as cartas apenas uma vez quando o componente monta
  const shuffledDemoCards = useMemo(() => shuffleArray(demoCards), []);
  const currentCard = shuffledDemoCards[currentCardIndex];

  useEffect(() => {
    if (feedbackMessage && !showMatchModal) {
      const timer = setTimeout(() => {
        setFeedbackMessage(null);
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % shuffledDemoCards.length);
        setExitingDirection(null); 
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage, showMatchModal, exitingDirection, shuffledDemoCards.length]);


  const handleInteraction = (liked: boolean) => {
    setShowMatchModal(false);
    let message: string;

    if (liked) {
      if (currentCard && simulatedPartnerLikes.includes(currentCard.id)) {
        setFeedbackMessage(t('demo_match_message'));
        setShowMatchModal(true);
        return;
      } else {
        message = t('demo_liked_message');
      }
    } else {
      message = t('demo_disliked_message');
    }
    setFeedbackMessage(message);
  };

  const handleSwipeInteraction = (direction: 'left' | 'right') => {
    if (exitingDirection || showMatchModal) return;
    setExitingDirection(direction);
  };

  const handleCardAnimationComplete = () => {
    if (exitingDirection) {
      const liked = exitingDirection === 'right';
      handleInteraction(liked);
    }
  };

  const handleCloseMatchModal = () => {
    setShowMatchModal(false);
    setFeedbackMessage(null);
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % shuffledDemoCards.length);
    setExitingDirection(null);
  };

  const bindCardDrag = useDrag(({ active, movement: [mx], direction: [dx], velocity: [vx], down, cancel, event }) => {
    event.preventDefault();
    if (showMatchModal || exitingDirection) {
        if (active && cancel) cancel();
        return;
    }

    if (active) {
      setDragVisuals({ x: mx, active: true, dir: dx });
    } else {
      setDragVisuals({ x: 0, active: false, dir: 0 });
      if (!down && currentCard) {
        const SWIPE_CONFIRM_DISTANCE_THRESHOLD = 80;
        const SWIPE_VELOCITY_THRESHOLD = 0.3;

        if (Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD || Math.abs(mx) > SWIPE_CONFIRM_DISTANCE_THRESHOLD) {
          if (dx > 0) {
            handleSwipeInteraction('right');
          } else if (dx < 0) {
            handleSwipeInteraction('left');
          }
        }
      }
    }
  }, {
    axis: 'x',
    filterTaps: true,
    preventScroll: true,
  });

  return (
    <div className={styles.demoContainer}>
      <div className={styles.watermarkContainer}>
        {[...Array(5)].map((_, i) => (
            <span key={i} className={`${styles.watermarkText} ${styles[`watermark${i + 1}`]}`}>{t('demo_watermark')}</span>
        ))}
      </div>
      <h3 className={styles.demoTitle}>{t('demo_title')}</h3>

      <p className={styles.partnerInfoText}>
        {t('demo_partner_info')}
      </p>

      <div className={styles.tipsAndCardArea}>
        <div className={`${styles.sideTip} ${styles.leftTip}`}>
          <span>{t('demo_tip_left')}</span>
        </div>

        <div
          {...bindCardDrag()}
          className={styles.demoCardArea}
          style={{ touchAction: 'pan-y' }}
        >
          {currentCard ? (
            <DemoCard
              card={currentCard}
              dragVisuals={dragVisuals}
              exitDirection={exitingDirection}
              onAnimationComplete={handleCardAnimationComplete}
            />
          ) : <p>{t('demo_loading')}</p>}
        </div>

        <div className={`${styles.sideTip} ${styles.rightTip}`}>
          <span>{t('demo_tip_right')}</span>
        </div>
      </div>

      {feedbackMessage && !showMatchModal && (
        <p className={styles.feedbackMessage}>{feedbackMessage}</p>
      )}

      {currentCard && !exitingDirection && !showMatchModal && (
        <div className={styles.interactionButtons}>
          <button className={styles.dislike} onClick={() => handleSwipeInteraction('left')}>{t('demo_dislike_button')}</button>
          <button className={styles.like} onClick={() => handleSwipeInteraction('right')}>{t('demo_like_button')}</button>
        </div>
      )}
      <p className={styles.demoExtraFeaturesText} dangerouslySetInnerHTML={{ __html: t('demo_extra_features') }} />

      <p className={styles.demoDisclaimer}>
        {t('demo_disclaimer_text')}
        <br />
        <Trans 
          i18nKey="demo_disclaimer_action"
          components={[
            <Link to="/login" className={styles.loginLinkInDemo} key="0">login</Link>,
            <Link to="/signup" className={styles.signupLinkInDemo} key="1">signup</Link>
          ]}
        />
      </p>

      {showMatchModal && (
        <div className={styles.feedbackModalOverlay} onClick={handleCloseMatchModal}>
          <div className={styles.feedbackModalContent} onClick={(e) => e.stopPropagation()}>
            <strong>{t('demo_match_modal_title')}</strong>
            <p>{feedbackMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveDemo;
