import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';
import { getDoc, setDoc, doc, setLogLevel } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let testEnv: RulesTestEnvironment;
let uatContext: RulesTestContext;
const PROJECT_ID = 'demo-uat-project';
const UID = 'uat-user-1';

beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    setLogLevel('error');

    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules, host: '127.0.0.1', port: 8080 },
    });
    uatContext = testEnv.authenticatedContext(UID);
});

afterAll(async () => {
    if (testEnv) {
        await testEnv.cleanup();
    }
});

describe('Worker Pipelines Integration', () => {

    it('simulates Audiobook Pipeline state transitions', async () => {
        const db = uatContext.firestore();
        const exportId = 'audiobook-export-1';

        // 1. Initial State
        await setDoc(doc(db, 'exports', exportId), {
            userId: UID,
            projectId: 'uat-project-1',
            status: 'queued',
            progress: { stage: 'cleaning' }
        });

        // 2. Worker logic (simulated) begins processing
        await setDoc(doc(db, 'exports', exportId), {
            status: 'processing',
            progress: { stage: 'tts' }
        }, { merge: true });

        const processingDoc = await getDoc(doc(db, 'exports', exportId));
        expect(processingDoc.data()?.status).toBe('processing');

        // 3. Worker logic completes
        await setDoc(doc(db, 'exports', exportId), {
            status: 'completed',
            formats: { mp3: 'url', m4b: 'url' }
        }, { merge: true });

        const completedDoc = await getDoc(doc(db, 'exports', exportId));
        expect(completedDoc.data()?.status).toBe('completed');
        expect(completedDoc.data()?.formats.mp3).toBeDefined();
    }, 15000);

    it('simulates Voice Clone transition', async () => {
        const db = uatContext.firestore();
        const cloneId = 'voice-clone-1';

        // 1. Create document mapping to upload
        await setDoc(doc(db, `users/${UID}/voices/${cloneId}`), {
            status: 'training',
            source: 'upload'
        });

        // 2. Simulated worker transition
        await setDoc(doc(db, `users/${UID}/voices/${cloneId}`), {
            status: 'ready'
        }, { merge: true });

        const docSnap = await getDoc(doc(db, `users/${UID}/voices/${cloneId}`));
        expect(docSnap.data()?.status).toBe('ready');
    }, 15000);
});
