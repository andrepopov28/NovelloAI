'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface LocalUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: LocalUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = 'novello_local_user';
const DEFAULT_USER: LocalUser = {
  uid: 'local-user',
  displayName: 'Local Author',
  email: null,
  photoURL: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Auto sign-in as local guest
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
        setUser(DEFAULT_USER);
      }
    } catch {
      setUser(DEFAULT_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    // Local-first: just sign in as local user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
    setUser(DEFAULT_USER);
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
