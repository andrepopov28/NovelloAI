const admin = require('firebase-admin');
const projectId = 'Mn0bLKLITUqpNrAEvkZM';

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'novello-ai'
    });
}

const db = admin.firestore();

async function checkChapters() {
    try {
        const snapshot = await db.collection('projects').doc(projectId).collection('chapters').orderBy('order').get();
        console.log(`Project: ${projectId}`);
        console.log(`Total Chapters: ${snapshot.size}`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id} | Order: ${data.order} | Title: ${data.title}`);
        });
    } catch (e) {
        console.error(e);
    }
}

checkChapters();
