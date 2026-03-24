import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { cancelAudiobookJob } from '@/lib/audiobook-generator';
import { z } from 'zod';

const CancelRequestSchema = z.object({
    exportId: z.string().uuid(),
}).strict();

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        let body: z.infer<typeof CancelRequestSchema>;
        try {
            const rawBody = await req.json();
            body = CancelRequestSchema.parse(rawBody);
        } catch (e: any) {
            return NextResponse.json({ error: 'Invalid request payload', details: e.errors ?? e.message }, { status: 400 });
        }

        cancelAudiobookJob(body.exportId);
        return NextResponse.json({ status: 'cancelled', exportId: body.exportId });
    } catch (error: any) {
        console.error('API /api/ai/audiobook/cancel Error:', error);
        return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 });
    }
}
