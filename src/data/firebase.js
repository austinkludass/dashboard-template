import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: "testappforwisemindsadmin.firebaseapp.com",
  databaseURL: "https://testappforwisemindsadmin-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "testappforwisemindsadmin",
  storageBucket: "testappforwisemindsadmin.firebasestorage.app",
  messagingSenderId: "221401094009",
  appId: "1:221401094009:web:4e145cb01ddbb4f4d741a8",
  measurementId: "G-72B7PB2YJ3"
};

export const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const sb = getStorage(app);