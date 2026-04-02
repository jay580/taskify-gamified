// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAa2y0mBwSoD5p75zWlmrB2soegcI0qVes",
  authDomain: "ssiapp-6e196.firebaseapp.com",
  projectId: "ssiapp-6e196",
  storageBucket: "ssiapp-6e196.firebasestorage.app",
  messagingSenderId: "1032701302415",
  appId: "1:1032701302415:web:b0f8be5dc12f598970c2fa",
  measurementId: "G-MZBVR4WM6K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);