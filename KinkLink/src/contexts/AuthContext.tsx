import React, { createContext, useState, useContext, useEffect, type ReactNode, useCallback } from 'react'; // Adicionado useCallback
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
  type DocumentSnapshot,
  query,
  where,
  getDocs,
  getDoc,
  arrayUnion
} from 'firebase/firestore'; // Removida importação de deleteDoc se não usada diretamente aqui

export interface MatchedCard extends Card {
  isHot?: boolean;
  isCompleted?: boolean; // Novo campo para marcar cartas como realizadas
  createdAt?: Timestamp; // <<< ADICIONADO
}

export interface UserFeedback {
  id: string; // ID único para o feedback, pode ser gerado no cliente
  text: string;
  createdAt: Timestamp;
  status: 'new' | 'seen' | 'resolved' | 'admin_replied'; // Status do feedback
  adminResponse?: string; // Resposta do administrador
  respondedAt?: Timestamp; // Quando o administrador respondeu
}


export interface User {
  id: string;
  email: string | null;
  username?: string;
  bio?: string;
  linkCode?: string | null; // Código que o usuário gerou para ser usado por outro
  coupleId?: string | null; // ID do documento do casal
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
  gender?: string;    // e.g., 'homem_cis', 'mulher_trans', 'nao_binario', etc.
  isSupporter?: boolean; // Novo campo para indicar se o usuário é um apoiador
  isAdmin?: boolean; // Campo para status de admin lido do Firestore
  feedbackTickets?: UserFeedback[]; // Novo campo para os tickets de feedback
  maxIntensity?: number; // Filtro de intensidade máxima para as cartas
  lastVisitedMatchesPage?: Timestamp; // <<< NOVO CAMPO
  // fcmToken?: string | null; // Removido - será gerenciado pelo NotificationContext se necessário
} // Adicionado fcmToken aqui

