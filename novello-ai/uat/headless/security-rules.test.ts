import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, RulesTestContext } from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc, deleteDoc, setLogLevel } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;
let aliceContext: RulesTestContext;
let bobContext: RulesTestContext;
let unauthContext: RulesTestContext;

const ALICE_UID = 'alice_uat';
const BOB_UID = 'bob_uat';
const PROJECT_ID = 'demo-uat-project';

beforeAll(async () => {
    // Read local rules file
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    // Mute verbose firestore logs
    setLogLevel('error');

    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules,
            host: '127.0.0.1',
            port: 8080,
        },
    });

    aliceContext = testEnv.authenticatedContext(ALICE_UID);
    bobContext = testEnv.authenticatedContext(BOB_UID);
    unauthContext = testEnv.unauthenticatedContext();
});

afterAll(async () => {
    await testEnv.cleanup();
});

describe('Firestore Security Rules: Users Collection', () => {
    it('Denies unauthenticated read/write to users', async () => {
        const db = unauthContext.firestore();
        await expect(getDoc(doc(db, 'users', ALICE_UID))).rejects.toThrow();
        await expect(setDoc(doc(db, 'users', ALICE_UID), { test: true })).rejects.toThrow();
    });

    it('Allows authenticated user to write their own document', async () => {
        const db = aliceContext.firestore();
        await expect(setDoc(doc(db, 'users', ALICE_UID), { name: 'Alice' })).resolves.not.toThrow();
    });

    it('Denies cross-tenant write to users', async () => {
        const db = bobContext.firestore();
        await expect(setDoc(doc(db, 'users', ALICE_UID), { name: 'Bob Hacker' })).rejects.toThrow();
    });
});

describe('Firestore Security Rules: Projects Collection', () => {
    it('Allows user to create a project if uid matches', async () => {
        const db = aliceContext.firestore();
        await expect(setDoc(doc(db, 'projects', 'alice_proj'), { userId: ALICE_UID, title: 'Alice Book' })).resolves.not.toThrow();
    });

    it('Denies user creating a project with mismatched uid', async () => {
        const db = aliceContext.firestore();
        await expect(setDoc(doc(db, 'projects', 'alice_proj_fake2'), { userId: BOB_UID, title: 'Fake' })).rejects.toThrow();
    });

    it('Denies cross-tenant read of projects', async () => {
        const db = bobContext.firestore();
        await expect(getDoc(doc(db, 'projects', 'alice_proj'))).rejects.toThrow();
    });

    it('Denies unauthenticated read of projects', async () => {
        const db = unauthContext.firestore();
        await expect(getDoc(doc(db, 'projects', 'alice_proj'))).rejects.toThrow();
    });
});

describe('Firestore Security Rules: Subcollections (Chapters/Entities/Exports)', () => {
    it('Allows owner to create a chapter in their project', async () => {
        const db = aliceContext.firestore();
        await expect(setDoc(doc(db, 'chapters/ch1'), { userId: ALICE_UID, title: 'Chapter 1' })).resolves.not.toThrow();
    });

    it('Denies user from creating a chapter with mismatched userId', async () => {
        const db = bobContext.firestore();
        await expect(setDoc(doc(db, 'chapters/ch3_bob_fake'), { userId: ALICE_UID, title: 'Chapter 2' })).rejects.toThrow();
    });

    it('Allows owner to read their own chapter', async () => {
        const db = aliceContext.firestore();
        await expect(getDoc(doc(db, 'chapters/ch1'))).resolves.not.toThrow();
    });

    it('Denies non-owner from reading a chapter in another project', async () => {
        const db = bobContext.firestore();
        await expect(getDoc(doc(db, 'chapters/ch1'))).rejects.toThrow();
    });
});

describe('Firestore Security Rules: Voice Clones', () => {
    it('Allows owner to create and read voice clone', async () => {
        const db = aliceContext.firestore();
        await expect(setDoc(doc(db, `users/${ALICE_UID}/voices/voice1`), { status: 'ready' })).resolves.not.toThrow();
        await expect(getDoc(doc(db, `users/${ALICE_UID}/voices/voice1`))).resolves.not.toThrow();
    });

    it('Denies non-owner access to voice clone', async () => {
        const db = bobContext.firestore();
        await expect(getDoc(doc(db, `users/${ALICE_UID}/voices/voice1`))).rejects.toThrow();
        await expect(setDoc(doc(db, `users/${ALICE_UID}/voices/voice1_fake`), { status: 'hacked' })).rejects.toThrow();
    });
});

describe('Firestore Security Rules: Voice Catalog', () => {
    it('Denies unauthenticated read to voice_catalog', async () => {
        const db = unauthContext.firestore();
        await expect(getDoc(doc(db, 'voice_catalog', 'builtin1'))).rejects.toThrow();
    });

    it('Denies authenticated write to voice_catalog', async () => {
        const db = aliceContext.firestore();
        await expect(setDoc(doc(db, 'voice_catalog', 'builtin2'), { name: 'Hacked' })).rejects.toThrow();
    });
});
