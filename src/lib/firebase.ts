// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// REPLACE WITH YOUR ACTUAL KEYS FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyD2vBHMTOS_1OTBmb7ZoUMb99AbpRi-rSw",
  authDomain: "seta-app-c4e1d.firebaseapp.com",
  projectId: "seta-app-c4e1d",
  storageBucket: "seta-app-c4e1d.firebasestorage.app",
  messagingSenderId: "754712100860",
  appId: "1:754712100860:web:5ec3df402e27ff34ccfc79",
  measurementId: "G-K14MNPGCCD"
};

// Initialize App (Singleton pattern)
let app;
let auth;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // Initialize Auth with persistence (keeps user logged in)
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

export { auth };
