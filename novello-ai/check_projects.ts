import * as admin from 'firebase-admin';

// Initialize Firebase Admin (mocked/local or using default credentials)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'novello-ai'
    });
}
const db = admin.firestore();

async function checkProjects() {
    try {
        const snapshot = await db.collection('projects').get();
        if (snapshot.empty) {
            console.log("No projects found.");
            return;
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`Title: ${data.title}`);
            console.log(`Synopsis: ${data.synopsis}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    }
}

checkProjects();
