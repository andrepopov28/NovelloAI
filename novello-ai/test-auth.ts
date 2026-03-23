import * as admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({ projectId: 'demo-uat-project' });

(async () => {
    try {
        console.log("Checking project ID:", admin.app().options.projectId);
        const user = await admin.auth().getUserByEmail('uat.user@test.com');
        console.log("SUCCESS! User retrieved from admin:", user.uid);
    } catch (err) {
        console.error("FAIL! Admin user get failed:", err);
    }
    process.exit();
})();