interface AuthContextData {
  user: User | null;
  userSymbol: string | null; // <<< ADICIONADO
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
  submitUserFeedback: (feedbackText: string) => Promise<void>; // Nova função
  refreshAuthContext: () => void; // <<< ADICIONADO
  unlinkCouple: () => Promise<void>; // Função para desvincular
  deleteUserFeedbackTicket: (ticketId: string) => Promise<void>; // <<< NOVA FUNÇÃO PARA DELETAR TICKET
  resetNonMatchedSeenCards: () => Promise<void>; // Nova função para resetar cartas "Não Topo!"  
  // requestNotificationPermission?: () => Promise<void>; // Opcional: se quiser um botão para pedir permissão
  // isAdmin flag can be derived from user object: user?.isAdmin
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSymbol, setUserSymbol] = useState<string | null>(null); // <<< ADICIONADO
  const [newlyUnlockedSkinsForModal, setNewlyUnlockedSkinsForModal] = useState<SkinDefinition[] | null>(null);
  // const [fcmTokenProcessed, setFcmTokenProcessed] = useState(false); // REMOVIDO - Movido para NotificationContext
  // O estado 'isAdmin' separado não é mais necessário se 'user.isAdmin' for a fonte da verdade.

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          const baseUserData: Partial<User> = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || undefined,
            // isAdmin será preenchido pelos dados do Firestore abaixo
          };

          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as Partial<User & { partnerId?: string | null; isSupporter?: boolean; isAdmin?: boolean }>;
            setUser(currentUserState => ({
              ...baseUserData, // Dados base do Firebase Auth (id, email, username inicial)
              ...firestoreData, // Dados do documento do Firestore
              // Preserva campos gerenciados no cliente que não estão no documento do usuário no Firestore
              matchedCards: currentUserState?.matchedCards || [], // Mantém os matchedCards existentes
              userCreatedCards: currentUserState?.userCreatedCards || [], // Mantém os userCreatedCards existentes (se aplicável)
              // Garante que os dados principais do Firebase Auth não sejam sobrescritos por dados possivelmente obsoletos do Firestore
              id: firebaseUser.uid,
              email: firebaseUser.email,
              username: firestoreData.username || baseUserData.username,
              partnerId: firestoreData.partnerId || null,
              coupleId: firestoreData.coupleId || null,
              unlockedSkinIds: firestoreData.unlockedSkinIds || [],
              birthDate: firestoreData.birthDate || undefined,
              gender: firestoreData.gender || undefined,
              isSupporter: firestoreData.isSupporter || false,
              isAdmin: firestoreData.isAdmin || false,
              feedbackTickets: firestoreData.feedbackTickets || [],
              maxIntensity: firestoreData.maxIntensity ?? 8, // Adiciona o campo com fallback
              // fcmToken: currentUserState?.fcmToken || null, // Removido
            } as User));
          } else {
            // Documento não existe, provavelmente novo usuário ou erro. Definir estado base.
            // Também inicializa os campos gerenciados no cliente aqui
            setUser({ ...baseUserData, isSupporter: false, isAdmin: false, feedbackTickets: [], matchedCards: [], userCreatedCards: [] } as User);
            console.warn(`[AuthContext] Documento do usuário ${firebaseUser.uid} não encontrado no Firestore via onSnapshot. Será criado no signup se necessário.`);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("[AuthContext] Erro ao ouvir o perfil do usuário no Firestore:", error);
          // Em caso de erro no listener do perfil, não resetar o 'user' state drasticamente.
          // Apenas logar o erro. O Firebase tentará reconectar o listener.
          // Se o erro for persistente (ex: permissões revogadas), o usuário pode precisar
          // ser deslogado ou o app pode ficar em estado inconsistente.
          // Por agora, evitamos limpar 'user.coupleId' ou 'user.matchedCards' que podem
          // ter sido populados anteriormente.
          // Apenas garantimos que isLoading seja false.
          setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        console.log('[AuthContext] onAuthStateChanged: firebaseUser é null. Definindo user como null.');
        setUser(null);
        // setFcmTokenProcessed(false); // REMOVIDO - NotificationContext cuidará disso
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // NOVO Efeito para solicitar permissão de notificação e salvar token FCM
  // O useEffect para setupFcm foi MOVIDO para NotificationContext.tsx

  // <<< ADICIONADO: useEffect para buscar o símbolo do usuário
  useEffect(() => {
    if (user?.coupleId && user.id) {
      const coupleDocRef = doc(db, 'couples', user.coupleId);
      const unsubscribe = onSnapshot(coupleDocRef, (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const coupleData = docSnap.data();
          if (coupleData.memberSymbols) {
            const symbol = coupleData.memberSymbols[user.id];
            setUserSymbol(symbol || null);
          }
        } else {
          setUserSymbol(null);
        }
      });
      // Limpa o listener quando o usuário desloga ou o coupleId muda
      return () => unsubscribe();
    } else {
      // Garante que o símbolo seja limpo se o usuário não tiver um coupleId
      setUserSymbol(null);
    }
  }, [user?.id, user?.coupleId]);

  const refreshAuthContext = useCallback(() => {
    const fetchUserProfile = async (firebaseUser: FirebaseUser) => {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
      }
    };
    if (auth.currentUser) {
      console.log("[AuthContext] Forçando atualização do perfil do usuário...");
      setIsLoading(true);
      fetchUserProfile(auth.currentUser).finally(() => setIsLoading(false));
    }
  }, []);

  const updateUser = useCallback(async (updatedData: Partial<User>) => {
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
  }, [user]); // Depend on user for stability

  // REMOVIDO: Self-healing simplificado
  // O novo sistema atômico garante consistência, eliminando a necessidade de correções frequentes
  // Se houver inconsistências por operações manuais no Firestore, devem ser resolvidas via Cloud Functions
  // ou ferramentas administrativas, não no cliente a cada render

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // setFcmTokenProcessed(false); // REMOVIDO - NotificationContext cuidará disso
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
    console.log('[AuthContext] Iniciando signup para:', email, 'com username:', username, 'birthDate:', birthDate, 'gender:', gender);
    setIsLoading(true);
    try {
      // setFcmTokenProcessed(false); // REMOVIDO - NotificationContext cuidará disso
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
        partnerId: null, // MODIFICADO: linkedPartnerId para partnerId
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
        isAdmin: false, // Usuários padrão não são admins
        feedbackTickets: [], // Inicializa feedbackTickets como array vazio
        maxIntensity: 8, // Filtro desativado por padrão
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
    // Adiciona esta linha para forçar o seletor de contas:
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      // setFcmTokenProcessed(false); // REMOVIDO - NotificationContext cuidará disso
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

      
        // Eles podem ser solicitados posteriormente no perfil ou em um fluxo de onboarding.
        const userData: Omit<User, 'id'> = {
          email: firebaseUser.email,
          username: username,
          // birthDate, gender podem ser undefined ou ter um valor padrão "não informado"
          linkCode: newLinkCode, // Código para ser usado por outro
          partnerId: null, // MODIFICADO: linkedPartnerId para partnerId
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
          isAdmin: false, // Usuários padrão não são admins
          feedbackTickets: [], // Inicializa feedbackTickets como array vazio
          maxIntensity: 8, // Filtro desativado por padrão
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
      console.log('[AuthContext] Função logout() chamada. Deslogando usuário...');
      // setFcmTokenProcessed(false) já é chamado no onAuthStateChanged quando firebaseUser se torna null
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

  const checkAndUnlockSkins = useCallback(async (allSkinsData: SkinDefinition[]): Promise<SkinDefinition[] | null> => {
    // Use user from closure, but depend on user.id for stability if needed by other hooks.
    // For this function, direct use of 'user' from closure is fine if its own stability isn't critical for other useEffects.
    // However, it calls updateUser, so its stability matters if it's a dep elsewhere.
    const currentUserId = user?.id;
    if (!user || !currentUserId) {
      console.warn("[AuthContext] checkAndUnlockSkins chamado sem usuário logado.");
      return null;
    }

    const newlyUnlockedSkins: SkinDefinition[] = [];
    const currentUnlockedIds = user.unlockedSkinIds || [];
    const isUserSupporter = user.isSupporter || false;

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
        await updateUser({ unlockedSkinIds: updatedUnlockedIds }); // updateUser will use its own captured user.id
        console.log(`[AuthContext] Novas skins desbloqueadas para ${currentUserId}:`, newlyUnlockedSkins.map(s => s.name));
        setNewlyUnlockedSkinsForModal(newlyUnlockedSkins);
        return newlyUnlockedSkins;
      } catch (error) {
        console.error(`[AuthContext] Erro ao atualizar skins desbloqueadas para ${currentUserId}:`, error);
      }
    }    
    return newlyUnlockedSkins.length > 0 ? newlyUnlockedSkins : null;
  }, [user, updateUser]); // Keep 'user' if it reads many fields from it. 'updateUser' is now stable.

  const clearNewlyUnlockedSkinsForModal = useCallback(() => {
    setNewlyUnlockedSkinsForModal(null); // Não depende de nada externo, array vazio.
  }, []);

  const resetUserTestData = useCallback(async () => {
    // Corrigido para usar user?.id consistentemente
    const currentUserId = user?.id; // Use user.id from the captured 'user' state
    if (!currentUserId) {
      console.warn("resetUserTestData chamado sem usuário logado.");
      return;
    }
    console.log(`[AuthContext] Iniciando reset de dados de teste para o usuário ${currentUserId}`);
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
      unlockedSkinIds: defaultUnlockedSkins,
      userCreatedCards: [] // Adiciona esta linha para limpar as cartas criadas pelo usuário
    });
    console.log(`[AuthContext] Dados do usuário ${currentUserId} (incluindo skins desbloqueadas) marcados para reset.`);

    const userInteractionsQuery = query(collection(db, 'cardInteractions'), where('userId', '==', currentUserId));
    try {
      const userInteractionsSnap = await getDocs(userInteractionsQuery);
      userInteractionsSnap.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      if (userInteractionsSnap.size > 0) console.log(`[AuthContext] ${userInteractionsSnap.size} interações antigas (cardInteractions) do usuário ${currentUserId} marcadas para deleção.`);
    } catch (error) {
      console.error(`[AuthContext] Erro ao buscar interações antigas (cardInteractions) do usuário ${currentUserId} para deleção:`, error);
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
      console.log(`[AuthContext] Reset de dados de teste para ${currentUserId} (e parceiro, se aplicável) concluído no Firestore.`);
      setUser(currentUser => {
        if (!currentUser) return null;
        return {
          ...currentUser,
          seenCards: [],
          conexaoAccepted: 0,
          conexaoRejected: 0,
          unlockedSkinIds: defaultUnlockedSkins,
          userCreatedCards: [] // Também atualiza o estado local
        };
      });
    } catch (error) {
      console.error(`[AuthContext] Erro ao commitar o batch de reset para ${currentUserId}:`, error);
      throw error;
    }
  }, [user?.id, user?.coupleId]); // Removido user?.isSupporter (desnecessário)

  const submitUserFeedback = useCallback(async (feedbackText: string) => {
    const currentUserId = user?.id;
    if (!currentUserId) {
      console.warn("[AuthContext] submitUserFeedback chamado sem usuário logado.");
      throw new Error("Usuário não autenticado para enviar feedback.");
    }
    const newTicket: UserFeedback = {
      // Gera um ID único para o ticket usando o mesmo método que o Firestore usaria para um novo doc
      id: doc(collection(db, 'temp_ids_for_generation')).id, 
      text: feedbackText,
      createdAt: Timestamp.now(), // Usa Timestamp.now() para consistência imediata
      status: 'new' as const
    };
    const userDocRef = doc(db, 'users', currentUserId);
    try {
      await updateDoc(userDocRef, {
        feedbackTickets: arrayUnion(newTicket)
      });
      // Atualiza o estado local do usuário para refletir o novo ticket
      setUser(currentUser => (currentUser && currentUser.id === currentUserId) ? ({
        ...currentUser,
        feedbackTickets: [...(currentUser.feedbackTickets || []), newTicket]
      }) : currentUser); // If condition not met, return current user, not null
      console.log(`[AuthContext] Feedback enviado pelo usuário ${currentUserId}: ${newTicket.id}`);
    } catch (error) {
      console.error(`[AuthContext] Erro ao enviar feedback para ${currentUserId}:`, error);
      throw error;
    }
  }, [user?.id]); // Depend on user.id

  const deleteUserFeedbackTicket = useCallback(async (ticketId: string) => {
    const currentUserId = user?.id;
    if (!currentUserId) {
      console.warn("[AuthContext] deleteUserFeedbackTicket chamado sem usuário logado.");
      throw new Error("Usuário não autenticado para deletar o ticket.");
    }
    if (!user.feedbackTickets || user.feedbackTickets.length === 0) {
      console.warn("[AuthContext] Nenhum ticket de feedback para deletar.");
      return; // Não há tickets para deletar
    }

    const updatedTickets = user.feedbackTickets.filter(ticket => ticket.id !== ticketId);

    if (updatedTickets.length === user.feedbackTickets.length) {
      console.warn(`[AuthContext] Ticket com ID ${ticketId} não encontrado para o usuário ${currentUserId}.`);
      // Pode lançar um erro ou apenas retornar se o ticket não foi encontrado
      return;
    }

    try {
      // updateUser já lida com a atualização do estado local e do Firestore
      await updateUser({ feedbackTickets: updatedTickets });
      console.log(`[AuthContext] Ticket ${ticketId} deletado para o usuário ${currentUserId}.`);
    } catch (error) {
      console.error(`[AuthContext] Erro ao deletar ticket ${ticketId} para ${currentUserId}:`, error);
      throw error;
    }
  }, [user, updateUser]); // Depende de 'user' para ler os tickets e 'updateUser' para persistir

  const unlinkCouple = useCallback(async () => {
    if (!user || !user.id || !user.coupleId || !user.partnerId) {
      console.warn("[AuthContext] unlinkCouple: Usuário não está em um casal ou dados do usuário estão incompletos para desvincular.");
      return;
    }

    setIsLoading(true);
    const currentUserId = user.id;
    const coupleIdToDelete = user.coupleId;
    const partnerIdToUnlink = user.partnerId;

    try {
      // Importamos e usamos a função do linkService que faz tudo atomicamente
      const { unlinkCouple: unlinkCoupleService } = await import('../services/linkService');
      await unlinkCoupleService(currentUserId, partnerIdToUnlink, coupleIdToDelete);
      console.log(`[AuthContext] Desvinculação completa via linkService.`);
      // O onSnapshot atualizará automaticamente o estado do usuário
    } catch (error) {
      console.error(`[AuthContext] Erro ao desvincular:`, error);
      setIsLoading(false);
      throw error;
    }
    // setIsLoading(false) será chamado quando o onSnapshot detectar as mudanças
  }, [user, setIsLoading]);

  const resetNonMatchedSeenCards = useCallback(async () => {
    if (!user || !user.id) {
      console.warn("[AuthContext] resetNonMatchedSeenCards: Usuário não logado.");
      throw new Error("Você precisa estar logado para realizar esta ação.");
    }

    const currentSeenCards = user.seenCards || [];
    const currentMatchedCardIds = (user.matchedCards || []).map(mc => mc.id);

    // Mantém em seenCards apenas aquelas que também são matches.
    // Todas as outras (vistas mas não resultaram em match) serão removidas de seenCards.
    const newSeenCards = currentSeenCards.filter(seenId => currentMatchedCardIds.includes(seenId));

    if (newSeenCards.length === currentSeenCards.length) {
      // Nenhuma carta foi efetivamente "descartada" (todas as vistas são matches, ou não há vistas/matches)
      console.log("[AuthContext] Nenhuma carta 'Não Topo!' para resetar.");
      // Poderia retornar uma mensagem para a UI aqui se quisesse.
      // Por ora, apenas não faz a atualização se não houver mudança.
      return;
    }

    try {
      await updateUser({ seenCards: newSeenCards });
      console.log(`[AuthContext] Cartas 'Não Topo!' resetadas para o usuário ${user.id}. Novas seenCards:`, newSeenCards);
    } catch (error) {
      console.error(`[AuthContext] Erro ao resetar cartas 'Não Topo!' para ${user.id}:`, error);
      throw error; // Relança para a UI tratar
    }
  }, [user, updateUser]);


  return (
    <AuthContext.Provider value={{
      user,
      userSymbol, // <<< ADICIONADO
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
      clearNewlyUnlockedSkinsForModal,
      submitUserFeedback,
      refreshAuthContext, // <<< ADICIONADO
      unlinkCouple,
      deleteUserFeedbackTicket, // <<< ADICIONA A FUNÇÃO AO CONTEXTO
      resetNonMatchedSeenCards // Adiciona a nova função ao contexto
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
