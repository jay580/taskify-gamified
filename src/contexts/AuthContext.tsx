import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChanged, loginWithEmail, logout as authLogout } from '../services/auth';
import { getUserProfile, createDefaultUserProfile } from '../services/firestore';
import type { UserProfile } from '../types';

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ role: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  userProfile: null,
  loading: true,
  login: async () => ({ role: 'student' }),
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          // Auto-create profile if missing (for manually created Firebase Auth users)
          if (!profile) {
            profile = await createDefaultUserProfile(
              user.uid,
              user.email || '',
              user.displayName || undefined
            );
          }
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<{ role: string }> => {
    const cred = await loginWithEmail(email, password);
    let profile = await getUserProfile(cred.user.uid);
    // Auto-create profile if missing (for manually created Firebase Auth users)
    if (!profile) {
      profile = await createDefaultUserProfile(
        cred.user.uid,
        cred.user.email || '',
        cred.user.displayName || undefined
      );
    }
    setUserProfile(profile);
    return { role: profile.role };
  };

  const logout = async () => {
    await authLogout();
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, userProfile, loading, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
