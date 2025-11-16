// Importe as funções que você precisa dos SDKs que você precisa
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"; // Adicionado getApps, getApp, FirebaseApp
import { getAuth, type Auth } from "firebase/auth"; // Adicionado Auth
import { getFirestore, type Firestore } from "firebase/firestore"; // Adicionado Firestore e setLogLevel
import { getFunctions, type Functions } from "firebase/functions"; // Adicionado Functions
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
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Pega a instância existente
}

// Inicialize os serviços do Firebase que você vai usar (Auth e Firestore para o MVP)
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app, 'southamerica-east1'); // Especifica a região da sua função
// const analytics = getAnalytics(app); // Descomente se for usar Analytics

// Exporte as instâncias para usar em outras partes do seu app
export { app, auth, db, functions };