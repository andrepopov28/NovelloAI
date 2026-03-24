import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, AIProvider } from '@/lib/ai';
import { STYLE_PROMPT } from '@/lib/prompts';
import { computeProjectStyle } from '@/lib/style-engine';
import { verifyIdToken } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const body = await req.json();
        const {
            chaptersContent,  // concatenated text from multiple chapters
            chapters,         // raw chapter objects for heuristic fallback
            provider = 'ollama',
            model,
        } = body;

        if (!chaptersContent && (!chapters || chapters.length === 0)) {
            return NextResponse.json({ error: 'Content or chapters required' }, { status: 400 });
        }

        const textSample = chaptersContent || chapters.map((c: { content: string }) => c.content || '').join('\n\n');
        const trimmedSample = textSample.slice(0, 12000); // ~3k words for style analysis

        // Try LLM-based style analysis first (F7: LLM-backed style engine)
        let styleProfile = null;
        try {
            const prompt = STYLE_PROMPT(trimmedSample);
            const result = await generateJSON({
                prompt,
                provider: provider as AIProvider,
                model,
            });
            const parsed = typeof result === 'string' ? JSON.parse(result) : result;
            // Validate the shape
            if (parsed && parsed.avgSentenceLength && parsed.vocabularyLevel) {
                styleProfile = parsed;
            }
        } catch (aiError) {
            console.warn('[Style] AI analysis failed, falling back to heuristics:', aiError);
        }

        // Heuristic fallback (computeProjectStyle uses regex-based approach)
        if (!styleProfile && chapters && chapters.length > 0) {
            styleProfile = computeProjectStyle(chapters);
        }

        if (!styleProfile) {
            return NextResponse.json({ error: 'Could not compute style profile' }, { status: 503 });
        }

        return NextResponse.json(styleProfile);
    } catch (error) {
        console.error('[Style Error]', error);
        return NextResponse.json({ error: 'Failed to analyze style' }, { status: 500 });
    }
}
