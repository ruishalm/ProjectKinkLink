// src/hooks/useCardTips.ts
import { useState, useEffect, useCallback } from 'react'; // Adicionado useCallback
import { categorySpecificTips } from '../components/categorySpecificTips';
import type { Card } from '../data/cards';

export const useCardTips = (currentCard: Card | null) => {
  const [activeLeftTip, setActiveLeftTip] = useState<string | null>(null);
  const [activeRightTip, setActiveRightTip] = useState<string | null>(null);
  const [_animateTipsInState, setAnimateTipsInState] = useState(false); // Renomeado o estado

  useEffect(() => {
    setAnimateTipsInState(false);

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

      const fadeInDelay = 3000; // Reduzido de 5s para 3s
      const timerId = setTimeout(() => {
        setAnimateTipsInState(true);
      }, fadeInDelay);

      return () => clearTimeout(timerId);
    } else {
      setActiveLeftTip(null);
      setActiveRightTip(null);
    }
  }, [currentCard]);

  // Função para ser chamada para iniciar a animação
  const triggerAnimateTipsIn = useCallback(() => {
    setAnimateTipsInState(true);
  }, []);

  return { activeLeftTip, activeRightTip, animateTipsIn: _animateTipsInState, triggerAnimateTipsIn }; // Retorna o estado e a função
};