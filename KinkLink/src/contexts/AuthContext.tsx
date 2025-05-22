import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';
import type { Card } from '../data/cards'; // Importa a interface Card

// Interface para cartas que deram match, incluindo o status "hot"
export interface MatchedCard extends Card {
  isHot?: boolean;
}

// Simulando um tipo de usuário
interface User {
  id: string;
  email: string;
  username?: string;
  bio?: string;
  linkCode?: string | null;
  seenCards?: string[];
  linkedPartnerId?: string | null;
  conexaoAccepted?: number;
  conexaoRejected?: number;
  matchedCards?: MatchedCard[]; // Movido para dentro do User
}

interface AuthContextType {
  user: User | null;
  login: (email: string, userId: string) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void; // Renomeado de updateProfile
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('kinklinkUser');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Erro ao carregar usuário do localStorage:", error);
        localStorage.removeItem('kinklinkUser');
      }
    }
    setIsLoading(false);
  }, []);

  const saveUserToLocalStorage = (currentUser: User | null) => {
    if (currentUser) {
      localStorage.setItem('kinklinkUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kinklinkUser');
    }
  };

  const login = (email: string, userId: string) => {
    const newUser: User = {
      id: userId,
      email: email,
      username: email.split('@')[0],
      bio: `Olá, eu sou ${email.split('@')[0]}!`,
      linkCode: null,
      linkedPartnerId: null,
      seenCards: [],
      conexaoAccepted: 0,
      conexaoRejected: 0,
      matchedCards: [], // Inicializa matchedCards aqui
    };
    setUser(newUser);
    saveUserToLocalStorage(newUser);
  };

  const logout = () => {
    setUser(null);
    saveUserToLocalStorage(null);
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newUserData = { ...currentUser, ...updatedData };
      saveUserToLocalStorage(newUserData);
      return newUserData;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        isLoading,
      }}
    >
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
