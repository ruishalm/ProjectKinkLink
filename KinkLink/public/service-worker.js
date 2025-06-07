// d:\Projetos\Github\app\ProjectKinkLink\KinkLink\public\service-worker.js
// Este é um service worker muito básico, apenas para fins de PWA.
// Ele não faz cache offline ainda.

self.addEventListener('install', (event) => {
  console.log('KinkLink Service Worker: Instalado');
  // event.waitUntil(self.skipWaiting()); // Opcional: força o service worker a ativar imediatamente
});

self.addEventListener('activate', (event) => {
  console.log('KinkLink Service Worker: Ativado');
  // event.waitUntil(self.clients.claim()); // Opcional: permite que o SW controle clientes não controlados imediatamente
});

self.addEventListener('fetch', (event) => {
  // Por enquanto, não faremos nada com o fetch, apenas deixamos a rede passar.
  // console.log('KinkLink Service Worker: Fetching', event.request.url);
  // event.respondWith(fetch(event.request)); // Comportamento padrão
});