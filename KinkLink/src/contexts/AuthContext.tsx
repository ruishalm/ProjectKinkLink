// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../firebase';
import type { SkinDefinition } from '../config/skins'; // Corrigido o caminho da importação
import type { Card } from '../data/cards';
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
  getDocs
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
  partnerId?: string | null; // Pode ser redundante com linkedPartnerId, verificar uso
  seenCards?: string[];
  conexaoAccepted?: number;
  conexaoRejected?: number;
  userCreatedCards?: Card[];
  matchedCards?: MatchedCard[];
  unlockedSkinIds?: string[];
  createdAt?: Timestamp;
  // Novos campos adicionados:
  birthDate?: string; // Formato YYYY-MM-DD
  sex?: string;       // e.g., 'masculino', 'feminino', 'naoinformar_sexo'
  gender?: string;    // e.g., 'homem_cis', 'mulher_trans', 'nao_binario', etc.
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    username: string,
    birthDate: string, // Novo parâmetro
    sex: string,       // Novo parâmetro
    gender: string     // Novo parâmetro
  ) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  resetUserTestData: () => Promise<void>;
  checkAndUnlockSkins: (allSkinsData: SkinDefinition[]) => Promise<SkinDefinition[] | null>;
  newlyUnlockedSkinsForModal: SkinDefinition[] | null;
  clearNewlyUnlockedSkinsForModal: () => void;
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
          const baseUserData: Partial<User> = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || undefined,
          };

          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as Partial<User & { partnerId?: string | null }>;
            setUser({
              ...baseUserData,
              ...firestoreData,
              id: firebaseUser.uid,
              email: firebaseUser.email,
              username: firestoreData.username || baseUserData.username,
              linkedPartnerId: firestoreData.linkedPartnerId || firestoreData.partnerId || null,
              coupleId: firestoreData.coupleId || null,
              unlockedSkinIds: firestoreData.unlockedSkinIds || [],
              // Incluir os novos campos se existirem no Firestore
              birthDate: firestoreData.birthDate || undefined,
              sex: firestoreData.sex || undefined,
              gender: firestoreData.gender || undefined,
            } as User);
          } else {
            setUser(baseUserData as User);
            console.warn(`[AuthContext] Documento do usuário ${firebaseUser.uid} não encontrado no Firestore via onSnapshot. Será criado no signup se necessário.`);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("[AuthContext] Erro ao ouvir o perfil do usuário no Firestore:", error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || undefined
          } as User);
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

  const signup = async (
    email: string,
    password: string,
    username: string,
    birthDate: string,
    sex: string,
    gender: string
  ) => {
    console.log('[AuthContext] Iniciando signup para:', email, 'com username:', username, 'birthDate:', birthDate, 'sex:', sex, 'gender:', gender);
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: username,
      });
      console.log('[AuthContext] Firebase Auth profile updated with displayName:', username);

      const newLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newUserDocRef = doc(db, 'users', firebaseUser.uid);
      
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email,
        username: username,
        birthDate: birthDate, // Salvar data de nascimento
        sex: sex,             // Salvar sexo
        gender: gender,       // Salvar gênero
        linkCode: newLinkCode,
        linkedPartnerId: null,
        coupleId: null,
        seenCards: [],
        conexaoAccepted: 0,
        conexaoRejected: 0,
        unlockedSkinIds: [
          'bg_pile_default',
          'bg_match_default',
          'palette_default',
          'font_default',
          'pack_default',
          'palette_vamp_night',
          'palette_candy_sky'
        ],
        createdAt: serverTimestamp() as Timestamp,
      };
      await setDoc(newUserDocRef, userData);
      console.log('[AuthContext] Documento do usuário criado no Firestore com sucesso para UID:', firebaseUser.uid);
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

  const requestPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("[AuthContext] E-mail de redefinição de senha enviado para:", email);
    } catch (error) {
      console.error("[AuthContext] Erro ao enviar e-mail de redefinição de senha:", error);
      throw error;
    }
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user || !user.id) {
      console.warn("updateUser chamado sem usuário logado ou ID do usuário.");
      return;
    }
    
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, ...updatedData };
    });

    const userDocRef = doc(db, 'users', user.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, matchedCards: _matchedCards, ...dataToPersist } = updatedData;
      if (Object.keys(dataToPersist).length > 0) {
        await updateDoc(userDocRef, dataToPersist);
        console.log(`[AuthContext] Perfil do usuário ${user.id} atualizado no Firestore.`);
      }
    } catch (error) {
      console.error(`[AuthContext] Firestore: Erro ao persistir atualização do perfil do usuário ${user.id}:`, error);
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
      const updatedUnlockedIds = [...new Set([...currentUnlockedIds, ...newIdsToUnlock])];
      try {
        await updateUser({ unlockedSkinIds: updatedUnlockedIds });
        console.log(`[AuthContext] Novas skins desbloqueadas para ${user.id}:`, newlyUnlockedSkins.map(s => s.name));
        setNewlyUnlockedSkinsForModal(newlyUnlockedSkins);
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

    const defaultUnlockedSkins = [
      'bg_pile_default',
      'bg_match_default',
      'palette_default',
      'font_default',
      'pack_default',
      'palette_vamp_night',
      'palette_candy_sky'
    ];

    batch.update(userDocRef, {
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      unlockedSkinIds: defaultUnlockedSkins
    });
    console.log(`[AuthContext] Dados do usuário ${user.id} (incluindo skins desbloqueadas) marcados para reset.`);

    const userInteractionsQuery = query(collection(db, 'cardInteractions'), where('userId', '==', user.id));
    try {
      const userInteractionsSnap = await getDocs(userInteractionsQuery);
      userInteractionsSnap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      if (userInteractionsSnap.size > 0) console.log(`[AuthContext] ${userInteractionsSnap.size} interações antigas (cardInteractions) do usuário ${user.id} marcadas para deleção.`);
    } catch (error) {
      console.error(`[AuthContext] Erro ao buscar interações antigas (cardInteractions) do usuário ${user.id} para deleção:`, error);
    }

    if (user.coupleId) {
      const likedInteractionsPath = `couples/${user.coupleId}/likedInteractions`;
      const likedInteractionsQuery = query(collection(db, likedInteractionsPath));
      try {
        const likedInteractionsSnap = await getDocs(likedInteractionsQuery);
        likedInteractionsSnap.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        if (likedInteractionsSnap.size > 0) console.log(`[AuthContext] ${likedInteractionsSnap.size} documentos da subcoleção '${likedInteractionsPath}' marcados para deleção.`);
      } catch (error) {
        console.error(`[AuthContext] Erro ao buscar documentos da subcoleção '${likedInteractionsPath}' para deleção:`, error);
      }

      const cardChatsBasePath = `couples/${user.coupleId}/cardChats`;
      const cardChatsQuery = query(collection(db, cardChatsBasePath));
      try {
        const cardChatsSnap = await getDocs(cardChatsQuery);
        for (const chatDoc of cardChatsSnap.docs) {
          const messagesPath = `${cardChatsBasePath}/${chatDoc.id}/messages`;
          const messagesQuery = query(collection(db, messagesPath));
          const messagesSnap = await getDocs(messagesQuery);
          messagesSnap.forEach(msgDoc => batch.delete(msgDoc.ref));
          if (messagesSnap.size > 0) console.log(`[AuthContext] ${messagesSnap.size} mensagens do chat ${chatDoc.id} marcadas para deleção.`);
          batch.delete(chatDoc.ref);
        }
        if (cardChatsSnap.size > 0) console.log(`[AuthContext] ${cardChatsSnap.size} documentos de chat (cardChats) e suas mensagens marcados para deleção.`);
      } catch (error) {
        console.error(`[AuthContext] Erro ao buscar/deletar chats (cardChats) para o casal ${user.coupleId}:`, error);
      }

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
      setUser(currentUser => {
        if (!currentUser) return null;
        return {
          ...currentUser,
          seenCards: [],
          conexaoAccepted: 0,
          conexaoRejected: 0,
          unlockedSkinIds: defaultUnlockedSkins
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
      requestPasswordReset,
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
