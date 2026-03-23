import { NextResponse } from 'next/server';
import { audiobookQueue } from '@/lib/queue/audiobookQueue';
import { z } from 'zod';
import crypto from 'crypto';

const AudiobookRequestSchema = z.object({
    projectId: z.string(),
    settings: z.object({
        voiceId: z.string(),
        language: z.string().optional().default('en'),
        speed: z.number().optional().default(1),
        pauseDurationMs: z.number().optional().default(1000),
    }).strict(),
}).strict();

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        const uid = authHeader?.replace('Bearer ', '') || 'local';

        let body;
        try {
            const rawBody = await req.json();
            body = AudiobookRequestSchema.parse(rawBody);
        } catch (e: any) {
            return NextResponse.json({ error: 'Invalid request payload', details: e.errors || e.message }, { status: 400 });
        }

        const { projectId, settings } = body;

        const exportId = crypto.randomUUID();

        const exportRecord = {
            id: exportId,
            projectId,
            userId: uid,
            type: 'audiobook',
            status: 'queued',
            progress: {
                currentChapter: 0,
                totalChapters: 0,
                percentComplete: 0,
                stage: 'queued',
            },
            formats: {},
            settings: {
                voiceId: settings.voiceId,
                language: settings.language || 'en',
                speed: settings.speed || 1,
                pauseDurationMs: settings.pauseDurationMs || 1000,
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Enqueue the job (no-op in local mode)
        await audiobookQueue.add('generate-audiobook', {
            exportId,
            projectId,
            userId: uid,
            settings: exportRecord.settings,
        }, { jobId: exportId });

        return NextResponse.json({ exportId, ...exportRecord });
    } catch (error: any) {
        console.error('API /api/ai/audiobook Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
