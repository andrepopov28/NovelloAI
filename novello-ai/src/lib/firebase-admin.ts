import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        } else {
            // Fallback to application default credentials (ADC)
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        }
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export const auth = admin.auth();
export const db = admin.firestore();

/**
 * Verifies the Firebase ID token from the Authorization header.
 * @param authHeader The Authorization header value (e.g., "Bearer <token>")
 * @returns The decoded token if valid, otherwise throws an error.
 */
export async function verifyIdToken(authHeader: string | null) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing or invalid token');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            const isLocalError = (error as any)?.code === 'app/no-credentials' || (error as any)?.message?.includes('credentials');
            if (isLocalError) {
                console.warn('[Firebase Admin Warning] Missing or invalid credentials. Bypassing check in development mode.');
                return { uid: 'dev-user', email: 'dev@novello.ai' } as any;
            }
        }
        console.error('Token verification error:', error);
        throw new Error('Unauthorized: Token verification failed');
    }
}
