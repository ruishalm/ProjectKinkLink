// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\src\contexts\NotificationContext.tsx

import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // Para acessar o usuário logado
import toast from 'react-hot-toast';
// As importações do Firebase Messaging foram removidas daqui para serem carregadas dinamicamente
import { app as firebaseApp, db } from '../firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

const VAPID_KEY = "BOsyzlRobDa9Hv3_sctCdE4SPSMQZXtrEz7n84r3XjRF01UImZQ7fnd8YfbMz3uwZW2VLsD-M9QaxNu5Yid1x7Q";

export interface NotificationContextData {
  appNotificationStatus: 'enabled' | 'disabled' | 'denied' | 'unsupported';
  isNotificationProcessing: boolean;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

// Função auxiliar para verificar o suporte do navegador de forma segura
const isBrowserSupported = () => 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appNotificationStatus, setAppNotificationStatus] = useState<'enabled' | 'disabled' | 'denied' | 'unsupported'>('disabled');
  const [isNotificationProcessing, setIsNotificationProcessing] = useState(false);

  const unregisterFCMToken = async (userId: string, token: string) => {
    if (!userId || !token) return;
    try {
      const tokenRef = doc(db, `users/${userId}/fcmTokens`, token);
      await deleteDoc(tokenRef);
      console.log(`[NotificationContext] Token FCM removido do Firestore.`);
    } catch (error) {
      console.error(`[NotificationContext] Erro ao remover token FCM:`, error);
    }
  };

  const enableNotifications = async () => {
    if (!isBrowserSupported()) {
      console.warn("[NotificationContext] Firebase Messaging não é suportado neste navegador.");
      toast.error("As notificações não são suportadas neste navegador ou dispositivo.");
      setAppNotificationStatus('unsupported');
      return;
    }

    setIsNotificationProcessing(true);
    try {
      // Importação dinâmica
      const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
      
      const supported = await isSupported();
      if (!supported) {
        setAppNotificationStatus('unsupported');
        return;
      }

      if (!user || !user.id) throw new Error("Usuário não logado.");
      
      const messaging = getMessaging(firebaseApp);
      const permission = await window.Notification.requestPermission();

      if (permission === "granted") {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
          localStorage.setItem('fcm_token', currentToken);
          localStorage.setItem('fcm_user_id', user.id);
          const tokenRef = doc(db, `users/${user.id}/fcmTokens`, currentToken);
          await setDoc(tokenRef, { createdAt: serverTimestamp(), platform: 'web' });
          console.log("[NotificationContext] Notificações ativadas e token salvo.");
          setAppNotificationStatus('enabled');
        } else {
          throw new Error("Não foi possível obter o token de notificação.");
        }
      } else {
        setAppNotificationStatus('denied');
        console.log("[NotificationContext] Permissão para notificação negada.");
      }
    } catch (error) {
      console.error("[NotificationContext] Erro ao ativar notificações:", error);
      setAppNotificationStatus('disabled');
    } finally {
      setIsNotificationProcessing(false);
    }
  };

  const disableNotifications = async () => {
    setIsNotificationProcessing(true);
    try {
      if (!user || !user.id) throw new Error("Usuário não logado.");
      
      const tokenToUnregister = localStorage.getItem('fcm_token');
      if (tokenToUnregister) {
        await unregisterFCMToken(user.id, tokenToUnregister);
        localStorage.removeItem('fcm_token');
        localStorage.removeItem('fcm_user_id');
        console.log("[NotificationContext] Notificações desativadas.");
        setAppNotificationStatus('disabled');
      }
    } catch (error) {
      console.error("[NotificationContext] Erro ao desativar notificações:", error);
    } finally {
      setIsNotificationProcessing(false);
    }
  };

  useEffect(() => {
    let unsubscribeOnMessage = () => {};

    const setupNotifications = async () => {
      if (!isBrowserSupported()) {
        console.warn("[NotificationContext] A API de notificação não é suportada neste navegador.");
        setAppNotificationStatus('unsupported');
        return;
      }

      const { getMessaging, onMessage } = await import('firebase/messaging');

      const syncPermissionStatus = () => {
        const browserPermission = window.Notification.permission;
        const hasToken = !!localStorage.getItem('fcm_token');

        if (browserPermission === 'denied') {
          setAppNotificationStatus('denied');
        } else if (browserPermission === 'granted' && hasToken) {
          setAppNotificationStatus('enabled');
        } else {
          setAppNotificationStatus('disabled');
        }

        if ('permissions' in navigator) {
          navigator.permissions.query({ name: 'notifications' }).then(status => {
            status.onchange = syncPermissionStatus;
          }).catch(console.error);
        }
      };

      syncPermissionStatus();

      if (user) {
        try {
          const messaging = getMessaging(firebaseApp);
          unsubscribeOnMessage = onMessage(messaging, (payload) => {
            console.log('[NotificationContext] Mensagem FCM recebida:', payload);
            if (payload.notification && payload.notification.title) {
              toast.success(
                (t) => (
                  <div
                    onClick={() => {
                      if (payload.data?.url) navigate(payload.data.url);
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
        } catch (error) {
          console.error("[NotificationContext] Erro ao inicializar listener:", error);
        }
      }
    };

    setupNotifications();

    return () => unsubscribeOnMessage();
  }, [user, navigate]);

    return (
      <NotificationContext.Provider
      value={{
        appNotificationStatus,
        isNotificationProcessing,
        enableNotifications,
        disableNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
    );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
};
