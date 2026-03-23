import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'fs';

// Prerequisites: Firebase emulator must be running: firebase emulators:start --only firestore

describe('Firestore Security Rules', () => {
    let testEnv;

    before(async () => {
        testEnv = await initializeTestEnvironment({
            projectId: 'novello-ai-test',
            firestore: {
                rules: fs.readFileSync('firestore.rules', 'utf8'),
            },
        });
    });

    after(async () => {
        if (testEnv) await testEnv.cleanup();
    });

    beforeEach(async () => {
        if (testEnv) await testEnv.clearFirestore();
    });

    it('1. Users Collection: Owners can read/write their own profile', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertSucceeds(alice.firestore().doc('users/alice').set({ name: 'Alice' }));
        await assertSucceeds(alice.firestore().doc('users/alice').get());
    });

    it('2. Users Collection: Non-owners cannot read or write', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertFails(alice.firestore().doc('users/bob').set({ name: 'Bob' }));
        await assertFails(alice.firestore().doc('users/bob').get());
    });

    it('3. Projects Collection: Must have userId matching UID', async () => {
        const unauth = testEnv.unauthenticatedContext();
        await assertFails(unauth.firestore().doc('projects/p1').get());

        const alice = testEnv.authenticatedContext('alice');
        await assertFails(alice.firestore().doc('projects/p1').set({ userId: 'bob' }));
        await assertSucceeds(alice.firestore().doc('projects/p1').set({ userId: 'alice' }));
    });

    it('4. Chapters Collection: Must have userId matching UID', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertSucceeds(alice.firestore().doc('chapters/c1').set({ userId: 'alice' }));
        await assertFails(alice.firestore().doc('chapters/c1').set({ userId: 'bob' }));
    });

    it('5. Versions Subcollection: Check matching userId', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertSucceeds(alice.firestore().doc('chapters/c1').set({ userId: 'alice' }));
        await assertSucceeds(alice.firestore().doc('chapters/c1/versions/v1').set({ userId: 'alice' }));
    });

    it('6. Entities Collection: Protected', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertSucceeds(alice.firestore().doc('entities/e1').set({ userId: 'alice' }));
        await assertFails(alice.firestore().doc('entities/e1').set({ userId: 'bob' }));
    });

    it('7. Conversations Collection: Checks userId OR uid fields', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertSucceeds(alice.firestore().doc('conversations/1').set({ userId: 'alice' }));
        await assertSucceeds(alice.firestore().doc('conversations/2').set({ uid: 'alice' }));
        await assertFails(alice.firestore().doc('conversations/3').set({ userId: 'bob' }));
    });

    it('8. Exports Collection: Protected', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertSucceeds(alice.firestore().doc('exports/1').set({ userId: 'alice' }));
        await assertFails(alice.firestore().doc('exports/2').set({ userId: 'bob' }));
    });

    it('9. ContinuityReports Collection: Protected', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertSucceeds(alice.firestore().doc('continuityReports/1').set({ userId: 'alice' }));
        await assertFails(alice.firestore().doc('continuityReports/2').set({ userId: 'bob' }));
    });

    it('10. Invalid Collections are blocked completely', async () => {
        const alice = testEnv.authenticatedContext('alice');
        await assertFails(alice.firestore().doc('secretSettings/1').set({ foo: 'bar' }));
        await assertFails(alice.firestore().doc('secretSettings/1').get());
    });
});
