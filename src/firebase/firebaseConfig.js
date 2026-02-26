// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBP_VmRGC3k5haocnPXfyMZixxVzYNrWQ",
  authDomain: "batch-progress-tracker.firebaseapp.com",
  projectId: "batch-progress-tracker",
  storageBucket: "batch-progress-tracker.firebasestorage.app",
  messagingSenderId: "680647766083",
  appId: "1:680647766083:web:6de680c410122fa4f1a4f6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);