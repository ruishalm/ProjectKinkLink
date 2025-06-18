// src/contexts/NotificationContext.tsx
import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext'; // Para acessar o usuário logado
// Importações do Firebase necessárias para FCM
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app as firebaseApp, db } from '../firebase'; // Sua inicialização do Firebase app e db
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// VAPID Key (pode ser uma constante importada de um arquivo de configuração se preferir)
const VAPID_KEY = "BOsyzlRobDa9Hv3_sctCdE4SPSMQZXtrEz7n84r3XjRF01UImZQ7fnd8YfbMz3uwZW2VLsD-M9QaxNu5Yid1x7Q";

// Se o contexto não expõe valores específicos ainda, mas o valor é um objeto (como {}),
// 'object' é um tipo mais apropriado do que uma interface vazia.
type NotificationContextData = object;

const NotificationContext = createContext<NotificationContextData | undefined>(undefined); // O tipo do contexto permanece o mesmo

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // Obtém o usuário do AuthContext
  const [fcmTokenProcessed, setFcmTokenProcessed] = useState(false);

  useEffect(() => {
    const setupFcm = async () => {
      // Guarda: só executa se houver usuário, o token não foi processado para ele nesta sessão,
      // e o navegador suportar notificações e service workers.
      if (user && user.id && !fcmTokenProcessed && 'Notification' in window && 'serviceWorker' in navigator) {
        console.log('[NotificationContext] Iniciando setup do FCM para o usuário:', user.id);
        try {
          const messaging = getMessaging(firebaseApp);

          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("[NotificationContext] Permissão para notificação concedida.");
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

            if (currentToken) {
              console.log("[NotificationContext] Token FCM obtido:", currentToken);
              const tokenRef = doc(db, `users/${user.id}/fcmTokens`, currentToken);
              const tokenDocSnap = await getDoc(tokenRef);

              if (!tokenDocSnap.exists()) {
                await setDoc(tokenRef, { createdAt: serverTimestamp(), platform: 'web' });
                console.log("[NotificationContext] Token FCM salvo no Firestore para o usuário:", user.id);
              } else {
                console.log("[NotificationContext] Token FCM já existe no Firestore.");
              }
            } else {
              console.warn("[NotificationContext] Não foi possível obter o token de registro FCM.");
            }
            
            // Listener para mensagens em primeiro plano
            // Este listener é registrado aqui. Se o NotificationProvider remontar por alguma razão
            // (o que não deveria acontecer frequentemente se estiver no topo da árvore),
            // um novo listener seria adicionado. O Firebase SDK pode ser inteligente o suficiente
            // para lidar com isso, mas é algo a se ter em mente.
            // A limpeza do listener não é trivial com onMessage, pois ele não retorna uma função de unsubscribe.
            // No entanto, o objeto `messaging` é instanciado uma vez por `getMessaging(firebaseApp)`.
            onMessage(messaging, (payload) => {
              console.log('[NotificationContext] Mensagem FCM recebida em primeiro plano: ', payload);
              if (payload.notification) {
                // TODO: Substituir por um sistema de Toast/Notificação interna
                alert(`Nova notificação: ${payload.notification.title}\n${payload.notification.body}`);
              }
            });

          } else {
            console.log("[NotificationContext] Permissão para notificação negada.");
          }
        } catch (error) {
          console.error("[NotificationContext] Erro ao configurar FCM:", error);
        } finally {
          // Marcar como processado independentemente do resultado para não tentar de novo na mesma sessão para este usuário.
          setFcmTokenProcessed(true);
          console.log('[NotificationContext] Processamento do FCM token finalizado. fcmTokenProcessed:', true);
        }
      }
    };

    if (user && user.id) { // Se existe um usuário logado
      if (!fcmTokenProcessed) { // E o token FCM ainda não foi processado para ele
        setupFcm();
      }
    } else { // Usuário deslogou
      if (fcmTokenProcessed) { // Se anteriormente estava processado, reseta.
        console.log('[NotificationContext] Usuário deslogado. Resetando fcmTokenProcessed.');
        setFcmTokenProcessed(false);
      }
    }
  }, [user, fcmTokenProcessed]); // Dependências do efeito

  // O valor do contexto pode ser expandido se precisarmos expor algo.
  // Atualmente, estamos passando um objeto vazio, o que corresponde ao tipo 'object'.
  return (
    <NotificationContext.Provider value={{}}> {/* Passando um objeto vazio diretamente */}
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
