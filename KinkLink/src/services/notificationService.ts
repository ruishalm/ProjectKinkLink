import { getMessaging, getToken } from 'firebase/messaging';
import { app, db, auth } from '../firebase'; // Corrigido: o nome do arquivo é 'firebase.ts'
import { doc, setDoc } from 'firebase/firestore';

/**
 * Solicita permissão para notificações push e salva o token FCM do dispositivo no Firestore.
 * @returns {Promise<string | null>} O token FCM se a permissão for concedida, caso contrário, null.
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  // Chave VAPID do seu projeto Firebase.
  // Encontre em: Console do Firebase > Configurações do Projeto > Cloud Messaging > Certificados Web push.
  const VAPID_KEY = "BPD-m_g_Y-xY_8-Z_8Z8Y-8Z8Y-8Z8Y-8Z8Y-8Z8Y-8Z8Y-8Z8Y-8Z8Y-8Z8Y-8Z8Y"; // <<< SUBSTITUA PELA SUA CHAVE VAPID

  try {
    const messaging = getMessaging(app);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.log('Usuário não autenticado. Permissão de notificação não solicitada.');
      return null;
    }

    console.log('Solicitando permissão para notificações...');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Permissão de notificação concedida.');

      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (currentToken) {
        console.log('Token FCM obtido:', currentToken);

        // Salva o token em uma subcoleção para suportar múltiplos dispositivos
        const tokenRef = doc(db, 'users', currentUser.uid, 'fcmTokens', currentToken);
        await setDoc(tokenRef, {
          createdAt: new Date(),
          userAgent: navigator.userAgent,
        });

        console.log('Token FCM salvo no Firestore.');
        return currentToken;
      } else {
        console.warn('Não foi possível obter o token FCM. A permissão foi concedida, mas o token não foi gerado.');
        return null;
      }
    } else {
      console.log('Permissão de notificação não foi concedida.');
      return null;
    }
  } catch (error) {
    console.error('Ocorreu um erro ao solicitar permissão de notificação ou obter o token:', error);
    return null;
  }
};