// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, db } from '../firebase'; // Importa auth e db do seu firebase.ts
import type { Card } from '../data/cards';
import { doc, setDoc, updateDoc, Timestamp, serverTimestamp, onSnapshot } from 'firebase/firestore'; // Removido getDoc

// Interface para cartas que deram match, incluindo o status "hot"
export interface MatchedCard extends Card {
  isHot?: boolean;
}

// Define a interface para o objeto do usuário
export interface User {
  id: string; // Firebase Authentication UID
  email: string | null;
  username?: string;
  bio?: string;
  linkCode?: string | null;
  linkedPartnerId?: string | null;
  seenCards?: string[];
  conexaoAccepted?: number;
  conexaoRejected?: number;
  userCreatedCards?: Card[];
  matchedCards?: MatchedCard[];
  createdAt?: Timestamp;
}

// Define a interface para os dados do contexto de autenticação
interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  updateUser: (updatedData: Partial<User>) => Promise<void>;
}

// Cria o contexto de autenticação com um valor padrão undefined
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// Provedor de Autenticação
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        // Usa onSnapshot para ouvir mudanças em tempo real no documento do usuário
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          const baseUserData: User = {
            id: firebaseUser.uid, // UID do Firebase Auth
            email: firebaseUser.email, // Email do Firebase Auth
          };

          if (docSnap.exists()) {
            setUser({
              ...baseUserData,
              ...(docSnap.data() as Partial<User>), // Mescla com dados do Firestore
            });
          } else {
            // Documento não existe (pode ser um novo usuário cujo doc ainda não foi criado pelo signup)
            setUser(baseUserData);
            console.warn(`[AuthContext] Documento do usuário ${firebaseUser.uid} não encontrado no Firestore via onSnapshot. Será criado no signup se necessário.`);
          }
          setIsLoading(false); // Define isLoading como false após a primeira leitura/atualização
        }, (error) => {
          console.error("[AuthContext] Erro ao ouvir o perfil do usuário no Firestore:", error);
          setUser({ id: firebaseUser.uid, email: firebaseUser.email }); // Fallback em caso de erro no listener
          setIsLoading(false);
        });

        // Retorna a função de cancelamento do onSnapshot para limpar quando o usuário deslogar ou o componente desmontar
        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setIsLoading(false); // Também define isLoading como false se não houver usuário
      }
    });
    return () => unsubscribe();
  }, []);
  
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged cuidará de buscar o perfil e atualizar o estado
    } catch (error) {
      console.error("Erro no login:", error);
      setIsLoading(false);
      throw error;
    }
    // setIsLoading(false) é chamado pelo onAuthStateChanged ou no catch
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newLinkCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Gera o código fixo aqui
      const newUserDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(newUserDocRef, {
        email: userCredential.user.email,
        linkCode: newLinkCode, // Salva o código fixo
        linkedPartnerId: null, // Começa não vinculado
        seenCards: [],
        matchedCards: [],
        conexaoAccepted: 0,
        conexaoRejected: 0,
        userCreatedCards: [],
        createdAt: serverTimestamp(), // Usa o serverTimestamp aqui
      });
      // onAuthStateChanged cuidará de buscar o perfil recém-criado e atualizar o estado
    } catch (error) {
      console.error("Erro no signup:", error);
      setIsLoading(false);
      throw error;
    }
    // setIsLoading(false) é chamado pelo onAuthStateChanged ou no catch
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged cuidará de setar user para null
    } catch (error) {
      console.error("Erro no logout:", error);
      setIsLoading(false);
      throw error;
    }
    // setIsLoading(false) é chamado pelo onAuthStateChanged ou no catch
  };

  const updateUser = async (updatedData: Partial<User>) => {
    if (!user) {
      console.warn("updateUser chamado sem usuário logado.");
      return;
    }
    // Atualiza o estado local imediatamente
    setUser(currentUser => {
      if (!currentUser) return null;
      return { ...currentUser, ...updatedData };
    });

    // Persiste a mudança no Firestore
    const userDocRef = doc(db, 'users', user.id);
    try {
      await updateDoc(userDocRef, updatedData);
    } catch (error) {
      console.error(`Firestore: Erro ao persistir atualização do perfil do usuário ${user.id}:`, error);
      // TODO: Considerar reverter o estado local ou notificar o usuário sobre a falha na persistência
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
      updateUser
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
