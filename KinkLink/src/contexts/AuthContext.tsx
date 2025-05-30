// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, db } from '../firebase';
// Importando SkinDefinition para a função de desbloqueio
import type { SkinDefinition } from '../pages/SkinsPage'; // Ajuste o caminho se SkinsPage não estiver em ../pages/
import type { Card } from '../data/cards'; // Mantém a importação de Card
import {
  doc,
  setDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  collection,
  query,
  where,
  getDocs // Adicionado para buscar documentos em batch
} from 'firebase/firestore';

export interface MatchedCard extends Card {
  isHot?: boolean;
}

export interface User {
  id: string;
  email: string | null;
  username?: string;
  bio?: string;
  linkCode?: string | null;
  linkedPartnerId?: string | null;
  coupleId?: string | null;
  partnerId?: string | null;
  seenCards?: string[];
  conexaoAccepted?: number;
  conexaoRejected?: number;
  userCreatedCards?: Card[];
  matchedCards?: MatchedCard[];
  unlockedSkinIds?: string[]; // Skins que o usuário desbloqueou
  createdAt?: Timestamp;
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  resetUserTestData: () => Promise<void>;
  checkAndUnlockSkins: (allSkinsData: SkinDefinition[]) => Promise<SkinDefinition[] | null>; // Retorna SkinDefinition[]
  newlyUnlockedSkinsForModal: SkinDefinition[] | null; // Estado para o modal
  clearNewlyUnlockedSkinsForModal: () => void; // Função para limpar o estado do modal
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlockedSkinsForModal, setNewlyUnlockedSkinsForModal] = useState<SkinDefinition[] | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          const baseUserData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
          };

          if (docSnap.exists()) {
            console.log('[AuthContext] onSnapshot User Doc Data:', docSnap.data());
            const firestoreData = docSnap.data() as Partial<User & { partnerId?: string | null }>;
            setUser({
              ...baseUserData,
              ...firestoreData,
              linkedPartnerId: firestoreData.linkedPartnerId || firestoreData.partnerId || null,
              coupleId: firestoreData.coupleId || null,
              unlockedSkinIds: firestoreData.unlockedSkinIds || [], // Inicializa se não existir
            });
          } else {
            setUser(baseUserData);
            console.warn(`[AuthContext] Documento do usuário ${firebaseUser.uid} não encontrado no Firestore via onSnapshot. Será criado no signup se necessário.`);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("[AuthContext] Erro ao ouvir o perfil do usuário no Firestore:", error);
          setUser({ id: firebaseUser.uid, email: firebaseUser.email });
          setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Erro no login:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    console.log('[AuthContext] Iniciando signup para:', email);
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newUserDocRef = doc(db, 'users', userCredential.user.uid);
      const userData = {
        email: userCredential.user.email,
        linkCode: newLinkCode,
        linkedPartnerId: null,
        coupleId: null,
        seenCards: [],
        matchedCards: [],
        conexaoAccepted: 0,
        conexaoRejected: 0,
        userCreatedCards: [],
        unlockedSkinIds: [
          'bg_pile_default',
          'bg_match_default',
          'palette_default',
          'font_default',
          'pack_default',
          'palette_vamp_night',      // Adicionada
          'palette_candy_sky'        // Adicionada
        ], // Skins padrão desbloqueadas
        createdAt: serverTimestamp(),
      };
      await setDoc(newUserDocRef, userData);
      console.log('[AuthContext] Documento do usuário criado no Firestore com sucesso.');
    } catch (error) {
      console.error("[AuthContext] Erro detalhado no signup:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Erro no logout:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) {
      console.warn("updateUser chamado sem usuário logado.");
      return;
    }
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, ...updatedData };
    });

    const userDocRef = doc(db, 'users', user.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { matchedCards: _matchedCards, ...dataToPersist } = updatedData;
      if (Object.keys(dataToPersist).length > 0) {
        await updateDoc(userDocRef, dataToPersist);
      }
    } catch (error) {
      console.error(`Firestore: Erro ao persistir atualização do perfil do usuário ${user.id}:`, error);
    }
  };

  const checkAndUnlockSkins = async (allSkinsData: SkinDefinition[]): Promise<SkinDefinition[] | null> => {
    if (!user) {
      console.warn("[AuthContext] checkAndUnlockSkins chamado sem usuário logado.");
      return null;
    }

    const newlyUnlockedSkins: SkinDefinition[] = [];
    const currentUnlockedIds = user.unlockedSkinIds || [];

    allSkinsData.forEach(skin => {
      // Se a skin já está desbloqueada ou não tem critério de desbloqueio, pula
      if (currentUnlockedIds.includes(skin.id) || !skin.unlockCriteria) {
        return;
      }

      let conditionMet = false;
      const criteria = skin.unlockCriteria;

      switch (criteria.type) {
        case 'matches':
          conditionMet = (user.matchedCards?.length || 0) >= criteria.count;
          break;
        case 'seenCards':
          conditionMet = (user.seenCards?.length || 0) >= criteria.count;
          break;
        case 'userCreatedCards':
          conditionMet = (user.userCreatedCards?.length || 0) >= criteria.count;
          break;
        default:
          break;
      }

      if (conditionMet) {
        newlyUnlockedSkins.push(skin);
      }
    });

    if (newlyUnlockedSkins.length > 0) {
      const newIdsToUnlock = newlyUnlockedSkins.map(s => s.id);
      const updatedUnlockedIds = [...new Set([...currentUnlockedIds, ...newIdsToUnlock])]; // Usa Set para evitar duplicatas
      try {
        await updateUser({ unlockedSkinIds: updatedUnlockedIds }); // updateUser já lida com Firestore e estado local
        console.log(`[AuthContext] Novas skins desbloqueadas para ${user.id}:`, newlyUnlockedSkins.map(s => s.name));
        setNewlyUnlockedSkinsForModal(newlyUnlockedSkins); // Define as skins para o modal
        return newlyUnlockedSkins;
      } catch (error) {
        console.error(`[AuthContext] Erro ao atualizar skins desbloqueadas para ${user.id}:`, error);
      }
    }
    return null;
  };

  const clearNewlyUnlockedSkinsForModal = () => {
    setNewlyUnlockedSkinsForModal(null);
  };

  const resetUserTestData = async () => {
    if (!user || !user.id) {
      console.warn("resetUserTestData chamado sem usuário logado.");
      return;
    }
    console.log(`[AuthContext] Iniciando reset de dados de teste para o usuário ${user.id}`);

    const batch = writeBatch(db);
    const userDocRef = doc(db, 'users', user.id);

    // 1. Resetar seenCards e matchedCards no documento do usuário atual
    batch.update(userDocRef, {
      seenCards: [],
      matchedCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      unlockedSkinIds: [
        'bg_pile_default',
        'bg_match_default',
        'palette_default',
        'font_default',
        'pack_default',
        'palette_vamp_night',      // Adicionada
        'palette_candy_sky'        // Adicionada
      ]
    });
    console.log(`[AuthContext] Dados do usuário ${user.id} (incluindo skins desbloqueadas) marcados para reset.`);

    // 2. Deletar interações antigas do usuário atual
    const userInteractionsQuery = query(collection(db, 'cardInteractions'), where('userId', '==', user.id));
    try {
      const userInteractionsSnap = await getDocs(userInteractionsQuery);
      userInteractionsSnap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      console.log(`[AuthContext] ${userInteractionsSnap.size} interações antigas do usuário ${user.id} marcadas para deleção.`);
    } catch (error) {
      console.error(`[AuthContext] Erro ao buscar interações antigas do usuário ${user.id} para deleção:`, error);
    }

    // Se o usuário estiver vinculado
    if (user.coupleId) {
      // 3. Deletar documentos da subcoleção 'likedInteractions' do casal
      const likedInteractionsPath = `couples/${user.coupleId}/likedInteractions`;
      const likedInteractionsQuery = query(collection(db, likedInteractionsPath));
      try {
        const likedInteractionsSnap = await getDocs(likedInteractionsQuery);
        likedInteractionsSnap.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        console.log(`[AuthContext] ${likedInteractionsSnap.size} documentos da subcoleção '${likedInteractionsPath}' marcados para deleção.`);
      } catch (error) {
        console.error(`[AuthContext] Erro ao buscar documentos da subcoleção '${likedInteractionsPath}' para deleção:`, error);
      }

      // Se também tiver um parceiro vinculado, limpa as interações antigas dele
      if (user.linkedPartnerId) {
        const partnerId = user.linkedPartnerId;
        // 4. Deletar interações antigas do parceiro (da coleção cardInteractions, se ainda existir)
        const partnerInteractionsQuery = query(collection(db, 'cardInteractions'), where('userId', '==', partnerId));
        try {
          const partnerInteractionsSnap = await getDocs(partnerInteractionsQuery);
          partnerInteractionsSnap.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });
          console.log(`[AuthContext] ${partnerInteractionsSnap.size} interações antigas do parceiro ${partnerId} marcadas para deleção.`);
        } catch (error) {
          console.error(`[AuthContext] Erro ao buscar interações antigas do parceiro ${partnerId} para deleção:`, error);
        }
      }
    }

    // Limpar também a antiga coleção 'matches' e 'coupleCardLikes' (nível raiz) se existirem e pertencerem ao casal
    if (user.coupleId) {
        const oldMatchesQuery = query(collection(db, 'matches'), where('coupleId', '==', user.coupleId));
        try {
            const oldMatchesSnap = await getDocs(oldMatchesQuery);
            oldMatchesSnap.forEach(docSnap => batch.delete(docSnap.ref));
            if (oldMatchesSnap.size > 0) console.log(`[AuthContext] ${oldMatchesSnap.size} docs da antiga 'matches' do casal ${user.coupleId} marcados para deleção.`);
        } catch (e) { console.error("[AuthContext] Erro ao limpar antiga 'matches'", e); }

        const oldCoupleCardLikesQuery = query(collection(db, 'coupleCardLikes'), where('coupleId', '==', user.coupleId));
        try {
            const oldCoupleCardLikesSnap = await getDocs(oldCoupleCardLikesQuery);
            oldCoupleCardLikesSnap.forEach(docSnap => batch.delete(docSnap.ref));
            if (oldCoupleCardLikesSnap.size > 0) console.log(`[AuthContext] ${oldCoupleCardLikesSnap.size} docs da antiga 'coupleCardLikes' (raiz) do casal ${user.coupleId} marcados para deleção.`);
        } catch (e) { console.error("[AuthContext] Erro ao limpar antiga 'coupleCardLikes' (raiz)", e); }
    }


    try {
      await batch.commit();
      console.log(`[AuthContext] Reset de dados de teste para ${user.id} (e parceiro, se aplicável) concluído no Firestore.`);
      // Atualiza o estado local para refletir o reset, incluindo as skins
      setUser(currentUser => {
        if (!currentUser) return null;
        return {
          ...currentUser,
        seenCards: [],
        matchedCards: [],
        conexaoAccepted: 0,
        conexaoRejected: 0,
          unlockedSkinIds: [
            'bg_pile_default',
            'bg_match_default',
            'palette_default',
            'font_default',
            'pack_default',
            'palette_vamp_night',      // Adicionada
            'palette_candy_sky'        // Adicionada
          ]
        };
      });
    } catch (error) {
      console.error(`[AuthContext] Erro ao commitar o batch de reset para ${user.id}:`, error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      signup,
      updateUser,
      resetUserTestData,
      checkAndUnlockSkins,
      newlyUnlockedSkinsForModal,
      clearNewlyUnlockedSkinsForModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
