// ============================================================
// Firebase setup
// 1. Go to https://console.firebase.google.com -> create a project
// 2. Project settings -> General -> "Your apps" -> Web app (</>) -> copy the config below
// 3. Enable: Authentication (Email/Password), Firestore Database
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHYT183gNo8IP6LPG_E0B9Pw0eILA73X0",
  authDomain: "study-27ab0.firebaseapp.com",
  projectId: "study-27ab0",
  storageBucket: "study-27ab0.firebasestorage.app",
  messagingSenderId: "915967234587",
  appId: "1:915967234587:web:3e737ea72ce7cb4b3f1ebe",
  measurementId: "G-PRBB2V9G00"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
