// src/contexts/SkinContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { SkinDefinition, ActiveSkinSettings as ImportedActiveSkinSettings, ActiveSkinSettings } from '../config/skins/skinTypes';
import { exampleSkinsData } from '../config/skins';
import {
    LOCAL_STORAGE_KEY,
    defaultActiveSkins,
    colorVariableNames,
    defaultPalette,
    CUSTOM_THEME_ID
} from './skinUtils/skinConstants';
import { loadAndResolveInitialSkins } from './skinUtils/resolveActiveSkins';
import { getThemeAppliedSettings, checkThemeIntegrity } from './skinUtils/themeManager';
import { applyStylesAndClasses } from './skinUtils/styleApplier';

export type { ActiveSkinSettings } from '../config/skins/skinTypes';
export { defaultPalette } from './skinUtils/skinConstants';

interface SkinContextType {
  activeSkins: ImportedActiveSkinSettings;
  setActiveSkin: (
    type: SkinDefinition['type'],
    skinId: string
  ) => void;
  isLoadingSkins: boolean;
  panelStyleId?: string;
  panelStyleClass?: string;
}

const SkinContext = createContext<SkinContextType | undefined>(undefined);

export const SkinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeSkins, setActiveSkinsState] = useState<ImportedActiveSkinSettings>(defaultActiveSkins);
  const [isLoadingSkins, setIsLoadingSkins] = useState(true);

  // Efeito para carregar as skins iniciais na primeira renderização.
  // Carrega do localStorage ou usa os padrões, e garante a integridade dos temas.
  useEffect(() => {
    let initialSkins = loadAndResolveInitialSkins(exampleSkinsData);
    initialSkins = checkThemeIntegrity(initialSkins, exampleSkinsData);
    setActiveSkinsState(initialSkins);
    setIsLoadingSkins(false);
  }, []);

  // Efeito para aplicar as classes e variáveis de estilo ao DOM.
  // Roda sempre que as skins ativas mudam.
  useEffect(() => {
    if (!isLoadingSkins) {
      applyStylesAndClasses(activeSkins);
    }
  }, [activeSkins, isLoadingSkins]);

  const setActiveSkin = useCallback((
    type: SkinDefinition['type'],
    skinId: string
  ) => {
    setActiveSkinsState(prevSkins => {
      let newSkinsDraft: ActiveSkinSettings = { ...prevSkins };

      // Se um tema nomeado estava ativo e o usuário muda uma skin individual,
      // o tema se torna "customizado". Isso preserva as outras skins do tema
      // mas indica que não é mais o pacote original.
      if (type !== 'themePack' && newSkinsDraft.themePack && newSkinsDraft.themePack !== CUSTOM_THEME_ID) {
        newSkinsDraft.themePack = CUSTOM_THEME_ID;
      }

      const skinDef = exampleSkinsData.find(s => s.id === skinId && s.type === type);

      // Se o usuário selecionou um pacote de tema completo.
      if (type === 'themePack') {
        if (skinDef) {
          // Substitui todas as configurações atuais pelas do tema selecionado.
          const themeSettings = getThemeAppliedSettings(skinId, exampleSkinsData);
          newSkinsDraft = { ...themeSettings };
        } else {
          // Fallback para o tema padrão se o ID do tema for inválido.
          console.warn(`[SkinContext] Pacote de tema "${skinId}" não encontrado. Aplicando tema padrão.`);
          const themeSettings = getThemeAppliedSettings(defaultActiveSkins.themePack, exampleSkinsData);
          newSkinsDraft = { ...themeSettings };
        }
      } else { // Se o usuário selecionou uma skin individual.
        if (skinDef) {
          switch (type) {
            case 'backgroundPile':
              newSkinsDraft.backgroundPile = skinId;
              newSkinsDraft.backgroundPileUrl = typeof skinDef.preview === 'string' ? skinDef.preview : defaultActiveSkins.backgroundPileUrl;
              break;
            case 'backgroundMatches':
              newSkinsDraft.backgroundMatches = skinId;
              newSkinsDraft.backgroundMatchesUrl = typeof skinDef.preview === 'string' ? skinDef.preview : defaultActiveSkins.backgroundMatchesUrl;
              break;
            case 'colorPalette':
              if (Array.isArray(skinDef.preview)) {
                newSkinsDraft.colorPalette = skinId;
                const colors = skinDef.preview.slice(0, colorVariableNames.length);
                newSkinsDraft.colorPaletteColors = colors.concat(defaultPalette.slice(colors.length));
              } else {
                // Fallback para a paleta padrão se a skin for inválida.
                newSkinsDraft.colorPalette = defaultActiveSkins.colorPalette;
                newSkinsDraft.colorPaletteColors = [...defaultPalette];
              }
              break;
            case 'font':
              newSkinsDraft.font = skinId;
              newSkinsDraft.fontFamily = typeof skinDef.preview === 'string' ? skinDef.preview : defaultActiveSkins.fontFamily;
              break;
            case 'buttonStyle':
              newSkinsDraft.buttonStyleId = skinId;
              newSkinsDraft.buttonStyleClass = typeof skinDef.preview === 'string' ? skinDef.preview : defaultActiveSkins.buttonStyleClass;
              break;
            case 'panelStyle':
              newSkinsDraft.panelStyleId = skinId;
              newSkinsDraft.panelStyleClass = typeof skinDef.preview === 'string' ? skinDef.preview : defaultActiveSkins.panelStyleClass;
              break;
          }
        } else {
          console.warn(`[SkinContext] Definição da skin individual tipo "${type}" ID "${skinId}" não encontrada.`);
        }
      }
      
      // Salva as novas configurações de skin no localStorage para persistência.
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSkinsDraft));
      return newSkinsDraft;
    });
  }, []);

  return (
    <SkinContext.Provider value={{
      activeSkins,
      setActiveSkin,
      isLoadingSkins,
      panelStyleId: activeSkins.panelStyleId,
      panelStyleClass: activeSkins.panelStyleClass
    }}>
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