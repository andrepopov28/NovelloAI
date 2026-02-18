import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// POST /api/voice/train
// Voice cloning training via Piper TTS (local).
// PRD V27 §6.4: Voice clone training endpoint.
// Accepts audio samples and initiates training.
// =============================================

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    const { uid } = await verifyIdToken(authHeader);

    const body = await req.json();
    const { voiceName, audioSamples } = body;

    if (!voiceName || !audioSamples || !Array.isArray(audioSamples)) {
        return NextResponse.json(
            { error: 'voiceName (string) and audioSamples (array of base64 WAV strings) are required' },
            { status: 400 }
        );
    }

    const piperUrl = process.env.PIPER_TTS_URL;

    if (!piperUrl) {
        return NextResponse.json(
            {
                error: 'Piper TTS is not configured. Set PIPER_TTS_URL in your .env.local to enable voice cloning.',
                code: 'PIPER_NOT_CONFIGURED',
            },
            { status: 501 }
        );
    }

    try {
        const piperRes = await fetch(`${piperUrl}/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                voice_name: `${uid}_${voiceName}`,
                audio_samples: audioSamples,
            }),
            signal: AbortSignal.timeout(120_000), // Training can take up to 2 minutes
        });

        if (!piperRes.ok) {
            const err = await piperRes.text();
            return NextResponse.json({ error: `Piper training error: ${err}` }, { status: 502 });
        }

        const result = await piperRes.json();
        return NextResponse.json({
            success: true,
            voiceId: result.voice_id || `${uid}_${voiceName}`,
            message: 'Voice training initiated. This may take a few minutes.',
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Voice training failed';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
