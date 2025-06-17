// public/firebase-messaging-sw.js

// Scripts para o SDK do Firebase (versões compat, mais simples para service workers)
// Use versões recentes e compatíveis. Verifique a documentação do Firebase para as últimas versões recomendadas.
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

//
// TODO: Configure com suas credenciais do Firebase
// Estas são as mesmas credenciais que você usa no seu app principal (src/firebase.ts)
// Você pode encontrá-las nas Configurações do Projeto > Geral > Seus apps > Configuração do SDK (selecione CDN)
//
const firebaseConfig = {
  apiKey: "AIzaSyACNoydfN7XVHtfck5eFWrIsf4LhtFyLeQ",
  authDomain: "kinklink-a4607.firebaseapp.com", // Seu authDomain
  projectId: "kinklink-a4607", // Seu projectId
  storageBucket: "kinklink-a4607.firebasestorage.app", // Corrigido com base no seu input
  messagingSenderId: "468322834802",
  appId: "1:468322834802:web:4672b5bca57765eecb25eb",
  measurementId: "G-J1KE1CDEPF" // Adicionado com base no seu input
};

// Inicializa o Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}


const messaging = firebase.messaging();

// Callback para quando uma mensagem é recebida enquanto o app está em segundo plano ou fechado
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize a notificação aqui
  const notificationTitle = payload.notification?.title || 'Nova Notificação KinkLink';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova atividade!',
    icon: '/icons/icon-192x192.png', // Certifique-se que este ícone existe na pasta public/icons
    // Exemplo de como usar dados para abrir uma URL específica ao clicar na notificação:
    // data: {
    //   url: payload.data?.click_action || '/' // Use um campo 'click_action' do payload.data ou um fallback
    // }
    // Você pode adicionar mais opções como 'badge', 'image', 'actions', etc.
  };

  // Exibe a notificação
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Opcional: Adicionar um event listener para cliques na notificação
// Isso permite que você defina o que acontece quando o usuário clica na notificação.
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);
  event.notification.close(); // Fecha a notificação

  // Exemplo de como abrir uma URL específica ou focar em uma janela existente:
  // const urlToOpen = event.notification.data?.url || '/'; // Pega a URL dos dados da notificação ou usa a raiz
  // event.waitUntil(
  //   clients.matchAll({
  //     type: "window",
  //     includeUncontrolled: true
  //   }).then(function(clientList) {
  //     for (var i = 0; i < clientList.length; i++) {
  //       var client = clientList[i];
  //       // Se uma janela do app já estiver aberta, foca nela e navega para a URL
  //       if (client.url === urlToOpen && 'focus' in client) {
  //         return client.focus();
  //       }
  //     }
  //     // Se nenhuma janela estiver aberta, abre uma nova
  //     if (clients.openWindow) {
  //       return clients.openWindow(urlToOpen);
  //     }
  //   })
  // );
});
