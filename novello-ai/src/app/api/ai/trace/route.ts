import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseDb } from '@/lib/firebase';
import { collection, getDocs, query, where, writeBatch, doc } from '@/lib/firebase';
import type { Chapter, Entity } from '@/lib/types';
import { verifyIdToken, db as adminDb } from '@/lib/firebase-admin';

// =============================================
// POST /api/ai/trace
// Scans chapters for entity mentions and updates
// Entity.appearances[]. Ownership-checked.
// =============================================

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const decoded = await verifyIdToken(authHeader);

        const { projectId } = await req.json();
        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        // ── Ownership check via Admin SDK ─────────────────────────────────
        const projectDoc = await adminDb.collection('projects').doc(projectId).get();
        if (!projectDoc.exists || projectDoc.data()?.userId !== decoded.uid) {
            return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
        }

        const db = getFirebaseDb();

        // Fetch all chapters
        const chaptersSnap = await getDocs(
            query(collection(db, 'chapters'), where('projectId', '==', projectId))
        );
        const chapters = chaptersSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Chapter
        );

        // Fetch all entities
        const entitiesSnap = await getDocs(
            query(collection(db, 'entities'), where('projectId', '==', projectId))
        );
        const entities = entitiesSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Entity
        );

        if (entities.length === 0) {
            return NextResponse.json({ traced: 0 });
        }

        // Scan: for each entity, find which chapters mention its name
        const batch = writeBatch(db);
        let traced = 0;

        for (const entity of entities) {
            const namePattern = new RegExp(`\\b${escapeRegex(entity.name)}\\b`, 'gi');
            const appearances: string[] = [];

            for (const chapter of chapters) {
                // Strip HTML using safe regex (bounded to prevent ReDoS)
                const text = (chapter.content || '').replace(/<[^>]{0,1000}>/g, '');
                if (namePattern.test(text)) {
                    appearances.push(chapter.id);
                }
            }

            // Only update if appearances changed
            const currentApps = (entity.appearances || []).sort().join(',');
            const newApps = appearances.sort().join(',');
            if (currentApps !== newApps) {
                batch.update(doc(db, 'entities', entity.id), { appearances });
                traced++;
            }
        }

        await batch.commit();

        return NextResponse.json({ traced, total: entities.length });
    } catch (error) {
        console.error('[Entity Trace Error]', error);
        const message = error instanceof Error ? error.message : 'Tracing failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
