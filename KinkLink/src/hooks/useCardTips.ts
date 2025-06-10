// src/hooks/useCardTips.ts
import { useState, useEffect } from 'react';
import { categorySpecificTips } from '../components/categorySpecificTips';
import type { Card } from '../data/cards';
import { useTranslation } from 'react-i18next';

export const useCardTips = (currentCard: Card | null) => {
  const [activeLeftTip, setActiveLeftTip] = useState<string | null>(null);
  const [activeRightTip, setActiveRightTip] = useState<string | null>(null);
  const [animateTipsIn, setAnimateTipsIn] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setAnimateTipsIn(false);

    if (currentCard) {
      const tipsForCategory = categorySpecificTips[currentCard.category] || categorySpecificTips.default;

      let newLeftTip: string | null = null;
      let newRightTip: string | null = null;

      if (tipsForCategory.left.length > 0) {
        const tipKey = tipsForCategory.left[Math.floor(Math.random() * tipsForCategory.left.length)];
        newLeftTip = t(tipKey);
      }
      if (tipsForCategory.right.length > 0) {
        const tipKey = tipsForCategory.right[Math.floor(Math.random() * tipsForCategory.right.length)];
        newRightTip = t(tipKey);
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
  }, [currentCard, t]);

  return { activeLeftTip, activeRightTip, animateTipsIn };
};