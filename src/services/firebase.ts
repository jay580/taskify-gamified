import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore - React Native specific import
import { getReactNativePersistence } from '@firebase/auth/dist/rn/index.js';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAa2y0mBwSoD5p75zWlmrB2soegcI0qVes',
  authDomain: 'ssiapp-6e196.firebaseapp.com',
  projectId: 'ssiapp-6e196',
  storageBucket: 'ssiapp-6e196.firebasestorage.app',
  messagingSenderId: '1032701302415',
  appId: '1:1032701302415:web:b0f8be5dc12f598970c2fa',
  measurementId: 'G-MZBVR4WM6K',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Secondary app for creating users without logging out admin
const secondaryApp = getApps().find(a => a.name === 'SecondaryApp') 
  || initializeApp(firebaseConfig, 'SecondaryApp');

// Use initializeAuth with persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
