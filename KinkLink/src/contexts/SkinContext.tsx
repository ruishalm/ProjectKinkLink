// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\SkinContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { SkinDefinition } from '../pages/SkinsPage'; // Importando a definição de Skin

const LOCAL_STORAGE_KEY = 'kinklink_active_skins';

export interface ActiveSkinSettings {
  backgroundPile?: string; // ID da skin de fundo da pilha
  backgroundPileUrl?: string; // URL da textura para a pilha
  backgroundMatches?: string; // ID da skin de fundo dos matches
  backgroundMatchesUrl?: string; // URL da textura para os matches
  colorPalette?: string; // ID da paleta de cores
  font?: string; // ID da fonte
  themePack?: string; // ID do pacote de tema
}

interface SkinContextType {
  activeSkins: ActiveSkinSettings;
  setActiveSkin: (type: SkinDefinition['type'], skinId: string, previewUrl?: string) => void;
  isLoadingSkins: boolean;
}

const defaultActiveSkins: ActiveSkinSettings = {
  backgroundPile: 'bg_pile_default',
  backgroundPileUrl: undefined,
  backgroundMatches: 'bg_match_default',
  backgroundMatchesUrl: undefined,
  colorPalette: 'palette_default',
  font: 'font_default',
  themePack: 'pack_default',
};

const SkinContext = createContext<SkinContextType | undefined>(undefined);

export const SkinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSkins, setActiveSkinsState] = useState<ActiveSkinSettings>(defaultActiveSkins);
  const [isLoadingSkins, setIsLoadingSkins] = useState(true);

  useEffect(() => {
    try {
      const storedSkins = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSkins) {
        setActiveSkinsState(JSON.parse(storedSkins));
      }
    } catch (error) {
      console.error("Failed to load skins from localStorage", error);
      // Mantém os padrões se houver erro
    }
    setIsLoadingSkins(false);
  }, []);

  const setActiveSkin = useCallback((type: SkinDefinition['type'], skinId: string, previewUrl?: string) => {
    setActiveSkinsState(prevSkins => {
      const newSkins: ActiveSkinSettings = { ...prevSkins };
      const isDefaultSkin = skinId.endsWith('_default');

      switch (type) {
        case 'backgroundPile':
          newSkins.backgroundPile = skinId;
          newSkins.backgroundPileUrl = isDefaultSkin ? undefined : previewUrl;
          break;
        case 'backgroundMatches':
          newSkins.backgroundMatches = skinId;
          newSkins.backgroundMatchesUrl = isDefaultSkin ? undefined : previewUrl;
          break;
        case 'colorPalette':
          newSkins.colorPalette = skinId;
          // Lógica para aplicar paleta de cores (ex: CSS variables) viria aqui
          break;
        case 'font':
          newSkins.font = skinId;
          // Lógica para aplicar fonte (ex: CSS variables) viria aqui
          break;
        case 'themePack':
          newSkins.themePack = skinId;
          // Lógica para aplicar pacote de tema (poderia setar múltiplos valores) viria aqui
          break;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSkins));
      return newSkins;
    });
  }, []);

  return (
    <SkinContext.Provider value={{ activeSkins, setActiveSkin, isLoadingSkins }}>
      {children}
    </SkinContext.Provider>
  );
};

export const useSkin = (): SkinContextType => {
  const context = useContext(SkinContext);
  if (context === undefined) {
    throw new Error('useSkin must be used within a SkinProvider');
  }
  return context;
};
