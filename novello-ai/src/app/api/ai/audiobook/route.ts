/**
 * POST /api/ai/audiobook
 *
 * Generates a full audiobook (.m4b) from chapter content.
 * Returns a Server-Sent Events (SSE) stream of progress events.
 *
 * Body: {
 *   projectTitle: string
 *   chapters: Array<{ id, title, content, order }>
 *   settings: { voiceId, speed, pauseDurationMs, language }
 * }
 *
 * Each SSE event is a JSON-encoded ProgressEvent from audiobook-generator.ts.
 * On completion, the event includes a `downloadUrl` for the .m4b file.
 */

import { verifyIdToken } from '@/lib/firebase-admin';
import { generateAudiobook } from '@/lib/audiobook-generator';
import { z } from 'zod';
import crypto from 'crypto';

const ChapterSchema = z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    order: z.number(),
});

const AudiobookRequestSchema = z.object({
    projectTitle: z.string().min(1).max(200),
    chapters: z.array(ChapterSchema).min(1).max(200),
    settings: z.object({
        voiceId: z.string(),
        language: z.string().optional().default('en'),
        speed: z.number().min(0.5).max(2).optional().default(1),
        pauseDurationMs: z.number().min(0).max(10000).optional().default(1000),
    }),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);
    } catch {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let body: z.infer<typeof AudiobookRequestSchema>;
    try {
        const raw = await req.json();
        body = AudiobookRequestSchema.parse(raw);
    } catch (e: unknown) {
        const error = e as { errors?: unknown; message?: string };
        return new Response(JSON.stringify({ error: 'Invalid request payload', details: error.errors ?? error.message }), { status: 400 });
    }

    const exportId = crypto.randomUUID();

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            function send(event: object) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }

            // Send the exportId immediately so client can cancel if needed
            send({ type: 'started', exportId });

            try {
                const generator = generateAudiobook(
                    exportId,
                    body.chapters,
                    body.projectTitle,
                    {
                        voiceId: body.settings.voiceId,
                        speed: body.settings.speed ?? 1,
                        pauseDurationMs: body.settings.pauseDurationMs ?? 1000,
                        language: body.settings.language ?? 'en',
                    },
                );

                for await (const event of generator) {
                    send(event);
                    if (event.type === 'complete' || event.type === 'error') {
                        break;
                    }
                }
            } catch (err: unknown) {
                const error = err as Error;
                send({ type: 'error', stage: 'tts', currentChapter: 0, totalChapters: body.chapters.length, percentComplete: 0, message: error.message });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Export-Id': exportId,
        },
    });
}
