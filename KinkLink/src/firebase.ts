// Importe as funções que você precisa dos SDKs que você precisa
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"; // Adicionado getApps, getApp, FirebaseApp
import { getAuth, type Auth } from "firebase/auth"; // Adicionado Auth
import { getFirestore, initializeFirestore, memoryLocalCache, type Firestore } from "firebase/firestore"; // Adicionado Firestore
import * as Sentry from "@sentry/react";
// Se for usar Analytics (opcional, não está no plano MVP inicial)
// import { getAnalytics } from "firebase/analytics";

// Inicializa o Sentry o mais cedo possível para capturar todos os erros.
Sentry.init({
  dsn: "https://bfd3b64ee872569b4a966c86ad2425a3@o4510556133523456.ingest.us.sentry.io/4510556144074752",
});

// TODO: Adicione aqui a configuração do seu projeto Firebase
// Configuração do Firebase obtida do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyACNoydfN7XVHtfck5eFWrIsf4LhtFyLeQ",
  authDomain: "kinklink-a4607.firebaseapp.com",
  projectId: "kinklink-a4607",
  storageBucket: "kinklink-a4607.firebasestorage.app", // Corrigido para .appspot.com ou .firebasestorage.app conforme o console
  messagingSenderId: "468322834802",
  appId: "1:468322834802:web:4672b5bca57765eecb25eb",
  measurementId: "G-J1KE1CDEPF" // Adicionado o measurementId
};

// Initialize Firebase - Verifica se já existe uma instância
let app: FirebaseApp;
let db: Firestore; // Declarar db aqui

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Inicializa o Firestore com cache em memória para evitar erros de IndexedDB
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
  });
} else {
  app = getApp(); // Pega a instância existente
  db = getFirestore(app); // Pega o Firestore já inicializado
}

// Inicialize os serviços do Firebase que você vai usar (Auth e Firestore para o MVP)
const auth: Auth = getAuth(app);
// const analytics = getAnalytics(app); // Descomente se for usar Analytics

// Exporte as instâncias para usar em outras partes do seu app
export { app, auth, db };
