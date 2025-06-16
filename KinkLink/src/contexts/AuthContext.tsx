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
  query,
  where,
  getDocs,
  getDoc,
  arrayUnion // Importar arrayUnion
} from 'firebase/firestore';

export interface MatchedCard extends Card {
  isHot?: boolean;
  isCompleted?: boolean; // Novo campo para marcar cartas como realizadas
}

export interface UserFeedback {
  id: string; // ID único para o feedback, pode ser gerado no cliente
  text: string;
  createdAt: Timestamp;
  status: 'new' | 'seen' | 'resolved'; // Status do feedback
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
  submitUserFeedback: (feedbackText: string) => Promise<void>; // Nova função
  unlinkCouple: () => Promise<void>; // Função para desvincular
  resetNonMatchedSeenCards: () => Promise<void>; // Nova função para resetar cartas "Não Topo!"
  // isAdmin flag can be derived from user object: user?.isAdmin
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlockedSkinsForModal, setNewlyUnlockedSkinsForModal] = useState<SkinDefinition[] | null>(null);
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
        setUser(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
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
  }, [user?.id]); // Depend on user.id for stability

  // Efeito para auto-correção do vínculo (self-healing)
  useEffect(() => {
    const verifyAndHealLink = async () => {
      // Verifica se o usuário está logado, possui um coupleId e um partnerId.
      // A verificação de user.id garante que temos um usuário válido.
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
            // Verifica se o usuário atual ou o parceiro registrado ainda são membros do casal.
            // Isso cobre o caso onde o documento do casal existe, mas os membros foram alterados.
            if (!coupleData.members || !coupleData.members.includes(user.id) || (user.partnerId && !coupleData.members.includes(user.partnerId))) {
              console.log(`[AuthContext] Self-healing: Usuário ${user.id} ou parceiro ${user.partnerId} não consta nos membros do casal ${user.coupleId}. Limpando vínculo.`);
              shouldClearLink = true;
            }
          }

          if (shouldClearLink) {
            // Chama updateUser para limpar partnerId e coupleId no Firestore e no estado local.
            // A condição no início deste if (user.coupleId && user.partnerId) previne loops desnecessários
            // se o estado já estiver limpo mas o efeito rodar novamente por outra dependência.
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
  }, [user?.id, user?.coupleId, user?.isSupporter]); // Adicionado user?.isSupporter se defaultUnlockedSkins depender dele

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

  const unlinkCouple = useCallback(async () => {
    if (!user || !user.id || !user.coupleId) {
      console.warn("[AuthContext] unlinkCouple: Usuário não está em um casal ou dados do usuário estão incompletos para desvincular.");
      // Pode ser útil lançar um erro para a UI tratar, se apropriado.
      // Ex: throw new Error("Você não está atualmente vinculado ou não foi possível obter seus dados.");
      return;
    }

    // Considerar um estado de loading específico para desvinculação se for uma operação demorada
    // e o isLoading global for muito genérico. Por ora, usamos o global.
    setIsLoading(true);
    const currentUserId = user.id;
    const coupleIdToDelete = user.coupleId;
    const partnerIdBeingUnlinked = user.partnerId; // Para log

    const batch = writeBatch(db);

    // 1. Atualiza o documento do usuário atual
    const currentUserDocRef = doc(db, 'users', currentUserId);
    batch.update(currentUserDocRef, {
      partnerId: null,
      coupleId: null,
      // Adicionar outros campos a serem resetados no desvínculo, se necessário (ex: seenCards, etc.)
      // como já está sendo feito na LinkCouplePage.tsx
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      userCreatedCards: [],
      linkCode: null
    });

    // 2. Exclui o documento do casal
    const coupleDocRef = doc(db, 'couples', coupleIdToDelete);
    batch.delete(coupleDocRef);

    try {
      await batch.commit();
      console.log(`[AuthContext] Usuário ${currentUserId} desvinculado via unlinkCouple. Casal ${coupleIdToDelete} removido. Ex-parceiro ${partnerIdBeingUnlinked || 'N/A'} será atualizado via self-healing.`);
      // O estado local do usuário atual será atualizado pelo listener onSnapshot.
    } catch (error) {
      console.error(`[AuthContext] Erro ao desvincular (usuário: ${currentUserId}, casal: ${coupleIdToDelete}):`, error);
      setIsLoading(false); // Garante que o loading pare em caso de erro.
      throw error; // Relança o erro para a UI poder tratar, se necessário.
    }
    // O setIsLoading(false) principal será tratado pelo onSnapshot ao receber os dados atualizados do usuário.
  }, [user, setIsLoading]); // updateUser não é necessário como dependência aqui pois o onSnapshot cuidará da atualização do estado local.

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
      unlinkCouple,
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
