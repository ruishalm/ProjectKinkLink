/* eslint-disable no-restricted-globals */

// Scripts para o SDK do Firebase (versões compat, mais simples para service workers)
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');


const firebaseConfig = {
  apiKey: "AIzaSyACNoydfN7XVHtfck5eFWrIsf4LhtFyLeQ",
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

// Opcional: Manipulador para mensagens recebidas enquanto o app está em segundo plano.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/icons/kinklogo192.png", // Fallback icon
    data: payload.data, // Passa todos os dados para o evento de clique
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ESTE É O EVENTO QUE LIDA COM O CLIQUE
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);

  // Fecha a notificação
  event.notification.close();

  // Pega a URL do payload de dados
  const targetUrl = event.notification.data?.url || "/";

  // Procura por uma janela/aba do app já aberta
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Se uma janela já estiver aberta, foca nela e navega para a URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then(c => c.navigate(targetUrl));
        }
      }
      // Se nenhuma janela estiver aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
