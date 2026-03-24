import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import type { Chapter, Entity } from '@/lib/types';

// =============================================
// POST /api/ai/trace
// Scans chapters for entity mentions and returns
// an appearances map. Caller applies updates to local-db.
// Local-first: chapters + entities passed in body (IndexedDB data).
// =============================================

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const body = await req.json();
        const { chapters, entities } = body as { chapters: Chapter[]; entities: Entity[] };

        if (!Array.isArray(chapters) || !Array.isArray(entities)) {
            return NextResponse.json(
                { error: 'chapters (array) and entities (array) are required in the request body' },
                { status: 400 }
            );
        }

        if (entities.length === 0) {
            return NextResponse.json({ traced: 0, appearances: {} });
        }

        // Scan: for each entity, find which chapters mention its name
        const appearances: Record<string, string[]> = {};
        let traced = 0;

        for (const entity of entities) {
            if (!entity.name) continue;
            const namePattern = new RegExp(`\\b${escapeRegex(entity.name)}\\b`, 'gi');
            const entityAppearances: string[] = [];

            for (const chapter of chapters) {
                // Strip HTML using safe regex (bounded to prevent ReDoS)
                const text = (chapter.content || '').replace(/<[^>]{0,1000}>/g, '');
                if (namePattern.test(text)) {
                    entityAppearances.push(chapter.id);
                }
            }

            const currentApps = (entity.appearances || []).sort().join(',');
            const newApps = entityAppearances.sort().join(',');
            if (currentApps !== newApps) {
                appearances[entity.id] = entityAppearances;
                traced++;
            }
        }

        return NextResponse.json({ traced, total: entities.length, appearances });
    } catch (error) {
        console.error('[Entity Trace Error]', error);
        const message = error instanceof Error ? error.message : 'Tracing failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
