import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

export const loginWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const sendPasswordReset = (email: string) =>
  sendPasswordResetEmail(auth, email);

export const onAuthStateChanged = (callback: (user: User | null) => void) =>
  firebaseOnAuthStateChanged(auth, callback);
