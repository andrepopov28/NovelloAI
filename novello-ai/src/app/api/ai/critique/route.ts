import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, AIProvider } from '@/lib/ai';
import { CRITIQUE_PROMPT } from '@/lib/prompts';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const decoded = await verifyIdToken(authHeader);

        const body = await req.json();
        const {
            chapterId,
            chapterTitle,
            chapterContent,
            context,
            provider = 'ollama',
            model,
        } = body;

        if (!chapterContent) {
            return NextResponse.json({ error: 'Chapter content is required' }, { status: 400 });
        }

        const prompt = CRITIQUE_PROMPT(chapterTitle || 'Untitled Chapter', chapterContent, context);

        const result = await generateJSON({
            prompt,
            provider: provider as AIProvider,
            model,
        });

        let data;
        try {
            data = typeof result === 'string' ? JSON.parse(result) : result;
        } catch {
            data = {
                overallScore: 5,
                pacing: { score: 5, feedback: 'Unable to parse AI critique.' },
                tension: { score: 5, feedback: '' },
                characterVoice: { score: 5, feedback: '' },
                hookStrength: { score: 5, feedback: '' },
                highlights: [],
                suggestions: ['Try running the critique again.'],
            };
        }

        return NextResponse.json({ ...data, chapterId });
    } catch (error) {
        console.error('[Critique Error]', error);
        return NextResponse.json({ error: 'Failed to generate critique' }, { status: 500 });
    }
}
