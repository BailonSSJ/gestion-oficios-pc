// Importar las funciones necesarias desde Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase (la que tú ya me diste)
const firebaseConfig = {
  apiKey: "AIzaSyAheth-iCGenbU3n68q5PXADt8posrlyug",
  authDomain: "gestion-oficios-pc.firebaseapp.com",
  databaseURL: "https://gestion-oficios-pc-default-rtdb.firebaseio.com",
  projectId: "gestion-oficios-pc",
  storageBucket: "gestion-oficios-pc.firebasestorage.app",
  messagingSenderId: "1012485780559",
  appId: "1:1012485780559:web:fd0e985b31fd2900fea63a"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Exportar app y db
export { app, db };
