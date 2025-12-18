// Importe as funções que você precisa dos SDKs que você precisa
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"; // Adicionado getApps, getApp, FirebaseApp
import { getAuth, type Auth } from "firebase/auth"; // Adicionado Auth
import { getFirestore, type Firestore } from "firebase/firestore"; // Adicionado Firestore e setLogLevel
import { getFunctions, type Functions } from "firebase/functions"; // Adicionado Functions
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
// Se for usar Analytics (opcional, não está no plano MVP inicial)
// import { getAnalytics } from "firebase/analytics";

// TODO: Adicione aqui a configuração do seu projeto Firebase
// Configuração do Firebase obtida do Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase - Verifica se já existe uma instância
let app: FirebaseApp;
let appCheck: AppCheck | undefined; // Variável para o AppCheck

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  // Inicializa o App Check aqui, somente no cliente
  if (typeof window !== 'undefined') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // AVISO: O App Check é desabilitado em dispositivos iOS.
    // O reCAPTCHA pode falhar em WebViews do iOS, bloqueando o acesso ao app.
    // Isso significa que as requisições de clientes iOS não serão verificadas.
    if (!isIOS) {
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
            isTokenAutoRefreshEnabled: true
        });
        console.log("App Check initialized for non-iOS device.");
    } else {
        console.warn("App Check disabled on iOS device.");
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