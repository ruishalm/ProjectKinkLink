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

// Re-exportar tipos e constantes que podem ser necessários em outros lugares
export type { ActiveSkinSettings } from '../config/skins/skinTypes'; // This re-export is fine
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

  useEffect(() => {
    let initialSkins = loadAndResolveInitialSkins(exampleSkinsData);
    initialSkins = checkThemeIntegrity(initialSkins, exampleSkinsData);
    setActiveSkinsState(initialSkins);
    setIsLoadingSkins(false);
  }, []);

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
      console.log(`[setActiveSkin START] Tipo: ${type}, ID: ${skinId}`);
      console.log('[setActiveSkin] prevSkins:', JSON.parse(JSON.stringify(prevSkins)));

      let newSkinsDraft: ActiveSkinSettings = { ...prevSkins };
      console.log('[setActiveSkin] newSkinsDraft após cópia de prevSkins:', JSON.parse(JSON.stringify(newSkinsDraft)));

      if (type !== 'themePack') {
        // Se um tema nomeado (que não seja já custom ou o default themePack se este for especial) estava ativo,
        // e estamos mudando uma skin individual, o tema se torna customizado.
        if (newSkinsDraft.themePack &&
            newSkinsDraft.themePack !== CUSTOM_THEME_ID) {
          console.log(`[setActiveSkin] Tema nomeado "${newSkinsDraft.themePack}" modificado por skin individual. Alterando para tema "${CUSTOM_THEME_ID}".`);
          newSkinsDraft.themePack = CUSTOM_THEME_ID;
          console.log('[setActiveSkin] newSkinsDraft APÓS marcar como CUSTOM_THEME_ID:', JSON.parse(JSON.stringify(newSkinsDraft)));
        } else {
          // Se já era CUSTOM_THEME_ID, ou não havia tema, ou era o tema default (que ao ser modificado também vira CUSTOM),
          // apenas logamos. O themePack ou permanece CUSTOM_THEME_ID ou já é undefined/default.
          // Se defaultActiveSkins.themePack for um tema específico e for modificado, ele também se tornará CUSTOM_THEME_ID.
           if (newSkinsDraft.themePack && newSkinsDraft.themePack !== CUSTOM_THEME_ID){
             console.log(`[setActiveSkin] Tema "${newSkinsDraft.themePack}" modificado. Alterando para tema "${CUSTOM_THEME_ID}".`);
             newSkinsDraft.themePack = CUSTOM_THEME_ID;
           } else {
             console.log(`[setActiveSkin] Aplicando skin individual. Tema atual é "${newSkinsDraft.themePack || 'Nenhum/Customizado'}".`);
           }
        }
      }

      const skinDef = exampleSkinsData.find(s => s.id === skinId && s.type === type);

      if (type === 'themePack') {
        console.log(`[setActiveSkin] Aplicando pacote de tema: ${skinId}`);
        if (skinDef) {
          const themeSettings = getThemeAppliedSettings(skinId, exampleSkinsData);
          // Ao aplicar um pacote de tema, ele define todas as suas skins associadas.
          // O themePack ID correto já está em themeSettings.
          newSkinsDraft = { ...themeSettings }; // Substitui completamente pelas configurações do tema
          console.log('[setActiveSkin] themeSettings aplicados:', JSON.parse(JSON.stringify(themeSettings)));
        } else {
          console.warn(`[setActiveSkin] Pacote de tema "${skinId}" não encontrado. Aplicando tema padrão.`);
          const themeSettings = getThemeAppliedSettings(defaultActiveSkins.themePack, exampleSkinsData);
          newSkinsDraft = { ...themeSettings };
        }
        console.log('[setActiveSkin] newSkinsDraft APÓS aplicação de pacote de tema:', JSON.parse(JSON.stringify(newSkinsDraft)));
      } else { // Lógica para aplicar uma skin individual
        console.log(`[setActiveSkin] Aplicando skin individual: Tipo=${type}, ID=${skinId}. Base newSkinsDraft (com themePack ajustado):`, JSON.parse(JSON.stringify(newSkinsDraft)));
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
          console.log(`[setActiveSkin] newSkinsDraft APÓS aplicação da skin individual ${type}:`, JSON.parse(JSON.stringify(newSkinsDraft)));
        } else {
          console.warn(`[setActiveSkin] Definição da skin individual tipo "${type}" ID "${skinId}" não encontrada.`);
        }
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSkinsDraft));
      console.log('[setActiveSkin END] Estado final a ser retornado:', JSON.parse(JSON.stringify(newSkinsDraft)));
      return newSkinsDraft;
    });
  }, [/* dependências */]); // Adicionar dependências se exampleSkinsData, etc., não forem estritamente estáveis globais

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