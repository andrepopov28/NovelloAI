import { beforeAll } from 'vitest';
import * as admin from 'firebase-admin';

// 3. No Egress Guard: Throw error if native fetch goes to the internet
const originalFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
    const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : args[0].toString());
    const url = new URL(urlStr, 'http://localhost');
    const hostname = url.hostname;

    // Allowed internal/local traffic
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'host.docker.internal' || hostname === 'redis-uat' || hostname === 'firebase-emulators') {
        return originalFetch(...args);
    }

    throw new Error(`[UAT No-Egress Guard] Blocked external request to: ${urlStr}`);
};

beforeAll(() => {
    // 1. Force emulator
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9199';
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-uat-project';

    // 2. Initialize Firebase Admin if not already
    if (!admin.apps.length) {
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            credential: admin.credential.applicationDefault(),
            storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
        });
    }
});
