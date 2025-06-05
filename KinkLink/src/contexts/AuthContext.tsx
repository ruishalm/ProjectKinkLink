// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider, // Importar GoogleAuthProvider
  signInWithPopup     // Importar signInWithPopup
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
  getDocs,
  getDoc
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
  // sex?: string; // Campo removido do signup, manter opcional se usado em outros lugares ou remover completamente
  gender?: string;    // e.g., 'homem_cis', 'mulher_trans', 'nao_binario', etc.
  isSupporter?: boolean; // Novo campo para indicar se o usuário é um apoiador
}

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>; // Nova função
  requestPasswordReset: (email: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    username: string,
    birthDate: string, // Novo parâmetro
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
            const firestoreData = docSnap.data() as Partial<User & { partnerId?: string | null; isSupporter?: boolean }>;
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
              gender: firestoreData.gender || undefined,
              isSupporter: firestoreData.isSupporter || false, // Carrega o status de apoiador
            } as User);
          } else {
            // Se o documento não existe, isSupporter será false por padrão
            setUser({ ...baseUserData, isSupporter: false } as User);
            console.warn(`[AuthContext] Documento do usuário ${firebaseUser.uid} não encontrado no Firestore via onSnapshot. Será criado no signup se necessário.`);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("[AuthContext] Erro ao ouvir o perfil do usuário no Firestore:", error);
          // Fallback com isSupporter como false
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || undefined,
            isSupporter: false
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
        isSupporter: false, // Apoiador padrão é false no signup
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

  const loginWithGoogle = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Verificar se o usuário já existe no Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Usuário novo via Google, criar documento no Firestore
        console.log(`[AuthContext] Novo usuário via Google: ${firebaseUser.uid}. Criando documento no Firestore.`);
        const username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0, 6)}`;
        const newLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Para usuários do Google, birthDate, sex, e gender não são coletados no login inicial.
        // Eles podem ser solicitados posteriormente no perfil ou em um fluxo de onboarding.
        const userData: Omit<User, 'id'> = {
          email: firebaseUser.email,
          username: username,
          // birthDate, sex, gender podem ser undefined ou ter um valor padrão "não informado"
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
          isSupporter: false, // Apoiador padrão é false no signup com Google
          createdAt: serverTimestamp() as Timestamp,
        };
        await setDoc(userDocRef, userData);
        console.log('[AuthContext] Documento do usuário Google criado no Firestore com sucesso para UID:', firebaseUser.uid);
      } else {
        console.log(`[AuthContext] Usuário ${firebaseUser.uid} já existe no Firestore. Login via Google bem-sucedido.`);
        // O onSnapshot já deve cuidar de atualizar o estado 'user'
      }
      // O onAuthStateChanged e o onSnapshot devem lidar com a atualização do estado 'user'
      // e setIsLoading(false)
    } catch (error: unknown) {
      console.error("[AuthContext] Erro no login com Google:", error);
      // Tratar erros específicos do Google Sign-In se necessário
      // Ex: error.code === 'auth/popup-closed-by-user'
      setIsLoading(false);
      throw error;
    }
    // setIsLoading(false) é chamado pelo onAuthStateChanged/onSnapshot
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
    const isUserSupporter = user.isSupporter || false; // Pega o status de apoiador do objeto user

    allSkinsData.forEach(skin => {
      // Pula se a skin já estiver desbloqueada
      if (currentUnlockedIds.includes(skin.id)) {
        return;
      }

      let shouldUnlockThisSkin = false;
      const criteria = skin.unlockCriteria;

      if (criteria) {
        // Verifica primeiro se é uma skin de apoiador (marcada com count: -1)
        if (criteria.count === -1) {
          if (isUserSupporter) {
            shouldUnlockThisSkin = true; // Desbloqueia se o usuário for apoiador
          }
          // Se não for apoiador, esta skin específica (de apoiador) permanece bloqueada
        } else {
          // Lógica para critérios de desbloqueio normais (não de apoiador)
          switch (criteria.type) {
            case 'matches':
              shouldUnlockThisSkin = (user.matchedCards?.length || 0) >= criteria.count;
              break;
            case 'seenCards':
              shouldUnlockThisSkin = (user.seenCards?.length || 0) >= criteria.count;
              break;
            case 'userCreatedCards':
              shouldUnlockThisSkin = (user.userCreatedCards?.length || 0) >= criteria.count;
              break;
            // Skins com type: 'default' geralmente são pré-desbloqueadas no signup.
            // Se precisar de uma lógica dinâmica para elas aqui, adicione um case.
            default:
              // Tipo de critério desconhecido ou não aplicável para desbloqueio dinâmico aqui
              break;
          }
        }
      }
      // Skins sem nenhum unlockCriteria não são processadas para desbloqueio dinâmico aqui.
      // Elas devem ser incluídas no `unlockedSkinIds` inicial se forem padrão.

      if (shouldUnlockThisSkin) {
        newlyUnlockedSkins.push(skin);
      }
    });

    if (newlyUnlockedSkins.length > 0) {
      const newIdsToUnlock = newlyUnlockedSkins.map(s => s.id);
      const updatedUnlockedIds = [...new Set([...currentUnlockedIds, ...newIdsToUnlock])];
      try {
        // O estado de `user` (incluindo `unlockedSkinIds`) será atualizado pelo onSnapshot
        // após a atualização bem-sucedida do Firestore.
        await updateUser({ unlockedSkinIds: updatedUnlockedIds });
        console.log(`[AuthContext] Novas skins desbloqueadas para ${user.id}:`, newlyUnlockedSkins.map(s => s.name));
        setNewlyUnlockedSkinsForModal(newlyUnlockedSkins);
        return newlyUnlockedSkins;
      } catch (error) {
        console.error(`[AuthContext] Erro ao atualizar skins desbloqueadas para ${user.id}:`, error);
      }
    }    
    return newlyUnlockedSkins.length > 0 ? newlyUnlockedSkins : null;
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
      loginWithGoogle,
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
