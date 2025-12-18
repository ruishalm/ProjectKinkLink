// Importe as funções que você precisa dos SDKs que você precisa
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"; // Adicionado getApps, getApp, FirebaseApp
import { getAuth, type Auth } from "firebase/auth"; // Adicionado Auth
import { getFirestore, type Firestore } from "firebase/firestore"; // Adicionado Firestore e setLogLevel
import { getFunctions, type Functions } from "firebase/functions"; // Adicionado Functions
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";

// Augment the Window interface
declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean;
  }
}

// Se for usar Analytics (opcional, não está no plano MVP inicial)
// import { getAnalytics } from "firebase/analytics";

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
let appCheck: AppCheck | undefined; // Variável para o AppCheck

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Inicializa o App Check aqui, somente no cliente
  if (typeof window !== 'undefined') {
    // Adiciona uma verificação para o token de debug do App Check.
    // Em alguns ambientes (como WebViews no iOS), o reCAPTCHA pode não funcionar
    // corretamente. O Firebase pode definir um token de depuração nessas situações.
    // Esta verificação impede a inicialização do App Check se um token de debug for detectado,
    // evitando que o app seja bloqueado em produção no iOS.
    // AVISO: Isso significa que as requisições desses clientes não serão verificadas pelo App Check.
   
    if (window.FIREBASE_APPCHECK_DEBUG_TOKEN === undefined) {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider('6Le-pMUpAAAAAJ3Z_vI-L1i-X635tL5m5rJ7d-yC'), // Chave de site reCAPTCHA v3
          isTokenAutoRefreshEnabled: true
        });
      } catch (error) {
        console.error("Failed to initialize App Check:", error);
      }
    } else {
        console.log("App Check initialization skipped due to debug token.");
    }
  }
} else {
  app = getApp(); // Pega a instância existente
}

// Inicialize os serviços do Firebase que você vai usar (Auth e Firestore para o MVP)
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app, 'southamerica-east1'); // Especifica a região da sua função
// const analytics = getAnalytics(app); // Descomente se for usar Analytics

// Exporte as instâncias para usar em outras partes do seu app
export { app, auth, db, functions, appCheck };