// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\hooks\useCardPileModals.ts
import { useState, useCallback } from 'react';

export const useCardPileModals = () => {
  const [showCreateUserCardModal, setShowCreateUserCardModal] = useState(false);
  const [showCarinhosMimosModal, setShowCarinhosMimosModal] = useState(false);

  const openCreateUserCardModal = useCallback(() => setShowCreateUserCardModal(true), []);
  const closeCreateUserCardModal = useCallback(() => setShowCreateUserCardModal(false), []);

  const openCarinhosMimosModal = useCallback(() => setShowCarinhosMimosModal(true), []);
  const closeCarinhosMimosModal = useCallback(() => setShowCarinhosMimosModal(false), []);

  return {
    showCreateUserCardModal,
    openCreateUserCardModal,
    closeCreateUserCardModal,
    showCarinhosMimosModal,
    openCarinhosMimosModal,
    closeCarinhosMimosModal,
  };
};