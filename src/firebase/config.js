 // Importa a função para inicializar o app Firebase
import { initializeApp } from "firebase/app";
// Importa funções para obter os serviços que vamos usar (Auth e Firestore)
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase lida a partir das variáveis de ambiente (.env)
// Vite expõe variáveis prefixadas com VITE_ em import.meta.env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Descomente se adicionou no .env e quer usar Analytics
};

// Inicializa o Firebase com as configurações
const app = initializeApp(firebaseConfig);

// Inicializa e exporta os serviços que vamos usar no resto do app
export const auth = getAuth(app); // Serviço de Autenticação
export const db = getFirestore(app); // Serviço do Firestore Database

// Exporta o app inicializado também, caso precise em algum lugar
export default app;
