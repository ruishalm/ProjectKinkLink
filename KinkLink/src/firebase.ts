// Importe as funções que você precisa dos SDKs que você precisa
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Inicialize os serviços do Firebase que você vai usar (Auth e Firestore para o MVP)
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app); // Descomente se for usar Analytics

// Exporte as instâncias para usar em outras partes do seu app
export { app, auth, db };