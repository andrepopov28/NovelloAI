import { NextResponse } from 'next/server';
import { verifyIdToken, db } from '@/lib/firebase-admin';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFilePromise = promisify(execFile);

// Strict whitelist: only allow safe onnx model filenames (no path traversal)
const SAFE_VOICE_ID = /^[a-zA-Z0-9_\-]+\.onnx$/;

// =============================================
// POST /api/voice/tts
// Text-to-Speech synthesis via Piper TTS (local).
// FIXED: command injection → execFile + whitelist
// =============================================

export async function POST(req: Request) {
    const authHeader = req.headers.get('Authorization');
    await verifyIdToken(authHeader);

    const body = await req.json();
    const { text, voiceId, speed = 1.0 } = body;

    if (!text || typeof text !== 'string') {
        return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    if (text.length > 10_000) {
        return NextResponse.json({ error: 'text too long (max 10,000 chars)' }, { status: 400 });
    }

    try {
        let engineVoiceId = voiceId as string;
        const builtinVoice = await db.collection('voice_catalog').doc(voiceId).get();
        if (builtinVoice.exists) {
            engineVoiceId = builtinVoice.data()?.engineVoiceId || voiceId;
        }

        // ── Whitelist: refuse anything that's not a safe onnx filename ────────
        if (!SAFE_VOICE_ID.test(engineVoiceId)) {
            return NextResponse.json({ error: 'Invalid voiceId' }, { status: 400 });
        }

        const piperBin = path.join(process.cwd(), 'bin', 'piper', 'piper');
        const modelPath = path.join(process.cwd(), 'voices', engineVoiceId);

        // generate to temp file — no shell, no redirection
        const tmpId = `${Date.now()}${Math.random().toString(36).substring(7)}`;
        const wavPath = path.join(process.cwd(), 'tmp', `tts_${tmpId}.wav`);

        // Use execFile (no shell) — stdin via pipe, not shell redirection
        await execFilePromise(piperBin, ['--model', modelPath, '--output_file', wavPath], {
            input: text,
            timeout: 30_000,
        } as any);

        const audioBuffer = await fs.readFile(wavPath);

        // cleanup async
        fs.unlink(wavPath).catch(() => { });

        return new Response(audioBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': String(audioBuffer.byteLength),
            },
        });
    } catch (err) {
        console.error('TTS API Error');
        return NextResponse.json({ error: 'TTS synthesis failed' }, { status: 500 });
    }
}
