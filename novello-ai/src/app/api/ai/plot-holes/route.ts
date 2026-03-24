import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, AIProvider } from '@/lib/ai';
import { PLOT_HOLE_PROMPT } from '@/lib/prompts';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const body = await req.json();
        const {
            chapters,   // Array of { title, order, lastSummary, synopsis }
            entities,   // Array of { name, type, description }
            provider = 'ollama',
            model,
        } = body;

        if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
            return NextResponse.json({ error: 'Chapters array is required' }, { status: 400 });
        }

        // Slim down for token efficiency
        const chaptersSummary = chapters.map((c: Record<string, unknown>, i: number) => ({
            order: i + 1,
            title: c.title,
            summary: c.lastSummary || c.synopsis || 'No summary available',
        }));

        const entitiesSummary = (entities || []).map((e: Record<string, unknown>) => ({
            name: e.name,
            type: e.type,
            description: e.description,
        }));

        const prompt = PLOT_HOLE_PROMPT(
            JSON.stringify(chaptersSummary, null, 2),
            JSON.stringify(entitiesSummary, null, 2),
        );

        const result = await generateJSON({
            prompt,
            provider: provider as AIProvider,
            model,
        });

        let data;
        try {
            data = typeof result === 'string' ? JSON.parse(result) : result;
        } catch {
            data = { openThreads: [], summary: 'Unable to parse AI response. Try again.' };
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[Plot Holes Error]', error);
        return NextResponse.json({ error: 'Failed to detect plot holes' }, { status: 500 });
    }
}
