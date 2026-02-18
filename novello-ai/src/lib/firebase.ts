import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { env } from './env';

// Firebase initialization — lazy & resilient.
// Will not crash the app if credentials are missing.

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _googleProvider: GoogleAuthProvider | null = null;
let _initError: Error | null = null;

function getApp(): FirebaseApp {
    if (_initError) throw _initError;
    if (_app) return _app;

    const firebaseConfig = {
        apiKey: env.firebase.apiKey,
        authDomain: env.firebase.authDomain,
        projectId: env.firebase.projectId,
        storageBucket: env.firebase.storageBucket,
        messagingSenderId: env.firebase.messagingSenderId,
        appId: env.firebase.appId,
    };

    try {
        _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    } catch (err) {
        _initError = err as Error;
        throw _initError;
    }
    return _app;
}

export function getFirebaseAuth(): Auth {
    if (_auth) return _auth;
    _auth = getAuth(getApp());
    return _auth;
}

export function getFirebaseDb(): Firestore {
    if (_db) return _db;
    _db = getFirestore(getApp());
    return _db;
}

export function getGoogleProvider(): GoogleAuthProvider {
    if (!_googleProvider) {
        _googleProvider = new GoogleAuthProvider();
        _googleProvider.setCustomParameters({ prompt: 'select_account' });
    }
    return _googleProvider;
}

// Check if Firebase is able to initialize
export function isFirebaseConfigured(): boolean {
    return Boolean(env.firebase.apiKey && env.firebase.projectId);
}
