import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx';
import './i18n';

// Registrar o Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // O caminho deve ser relativo à raiz do seu site PÚBLICO.
    // Se firebase-messaging-sw.js está na pasta 'public', este caminho está correto.
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(registration => {
        console.log('[Main.tsx] ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.error('[Main.tsx] ServiceWorker registration failed: ', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback="loading...">
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </Suspense>
  </StrictMode>,
)
