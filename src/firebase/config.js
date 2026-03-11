// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGzrtDWrlrGNXMsEBuz0gADYIPDpWB2O8",
  authDomain: "company-management-9c33c.firebaseapp.com",
  projectId: "company-management-9c33c",
  storageBucket: "company-management-9c33c.firebasestorage.app",
  messagingSenderId: "3574399634",
  appId: "1:3574399634:web:6803912b6d9e765a27dc4b"
};

// Primary app
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary app — employee add karne ke liye
import { initializeApp as initializeSecondaryApp } from "firebase/app";
const secondaryApp = initializeSecondaryApp(firebaseConfig, "secondary");
export const secondaryAuth = getAuth(secondaryApp);