// src/hooks/useCardTips.ts
import { useState, useEffect } from 'react';
import { categorySpecificTips } from '../components/categorySpecificTips';
import type { Card } from '../data/cards';

export const useCardTips = (currentCard: Card | null) => {
  const [activeLeftTip, setActiveLeftTip] = useState<string | null>(null);
  const [activeRightTip, setActiveRightTip] = useState<string | null>(null);
  const [animateTipsIn, setAnimateTipsIn] = useState(false);

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

  return { activeLeftTip, activeRightTip, animateTipsIn };
};