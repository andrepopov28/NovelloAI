import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, AIProvider } from '@/lib/ai';
import { CONTINUITY_PROMPT } from '@/lib/prompts';
import { verifyIdToken, db } from '@/lib/firebase-admin';
import { LoomEngine } from '@/lib/loom-engine';
import { Project, Chapter, Entity, Series } from '@/lib/types';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const decoded = await verifyIdToken(authHeader);

        const body = await req.json();
        const {
            chapterContent,
            entities: manualEntities,
            previousContext: manualContext,
            provider = 'auto',
            model,
            projectId,
        } = body;

        let entities = manualEntities;
        let previousContext = manualContext;

        if (projectId && (!manualEntities || !manualContext)) {
            try {
                const [projectDoc, chaptersSnap, entitiesSnap] = await Promise.all([
                    db.collection('projects').doc(projectId).get(),
                    db.collection('chapters').where('projectId', '==', projectId).get(),
                    db.collection('entities').where('projectId', '==', projectId).get(),
                ]);

                // ── Ownership check ────────────────────────────────────────────
                if (!projectDoc.exists || projectDoc.data()?.userId !== decoded.uid) {
                    return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
                }

                const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
                const chaptersData = chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
                const entitiesData = entitiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Entity));

                let seriesData: Series | null = null;
                if (projectData.seriesId) {
                    const seriesDoc = await db.collection('series').doc(projectData.seriesId).get();
                    if (seriesDoc.exists) {
                        seriesData = { id: seriesDoc.id, ...seriesDoc.data() } as Series;
                    }
                }

                previousContext = LoomEngine.assembleContext(
                    projectData,
                    chaptersData,
                    entitiesData,
                    seriesData,
                    { currentText: chapterContent || '', includeEntities: false }
                );

                entities = entitiesData
                    .map(e => `${e.name} (${e.type}): ${e.description}`)
                    .join('\n');
            } catch (err) {
                console.warn('[Continuity Loom Error]', err);
            }
        }

        if (!chapterContent) {
            return NextResponse.json({ error: 'Chapter content is required' }, { status: 400 });
        }

        const prompt = CONTINUITY_PROMPT(chapterContent, entities || 'None', previousContext || 'None');

        const result = await generateJSON({
            prompt,
            provider: provider as AIProvider,
            model,
        });

        let data;
        try {
            data = typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
            console.error('Failed to parse AI JSON response');
            data = { alerts: [] };
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Continuity Check Error]', error);
        return NextResponse.json({ error: 'Failed to check continuity' }, { status: 500 });
    }
}
