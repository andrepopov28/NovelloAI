const admin = require('firebase-admin');
const projectId = 'Mn0bLKLITUqpNrAEvkZM';

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'novello-ai'
    });
}

const db = admin.firestore();

const TITLES = [
    "Introduction – The Day Intelligence Became Cheap",
    "Chapter 1 – The Death of Smart",
    "Chapter 2 – Direction in an Age of Infinite Options (D)",
    "Chapter 3 – Relevance Is Power (R)",
    "Chapter 4 – Emotional Control as Alpha (E)",
    "Chapter 5 – Agency Over Automation (A)",
    "Chapter 6 – Meaning as the Ultimate Moat (M)",
    "Chapter 7 – Building Your Personal Flywheel",
    "Chapter 8 – The Human Premium"
];

async function updateChapters() {
    try {
        const snapshot = await db.collection('projects').doc(projectId).collection('chapters').orderBy('order').get();
        const batch = db.batch();
        let i = 0;

        snapshot.forEach(doc => {
            if (i < TITLES.length) {
                console.log(`Renaming Ch ${i + 1}: ${doc.id} -> ${TITLES[i]}`);
                batch.update(doc.ref, { title: TITLES[i] });
                i++;
            } else {
                // If extra chapters exist, maybe delete them?
                console.log(`Extra chapter found: ${doc.id}, deleting.`);
                batch.delete(doc.ref);
            }
        });

        // If fewer chapters exist, create them? (Though subagent said it added them)
        while (i < TITLES.length) {
            console.log(`Creating missing Ch ${i + 1}: ${TITLES[i]}`);
            const newRef = db.collection('projects').doc(projectId).collection('chapters').doc();
            batch.set(newRef, {
                id: newRef.id,
                title: TITLES[i],
                order: i,
                content: '',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                uid: 'dev-user'
            });
            i++;
        }

        await batch.commit();
        console.log("All chapters updated successfully.");
    } catch (e) {
        console.error(e);
    }
}

updateChapters();
