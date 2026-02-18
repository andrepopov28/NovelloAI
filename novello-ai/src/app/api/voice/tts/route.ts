import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// POST /api/voice/tts
// Text-to-Speech synthesis via Piper TTS (local).
// PRD V27 §6.4: Audiobook generation endpoint.
// Falls back to a 501 if Piper is not configured.
// =============================================

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    await verifyIdToken(authHeader);

    const body = await req.json();
    const { text, voiceId, speed = 1.0 } = body;

    if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const piperUrl = process.env.PIPER_TTS_URL;

    if (!piperUrl) {
        // Piper not configured — return 501 with a clear message
        return NextResponse.json(
            {
                error: 'Piper TTS is not configured. Set PIPER_TTS_URL in your .env.local to enable audiobook generation.',
                code: 'PIPER_NOT_CONFIGURED',
            },
            { status: 501 }
        );
    }

    try {
        const piperRes = await fetch(`${piperUrl}/synthesize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voice_id: voiceId, speed }),
            signal: AbortSignal.timeout(60_000),
        });

        if (!piperRes.ok) {
            const err = await piperRes.text();
            return NextResponse.json({ error: `Piper TTS error: ${err}` }, { status: 502 });
        }

        // Stream the audio back
        const audioBuffer = await piperRes.arrayBuffer();
        return new Response(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': String(audioBuffer.byteLength),
            },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'TTS synthesis failed';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
