// Environment Variable Validation
// Warns on missing vars in development; in production, Firebase init will
// fail gracefully at runtime rather than crashing the build.

const isBrowser = typeof window !== 'undefined';

function required(key: string, value: string | undefined): string {
    if (!value || value.trim() === '') {
        // Only warn — never crash the build. Runtime checks are in firebase.ts.
        if (isBrowser || process.env.NODE_ENV === 'development') {
            console.warn(`⚠️  Missing env var: ${key}`);
        }
        return '';
    }
    return value;
}

// Client-side (NEXT_PUBLIC_*) — available in browser
export const env = {
    firebase: {
        apiKey: required('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
        authDomain: required('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
        projectId: required('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    },
} as const;

// Server-side only — never exposed to the browser
export const serverEnv = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
} as const;
