// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\NotificationContext.tsx

import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Para acessar o usuário logado
// Importações do Firebase necessárias para FCM
import toast from 'react-hot-toast';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app as firebaseApp, db } from '../firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

// VAPID Key (pode ser uma constante importada de um arquivo de configuração se preferir)
const VAPID_KEY = "BOsyzlRobDa9Hv3_sctCdE4SPSMQZXtrEz7n84r3XjRF01UImZQ7fnd8YfbMz3uwZW2VLsD-M9QaxNu5Yid1x7Q";

// Se o contexto não expõe valores específicos ainda, mas o valor é um objeto (como {}),
// 'object' é um tipo mais apropriado do que uma interface vazia.
export interface NotificationContextData {
  appNotificationStatus: 'enabled' | 'disabled' | 'denied'; // <<< ALTERADO
  isNotificationProcessing: boolean;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined); // O tipo do contexto permanece o mesmo

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Obtém o usuário do AuthContext
  const navigate = useNavigate();
  const [appNotificationStatus, setAppNotificationStatus] = useState<'enabled' | 'disabled' | 'denied'>('disabled'); // <<< ALTERADO
  const [isNotificationProcessing, setIsNotificationProcessing] = useState(false);

  // Função para desregistrar o token do Firestore
  const unregisterFCMToken = async (userId: string, token: string) => {
    if (!userId || !token) return;
    try {
      const tokenRef = doc(db, `users/${userId}/fcmTokens`, token);
      await deleteDoc(tokenRef);
      console.log(`[NotificationContext] Token FCM ${token.substring(0,10)}... removido do Firestore para o usuário ${userId}.`); // Linha 25
    } catch (error) {
      console.error(`[NotificationContext] Erro ao remover token FCM para o usuário ${userId}:`, error);
    }
  };

  const enableNotifications = async () => {
    setIsNotificationProcessing(true);
    try {
      if (!user || !user.id || !('Notification' in window) || !('serviceWorker' in navigator)) {
        throw new Error("Usuário não logado ou navegador não suporta notificações.");
      }
      const messaging = getMessaging(firebaseApp);
      const permission = await Notification.requestPermission();
      // setNotificationPermission(permission); // Removido, o status será atualizado pelo sync

      if (permission === "granted") {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
          localStorage.setItem('fcm_token', currentToken);
          localStorage.setItem('fcm_user_id', user.id);
          const tokenRef = doc(db, `users/${user.id}/fcmTokens`, currentToken);
          await setDoc(tokenRef, { createdAt: serverTimestamp(), platform: 'web' });
          console.log("[NotificationContext] Notificações ativadas e token salvo.");
          setAppNotificationStatus('enabled'); // <<< ADICIONADO
        } else {
          throw new Error("Não foi possível obter o token de notificação.");
        }
      } else {
        console.log("[NotificationContext] Permissão para notificação negada pelo usuário.");
      }
    } catch (error) {
      console.error("[NotificationContext] Erro ao ativar notificações:", error);
      // Opcional: mostrar um toast de erro para o usuário
    } finally {
      setIsNotificationProcessing(false);
    }
  };

  const disableNotifications = async () => {
    setIsNotificationProcessing(true);
    try {
      if (!user || !user.id) {
        throw new Error("Usuário não logado.");
      }
      const tokenToUnregister = localStorage.getItem('fcm_token');
      if (tokenToUnregister) {
        await unregisterFCMToken(user.id, tokenToUnregister);
        localStorage.removeItem('fcm_token');
        localStorage.removeItem('fcm_user_id');
        console.log("[NotificationContext] Notificações desativadas e token removido.");
        setAppNotificationStatus('disabled'); // <<< ADICIONADO
      }
      // Importante: Não podemos reverter a permissão do navegador (de 'granted' para 'default').
      // O usuário precisa fazer isso manualmente nas configurações do navegador.
      // Apenas removemos o token do nosso sistema.
    } catch (error) {
      console.error("[NotificationContext] Erro ao desativar notificações:", error);
    } finally {
      setIsNotificationProcessing(false);
    }
  };

  // Efeito para sincronizar o status da permissão e registrar o listener de mensagens em primeiro plano
  useEffect(() => {
    let unsubscribeOnMessage = () => {};

    // Função para verificar e atualizar o status da permissão
    const syncPermissionStatus = () => {
      const browserPermission = Notification.permission;
      const hasToken = !!localStorage.getItem('fcm_token');

      if (browserPermission === 'denied') {
        setAppNotificationStatus('denied');
      } else if (browserPermission === 'granted' && hasToken) {
        setAppNotificationStatus('enabled');
      } else {
        setAppNotificationStatus('disabled');
      }

      // Adiciona um listener para mudanças na permissão do navegador
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'notifications' }).then(status => {
          status.onchange = syncPermissionStatus; // Re-sincroniza se o usuário mudar nas configurações do navegador
        }).catch(console.error);
      }
    };

    syncPermissionStatus();

    // Se o usuário estiver logado, registra o listener para mensagens em primeiro plano
    if (user) {
      const messaging = getMessaging(firebaseApp);
      unsubscribeOnMessage = onMessage(messaging, (payload) => {
        console.log('[NotificationContext] Mensagem FCM recebida em primeiro plano:', payload);
        if (payload.notification && payload.notification.title) {
          toast.success(
            (t) => (
              <div
                onClick={() => {
                  if (payload.data?.url) {
                    // Usar navigate para uma transição mais suave dentro do app
                    navigate(payload.data.url);
                  }
                  toast.dismiss(t.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <b>{payload.notification?.title}</b>
                <p style={{ margin: '4px 0 0' }}>{payload.notification?.body}</p>
              </div>
            ), { duration: 6000 }
          );
        }
      });
    }

    // Função de limpeza
    return () => unsubscribeOnMessage();
  }, [user, navigate]); // Depende do usuário para registrar/desregistrar e do navigate

  // O valor do contexto pode ser expandido se precisarmos expor algo.
  // Atualmente, estamos passando um objeto vazio, o que corresponde ao tipo 'object'.
    return (
      <NotificationContext.Provider value={{
        appNotificationStatus, // <<< ALTERADO
        isNotificationProcessing,
        enableNotifications,
        disableNotifications,
      }}>
        {children}
      </NotificationContext.Provider>
    );
};

// Hook customizado para usar o NotificationContext (opcional por enquanto)
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};
