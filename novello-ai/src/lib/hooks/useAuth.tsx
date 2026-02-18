'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [configError, setConfigError] = useState(false);

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            setConfigError(true);
            setLoading(false);
            return;
        }
        try {
            const authInstance = getFirebaseAuth();
            const unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
                setUser(firebaseUser);
                setLoading(false);
            });
            return () => unsubscribe();
        } catch (err) {
            console.error('Firebase Auth init failed:', err);
            setConfigError(true);
            setLoading(false);
        }
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
        } catch (err) {
            console.error('Sign-in failed:', err);
            throw err;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(getFirebaseAuth());
        } catch (err) {
            console.error('Sign-out failed:', err);
        }
    };

    if (configError) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                background: 'var(--surface-primary, #f5f5f7)',
            }}>
                <div style={{
                    textAlign: 'center',
                    maxWidth: '28rem',
                    padding: '2.5rem',
                    borderRadius: '1.5rem',
                    background: 'var(--surface-secondary, #fff)',
                    border: '1px solid var(--border, #eee)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Firebase Configuration Required
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#6e6e73', lineHeight: 1.6 }}>
                        Add the following to your <code>.env.local</code> file:
                    </p>
                    <pre style={{
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: '#18181b',
                        color: '#e4e4e7',
                        overflow: 'auto',
                    }}>
                        {`NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...`}
                    </pre>
                </div>
            </div>
        );
    }

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
