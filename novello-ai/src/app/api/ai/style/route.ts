import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, AIProvider } from '@/lib/ai';
import { STYLE_PROMPT } from '@/lib/prompts';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const body = await req.json();
        const { chaptersContent, provider = 'auto', model } = body;

        if (!chaptersContent) {
            return NextResponse.json({ error: 'Chapters content is required' }, { status: 400 });
        }

        const prompt = STYLE_PROMPT(chaptersContent);

        const result = await generateJSON({
            prompt,
            provider: provider as AIProvider,
            model,
        });

        let data;
        try {
            data = typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
            console.error('Failed to parse style AI JSON response', e);
            data = null;
        }

        if (data && data.avgSentenceLength) {
             return NextResponse.json(data);
        } else {
             return NextResponse.json({ error: 'Failed to generate style profile' }, { status: 500 });
        }

    } catch (error) {
        console.error('[Style Generator Error]', error);
        return NextResponse.json({ error: 'Failed to analyze style' }, { status: 500 });
    }
}
