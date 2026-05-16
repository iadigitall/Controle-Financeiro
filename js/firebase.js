import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_O9xxexfyOYGfLAv-8ZWSZOqiG_ZB-J4",
  authDomain: "controle-financeiro-facul.firebaseapp.com",
  projectId: "controle-financeiro-facul",
  storageBucket: "controle-financeiro-facul.firebasestorage.app",
  messagingSenderId: "896024464655",
  appId: "1:896024464655:web:fbf243b3e6c6e52c3c427a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
