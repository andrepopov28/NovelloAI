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
    // 1. Initialize Firestore Emulator Sandbox
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    setLogLevel('error');

    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules, host: '127.0.0.1', port: 8080 },
    });
    uatContext = testEnv.authenticatedContext(UID);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (...args) => {
        const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : args[0].toString());
        const url = new URL(urlStr, 'http://localhost');
        const hostname = url.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'host.docker.internal' || hostname === 'redis-uat' || hostname === 'firebase-emulators') {
            return originalFetch(...args);
        }
        throw new Error(`[UAT No-Egress Guard] Blocked external request to: ${urlStr}`);
    };
});

afterAll(async () => {
    await testEnv.cleanup();
});

describe('Token & Cost Monitor Integrity', () => {

    it('denies external network requests due to the global no-egress guard', async () => {
        // Just verify our global setup is working
        await expect(fetch('https://google.com')).rejects.toThrowError(/\[UAT No-Egress Guard\]/);
        await expect(fetch('https://api.openai.com/v1/chat')).rejects.toThrowError(/\[UAT No-Egress Guard\]/);
    });

    it('allows internal requests to local Ollama', async () => {
        // Technically this might fail if Ollama is not running, but it shouldn't throw the custom No Egress error.
        try {
            await fetch('http://host.docker.internal:11434');
        } catch (e: any) {
            expect(e.message).not.toContain('No-Egress Guard');
        }
    });

    it('logs token events correctly in Firestore', async () => {
        const db = uatContext.firestore();
        const eventId = 'token-event-1';

        // Simulating the backend hook `logTokenUsage`
        await setDoc(doc(db, `users/${UID}/token_events/${eventId}`), {
            timestamp: new Date().toISOString(),
            provider: 'ollama',
            model: 'phi3.5:3.8b-mini-instruct-q5_K_M',
            inputTokens: 100,
            outputTokens: 50,
            totalTokens: 150,
            cost: 0,
            valueSaved: 0.00075 // $5 per 1M local token value
        });

        const eventDoc = await getDoc(doc(db, `users/${UID}/token_events/${eventId}`));
        expect(eventDoc.exists()).toBe(true);
        expect(eventDoc.data()?.totalTokens).toEqual(150);
        expect(eventDoc.data()?.provider).toEqual('ollama');
    });
});
