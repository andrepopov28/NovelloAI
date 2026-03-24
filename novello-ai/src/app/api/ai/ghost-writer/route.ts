import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, AIProvider } from '@/lib/ai';
import { GHOST_WRITER_PROMPT } from '@/lib/prompts';
import { verifyIdToken } from '@/lib/firebase-admin';
import { StyleProfile } from '@/lib/prompts';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const body = await req.json();
        const {
            chapterTitle,
            chapterSynopsis,
            context,
            styleProfile,
            wordTarget = 1500,
            provider = 'ollama',
            model,
        } = body;

        if (!chapterSynopsis) {
            return NextResponse.json({ error: 'Chapter synopsis is required' }, { status: 400 });
        }

        const prompt = GHOST_WRITER_PROMPT(
            chapterTitle || 'Chapter',
            chapterSynopsis,
            context || '',
            styleProfile as StyleProfile | null,
            wordTarget,
        );

        // Ghost Writer always streams — returns HTML content
        const { streamGenerate } = await import('@/lib/ai');
        const { textStream } = await streamGenerate({
            prompt,
            provider: provider as AIProvider,
            model,
        });

        // Return as a streaming response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                for await (const chunk of textStream) {
                    controller.enqueue(encoder.encode(chunk));
                }
                controller.close();
            },
        });

        return new NextResponse(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('[Ghost Writer Error]', error);
        return NextResponse.json({ error: 'Ghost Writer failed' }, { status: 500 });
    }
}
