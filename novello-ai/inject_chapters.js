const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const projectId = 'Mn0bLKLITUqpNrAEvkZM';

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'novello-ai'
    });
}

const db = admin.firestore();

async function injectChapters() {
    try {
        const snapshot = await db.collection('projects').doc(projectId).collection('chapters').orderBy('order').get();
        const chapters = snapshot.docs.map(doc => ({ id: doc.id, ref: doc.ref }));

        for (let i = 0; i < chapters.length; i++) {
            const filename = `chapter_${i}_long.txt`;
            const filePath = path.join(__dirname, filename);

            if (fs.existsSync(filePath)) {
                console.log(`Injecting ${filename} into DB...`);
                const content = fs.readFileSync(filePath, 'utf8');
                await chapters[i].ref.update({
                    content: content,
                    updatedAt: Date.now()
                });
                console.log(`Success: ${filename}`);
            } else {
                console.log(`File ${filename} not found yet, skipping.`);
            }
        }
        console.log("Injection cycle complete.");
    } catch (e) {
        console.error("Injection error:", e);
    }
}

injectChapters();
