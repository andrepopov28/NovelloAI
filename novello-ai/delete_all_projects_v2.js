const admin = require('firebase-admin');

// Manually set project ID if env is missing
const projectId = 'novello-ai';

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: projectId
    });
}

const db = admin.firestore();

async function deleteAllProjects() {
    try {
        const snapshot = await db.collection('projects').get();
        if (snapshot.empty) {
            console.log("No projects found to delete.");
            return;
        }

        const batch = db.batch();
        snapshot.forEach(doc => {
            console.log(`Deleting project: ${doc.id} (${doc.data().title})`);
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log("Successfully deleted all projects.");
    } catch (e) {
        console.error("Error deleting projects:", e);
    }
}

deleteAllProjects();
