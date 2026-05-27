// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1HExrth9KreCNo6lVjJTDCERNPn3TmKo",
  authDomain: "teamsyncpbl.firebaseapp.com",
  projectId: "teamsyncpbl",
  storageBucket: "teamsyncpbl.firebasestorage.app",
  messagingSenderId: "874968645427",
  appId: "1:874968645427:web:605058de10951d15b78846",
  measurementId: "G-5WR8ZMK0KL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };