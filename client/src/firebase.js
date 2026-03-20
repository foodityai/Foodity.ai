// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCuRAFQmDHSp1961DLRIRhs7m6tRTTEc2U",
  authDomain: "foodity-ai.firebaseapp.com",
  projectId: "foodity-ai",
  storageBucket: "foodity-ai.firebasestorage.app",
  messagingSenderId: "591127311159",
  appId: "1:591127311159:web:72cad0dbbe7c0accc3e0b2",
  measurementId: "G-F0W09R99R6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);