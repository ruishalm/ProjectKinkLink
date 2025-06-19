// firebase-messaging-sw.js

// Scripts para o SDK do Firebase (versões compat, mais simples para service workers)
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyACNoydfN7XVHtfck5eFWrIsf4LhtFyLeQ", // Sua chave de API
  authDomain: "kinklink-a4607.firebaseapp.com",
  projectId: "kinklink-a4607",
  storageBucket: "kinklink-a4607.firebasestorage.app",
  messagingSenderId: "468322834802",
  appId: "1:468322834802:web:4672b5bca57765eecb25eb",
  measurementId: "G-J1KE1CDEPF"
};

// Inicializa o Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}

const messaging = firebase.messaging();

// Eventos do ciclo de vida do PWA integrados
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] KinkLink PWA: Instalado');
  // Força o service worker a ativar imediatamente
  event.waitUntil(self.skipWaiting()); 
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] KinkLink PWA: Ativado');
  // Permite que o SW controle clientes não controlados imediatamente
  event.waitUntil(self.clients.claim()); 
});

self.addEventListener('fetch', (event) => {
  // Por enquanto, não faremos nada com o fetch, apenas deixamos a rede passar.
  // Futuramente, estratégias de cache podem ser implementadas aqui.
  // console.log('[firebase-messaging-sw.js] KinkLink PWA: Fetching', event.request.url);
  // event.respondWith(fetch(event.request)); // Comportamento padrão já é este se não houver event.respondWith
});

// Callback para quando uma mensagem é recebida enquanto o app está em segundo plano ou fechado
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize a notificação aqui
  const notificationTitle = payload.notification?.title || 'Nova Notificação KinkLink';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova atividade!',
    icon: '/icons/kinklogo192.png', // Atualizado para usar seu logo
    // Você pode adicionar mais opções como 'badge', 'image', 'actions', etc.
    // Passa os dados do payload original ou um URL padrão para uso no 'notificationclick'
    data: payload.data || { url: '/' } 
  };

  // Adicionando logs e try-catch para depuração do showNotification
  try {
    console.log('[firebase-messaging-sw.js] Attempting to show notification with title:', notificationTitle, 'and options:', notificationOptions);
    // self.registration.showNotification é a função que exibe a notificação
    // Ela retorna uma Promise, então podemos usar await ou .then/.catch
    return self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[firebase-messaging-sw.js] Notification shown successfully.');
      })
      .catch(err => {
        console.error('[firebase-messaging-sw.js] Error showing notification:', err);
      });
  } catch (e) {
    console.error('[firebase-messaging-sw.js] Synchronous error during showNotification setup:', e);
  }
});

// Opcional: Adicionar um event listener para cliques na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);
  event.notification.close(); // Fecha a notificação

  // Exemplo de como abrir uma URL específica ou focar em uma janela existente:
  const urlToOpen = event.notification.data?.url || '/'; // Pega a URL dos dados da notificação ou usa a raiz
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        // Se uma janela do app já estiver aberta com a URL correta, foca nela
        if (client.url === self.location.origin + urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Se nenhuma janela estiver aberta ou com a URL correta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
