import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import crypto from 'crypto';
import { z } from 'zod';

const execFilePromise = promisify(execFile);

// Strict whitelist: only allow safe onnx model filenames (no path traversal)
const SAFE_VOICE_ID = /^[a-zA-Z0-9_\-]+\.onnx$/;

const PreviewRequestSchema = z.object({
    text: z.string().max(10_000),
    engineVoiceId: z.string(),
}).strict();

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        let body;
        try {
            const rawBody = await req.json();
            body = PreviewRequestSchema.parse(rawBody);
        } catch (e: unknown) {
            const error = e as { errors?: unknown; message?: string };
            return NextResponse.json({ error: 'Invalid request payload', details: error.errors ?? error.message }, { status: 400 });
        }

        const { text, engineVoiceId } = body;

        // ── Whitelist: refuse anything that's not a safe onnx filename ──────
        if (!SAFE_VOICE_ID.test(engineVoiceId)) {
            return NextResponse.json({ error: 'Invalid voiceId' }, { status: 400 });
        }

        const tmpDir = os.tmpdir();
        const hash = crypto.createHash('md5').update(`${text}_${engineVoiceId}`).digest('hex');
        const outWav = path.join(tmpDir, `piper_preview_${hash}.wav`);

        const piperBin = path.join(process.cwd(), 'bin', 'piper', 'piper');
        const modelPath = path.join(process.cwd(), 'voices', engineVoiceId);

        try {
            // Use execFile (no shell) — stdin via pipe, no shell injection possible
            await execFilePromise(piperBin, ['--model', modelPath, '--output_file', outWav], {
                input: text,
                timeout: 30_000,
            } as any);

            const audioBuffer = await fs.readFile(outWav);
            fs.unlink(outWav).catch(() => { });

            return new Response(audioBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'audio/wav',
                    'Content-Length': String(audioBuffer.byteLength),
                },
            });
        } catch (piperErr: unknown) {
            console.error('Piper preview error:', piperErr);
            throw new Error('TTS Generation failed.');
        }
    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message ?? 'Internal Server Error' }, { status: 500 });
    }
}
