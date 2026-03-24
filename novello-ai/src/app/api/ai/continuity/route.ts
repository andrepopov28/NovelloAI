import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, AIProvider } from '@/lib/ai';
import { CONTINUITY_PROMPT } from '@/lib/prompts';
import { verifyIdToken } from '@/lib/firebase-admin';

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


        if (!chapterContent) {
            return NextResponse.json({ error: 'Chapter content is required' }, { status: 400 });
        }

        const prompt = CONTINUITY_PROMPT(chapterContent, manualEntities || 'None', manualContext || 'None');

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
