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
  arrayUnion,
  addDoc
} from 'firebase/firestore'; // Removida importação de deleteDoc se não usada diretamente aqui

export interface MatchedCard extends Card {
  isHot?: boolean;
  isCompleted?: boolean;
  createdAt?: Timestamp;
}

export interface User {
  id: string;
  email: string | null;
  username?: string;
  bio?: string;
  linkCode?: string | null; // Código que o usuário gerou para ser usado por outro
  coupleId?: string | null; // ID do documento do casal
  partnerId?: string | null;
  seenCards?: string[];
  conexaoAccepted?: number;
  conexaoRejected?: number;
  userCreatedCards?: Card[];
  matchedCards?: MatchedCard[];
  unlockedSkinIds?: string[];
  createdAt?: Timestamp;
  birthDate?: string; // Formato YYYY-MM-DD
  gender?: string;    // e.g., 'homem_cis', 'mulher_trans', 'nao_binario', etc.
  isSupporter?: boolean;
  isAdmin?: boolean;
  maxIntensity?: number; // Filtro de intensidade máxima para as cartas
  lastVisitedMatchesPage?: Timestamp;
}

interface AuthContextData {
  user: User | null;
  userSymbol: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    username: string,
    birthDate: string,
    gender: string
  ) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
  resetUserTestData: () => Promise<void>;
  checkAndUnlockSkins: (allSkinsData: SkinDefinition[]) => Promise<SkinDefinition[] | null>;
  newlyUnlockedSkinsForModal: SkinDefinition[] | null;
  clearNewlyUnlockedSkinsForModal: () => void;
  submitUserFeedback: (feedbackText: string) => Promise<void>;
  refreshAuthContext: () => void;
  unlinkCouple: () => Promise<void>;
  resetNonMatchedSeenCards: () => Promise<void>;
  // A flag isAdmin pode ser derivada diretamente do objeto user: user?.isAdmin
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSymbol, setUserSymbol] = useState<string | null>(null);
  const [newlyUnlockedSkinsForModal, setNewlyUnlockedSkinsForModal] = useState<SkinDefinition[] | null>(null);

  useEffect(() => {
    // Observa mudanças no estado de autenticação do Firebase.
    // Quando um usuário faz login, busca seus dados do Firestore.
    // Quando o usuário faz logout, limpa o estado local.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        // Ouve por atualizações no documento do usuário em tempo real.
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          const baseUserData: Partial<User> = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || undefined,
          };

          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as Partial<User & { partnerId?: string | null; isSupporter?: boolean; isAdmin?: boolean }>;
            // Combina dados do Firebase Auth com os dados do Firestore
            setUser(currentUserState => ({
              ...baseUserData,
              ...firestoreData,
              // Preserva estados gerenciados no cliente que não vêm do Firestore
              matchedCards: currentUserState?.matchedCards || [],
              userCreatedCards: currentUserState?.userCreatedCards || [],
              // Garante que dados críticos do Auth não sejam sobrescritos
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
              maxIntensity: firestoreData.maxIntensity ?? 8,
            } as User));
          } else {
            // Se o documento não existe, define um estado base para o novo usuário.
            setUser({ ...baseUserData, isSupporter: false, isAdmin: false, matchedCards: [], userCreatedCards: [] } as User);
            console.warn(`[AuthContext] Documento do usuário ${firebaseUser.uid} não encontrado no Firestore via onSnapshot. Será criado no signup se necessário.`);
          }
          setIsLoading(false);
        }, (error) => {
          console.error("[AuthContext] Erro ao ouvir o perfil do usuário no Firestore:", error);
          // Em caso de erro no listener, apenas loga o erro sem alterar o estado do usuário,
          // pois o SDK do Firebase tentará reconectar automaticamente.
          setIsLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        // Usuário deslogado, limpa o estado.
        console.log('[AuthContext] onAuthStateChanged: firebaseUser é null. Definindo user como null.');
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Efeito que busca o símbolo do usuário (ex: '♦' ou '♠') no documento do casal
  // e o mantém sincronizado.
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
      // Limpa o listener quando o componente é desmontado ou as dependências mudam.
      return () => unsubscribe();
    } else {
      // Garante que o símbolo seja nulo se o usuário não estiver em um casal.
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
      const { id, matchedCards: _matchedCards, ...dataToPersist } = updatedData;
      if (Object.keys(dataToPersist).length > 0) {
        await updateDoc(userDocRef, dataToPersist);
        console.log(`[AuthContext] Perfil do usuário ${user.id} atualizado no Firestore.`);
      }
    } catch (error) {
      console.error(`[AuthContext] Firestore: Erro ao persistir atualização do perfil do usuário ${user.id}:`, error);
    }
  }, [user?.id]); // Depend on user.id for stability

  // Efeito de auto-correção (self-healing) para o vínculo do casal.
  // Garante que, se o estado local do usuário indicar um vínculo (coupleId, partnerId)
  // que não é mais válido no Firestore (ex: casal deletado), o estado local
  // seja limpo para evitar inconsistências na UI.
  useEffect(() => {
    const verifyAndHealLink = async () => {
      if (user && user.id && user.coupleId && user.partnerId) {
        try {
          const coupleDocRef = doc(db, 'couples', user.coupleId);
          const coupleDocSnap = await getDoc(coupleDocRef);

          let shouldClearLink = false;
          if (!coupleDocSnap.exists()) {
            console.log(`[AuthContext] Self-healing: Documento do casal ${user.coupleId} não encontrado. Limpando vínculo para usuário ${user.id}.`);
            shouldClearLink = true;
          } else {
            const coupleData = coupleDocSnap.data();
            // Verifica se o usuário ou seu parceiro ainda são membros do casal.
            if (!coupleData.members || !coupleData.members.includes(user.id) || (user.partnerId && !coupleData.members.includes(user.partnerId))) {
              console.log(`[AuthContext] Self-healing: Usuário ${user.id} ou parceiro ${user.partnerId} não consta nos membros do casal ${user.coupleId}. Limpando vínculo.`);
              shouldClearLink = true;
            }
          }

          if (shouldClearLink) {
            // Limpa os dados de vínculo do usuário.
            await updateUser({ partnerId: null, coupleId: null });
          }
        } catch (error) {
          console.error("[AuthContext] Erro durante a auto-correção do vínculo:", error);
        }
      }
    };
    verifyAndHealLink();
  }, [user, updateUser]); // updateUser é memoizado com user.id, e 'user' é a dependência principal aqui.

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: username,
      });
      console.log('[AuthContext] Firebase Auth profile updated with displayName:', username);

      const newLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newUserDocRef = doc(db, 'users', firebaseUser.uid);
      
      // Estrutura inicial do documento do usuário no Firestore.
      const userData: Omit<User, 'id'> = {
        email: firebaseUser.email,
        username: username,
        birthDate: birthDate,
        gender: gender,
        linkCode: newLinkCode,
        partnerId: null,
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
        isSupporter: false, // Novos usuários não são apoiadores por padrão.
        isAdmin: false, // Novos usuários não são administradores por padrão.
        maxIntensity: 8,
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
    // Força o usuário a sempre ver a tela de seleção de conta do Google.
    // Útil para que possam alternar entre contas diferentes.
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Verifica se o usuário já existe no Firestore.
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        // Se for um novo usuário via Google, cria seu documento no Firestore.
        console.log(`[AuthContext] Novo usuário via Google: ${firebaseUser.uid}. Criando documento no Firestore.`);
        const username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0, 6)}`;
        const newLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const userData: Omit<User, 'id'> = {
          email: firebaseUser.email,
          username: username,
          // birthDate e gender não são solicitados no fluxo do Google,
          // o usuário pode preenchê-los mais tarde em seu perfil.
          linkCode: newLinkCode,
          partnerId: null,
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
          isSupporter: false,
          isAdmin: false,
          maxIntensity: 8,
          createdAt: serverTimestamp() as Timestamp,
        };
        await setDoc(userDocRef, userData);
        console.log('[AuthContext] Documento do usuário Google criado no Firestore com sucesso para UID:', firebaseUser.uid);
      } else {
        console.log(`[AuthContext] Usuário ${firebaseUser.uid} já existe no Firestore. Login via Google bem-sucedido.`);
      }
      // O listener onAuthStateChanged/onSnapshot cuidará de atualizar o estado 'user'
      // e definir setIsLoading(false).
    } catch (error: unknown) {
      console.error("[AuthContext] Erro no login com Google:", error);
      setIsLoading(false);
      throw error;
    }
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
    const currentUserId = user?.id;
    if (!user || !currentUserId) {
      console.warn("[AuthContext] checkAndUnlockSkins chamado sem usuário logado.");
      return null;
    }

    const newlyUnlockedSkins: SkinDefinition[] = [];
    const currentUnlockedIds = user.unlockedSkinIds || [];
    const isUserSupporter = user.isSupporter || false;

    allSkinsData.forEach(skin => {
      if (currentUnlockedIds.includes(skin.id)) {
        return; // Pula skins que o usuário já possui.
      }

      let shouldUnlockThisSkin = false;
      const criteria = skin.unlockCriteria;

      if (criteria) {
        // Critério especial para skins de apoiador.
        if (criteria.count === -1) {
          if (isUserSupporter) {
            shouldUnlockThisSkin = true;
          }
        } else {
          // Lógica para critérios normais baseados em contagem.
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
            default:
              break;
          }
        }
      }
      // Skins sem `unlockCriteria` devem ser desbloqueadas de outra forma (ex: no signup).

      if (shouldUnlockThisSkin) {
        newlyUnlockedSkins.push(skin);
      }
    });

    if (newlyUnlockedSkins.length > 0) {
      const newIdsToUnlock = newlyUnlockedSkins.map(s => s.id);
      const updatedUnlockedIds = [...new Set([...currentUnlockedIds, ...newIdsToUnlock])];
      try {
        // Persiste as novas skins no Firestore. O estado local será atualizado
        // automaticamente pelo listener onSnapshot.
        await updateUser({ unlockedSkinIds: updatedUnlockedIds });
        console.log(`[AuthContext] Novas skins desbloqueadas para ${currentUserId}:`, newlyUnlockedSkins.map(s => s.name));
        setNewlyUnlockedSkinsForModal(newlyUnlockedSkins); // Prepara para exibir o modal de notificação.
        return newlyUnlockedSkins;
      } catch (error) {
        console.error(`[AuthContext] Erro ao atualizar skins desbloqueadas para ${currentUserId}:`, error);
      }
    }    
    return newlyUnlockedSkins.length > 0 ? newlyUnlockedSkins : null;
  }, [user, updateUser]);

  const clearNewlyUnlockedSkinsForModal = useCallback(() => {
    setNewlyUnlockedSkinsForModal(null); // Não depende de nada externo, array vazio.
  }, []);

  const resetUserTestData = useCallback(async () => {
    const currentUserId = user?.id;
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

    // Reseta os campos do próprio usuário para seus valores iniciais.
    batch.update(userDocRef, {
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      unlockedSkinIds: defaultUnlockedSkins,
      userCreatedCards: []
    });
    console.log(`[AuthContext] Dados do usuário ${currentUserId} marcados para reset.`);

    // Deleta o histórico de interações de cartas do usuário.
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

    // Se o usuário estiver em um casal, deleta todos os dados associados ao casal.
    if (user.coupleId) {
      // Deleta os "likes" que formaram os matches.
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

      // Deleta os chats e todas as suas mensagens.
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

      // Limpa coleções antigas/depreciadas, se existirem.
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
      // Atualiza o estado local para refletir o reset imediatamente.
      setUser(currentUser => {
        if (!currentUser) return null;
        return {
          ...currentUser,
          seenCards: [],
          conexaoAccepted: 0,
          conexaoRejected: 0,
          unlockedSkinIds: defaultUnlockedSkins,
          userCreatedCards: []
        };
      });
    } catch (error) {
      console.error(`[AuthContext] Erro ao commitar o batch de reset para ${currentUserId}:`, error);
      throw error;
    }
  }, [user?.id, user?.coupleId, user?.isSupporter]);

  const submitUserFeedback = useCallback(async (feedbackText: string) => {
    const currentUserId = user?.id;
    if (!currentUserId) {
      console.warn("[AuthContext] submitUserFeedback chamado sem usuário logado.");
      throw new Error("Usuário não autenticado para enviar feedback.");
    }

    const newTicketData = {
      userId: currentUserId,
      text: feedbackText,
      createdAt: Timestamp.now(),
      status: 'new' as const,
      adminResponse: null,
      respondedAt: null,
    };

    try {
      const ticketsCollectionRef = collection(db, 'tickets');
      const docRef = await addDoc(ticketsCollectionRef, newTicketData);
      
      console.log(`[AuthContext] Feedback enviado pelo usuário ${currentUserId} e salvo no ticket ${docRef.id}`);
      
      // A UI que exibe os tickets agora deve buscar os dados da coleção 'tickets'.
      // Nenhuma atualização de estado local do usuário é mais necessária aqui.

    } catch (error) {
      console.error(`[AuthContext] Erro ao enviar feedback para ${currentUserId}:`, error);
      throw error;
    }
  }, [user?.id]);



  const unlinkCouple = useCallback(async () => {
    if (!user || !user.id || !user.coupleId) {
      console.warn("[AuthContext] unlinkCouple: Usuário não está em um casal.");
      return;
    }

    setIsLoading(true);
    const currentUserId = user.id;
    const coupleIdToDelete = user.coupleId;
    const partnerIdBeingUnlinked = user.partnerId;

    const batch = writeBatch(db);

    // 1. Limpa os dados de vínculo do usuário atual.
    const currentUserDocRef = doc(db, 'users', currentUserId);
    batch.update(currentUserDocRef, {
      partnerId: null,
      coupleId: null,
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      userCreatedCards: [],
      linkCode: null
    });

    // 2. Exclui o documento do casal, o que deleta todas as subcoleções (matches, chats).
    const coupleDocRef = doc(db, 'couples', coupleIdToDelete);
    batch.delete(coupleDocRef);

    try {
      await batch.commit();
      console.log(`[AuthContext] Usuário ${currentUserId} desvinculado. Casal ${coupleIdToDelete} removido. O ex-parceiro (${partnerIdBeingUnlinked}) será atualizado pelo 'self-healing' no próximo login.`);
      // O estado local será atualizado pelo onSnapshot.
    } catch (error) {
      console.error(`[AuthContext] Erro ao desvincular (usuário: ${currentUserId}, casal: ${coupleIdToDelete}):`, error);
      setIsLoading(false);
      throw error;
    }
  }, [user, setIsLoading]);

  const resetNonMatchedSeenCards = useCallback(async () => {
    if (!user || !user.id) {
      console.warn("[AuthContext] resetNonMatchedSeenCards: Usuário não logado.");
      throw new Error("Você precisa estar logado para realizar esta ação.");
    }

    const currentSeenCards = user.seenCards || [];
    const currentMatchedCardIds = (user.matchedCards || []).map(mc => mc.id);

    // Filtra a lista de 'seenCards', mantendo apenas as cartas que também estão na lista de 'matchedCards'.
    // Isso efetivamente "reseta" as cartas que foram vistas mas não resultaram em match.
    const newSeenCards = currentSeenCards.filter(seenId => currentMatchedCardIds.includes(seenId));

    if (newSeenCards.length === currentSeenCards.length) {
      console.log("[AuthContext] Nenhuma carta 'Não Topo!' para resetar.");
      return;
    }

    try {
      await updateUser({ seenCards: newSeenCards });
      console.log(`[AuthContext] Cartas 'Não Topo!' resetadas para o usuário ${user.id}.`);
    } catch (error) {
      console.error(`[AuthContext] Erro ao resetar cartas 'Não Topo!' para ${user.id}:`, error);
      throw error;
    }
  }, [user, updateUser]);


  return (
    <AuthContext.Provider value={{
      user,
      userSymbol,
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
      refreshAuthContext,
      unlinkCouple,
      resetNonMatchedSeenCards
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
