import { NextResponse } from 'next/server';
import { checkOllamaHealth, checkGeminiHealth } from '@/lib/ai';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// GET /api/ai/health
// Returns AI provider availability status.
// =============================================

export async function GET(req: any) {
    const authHeader = req.headers.get('Authorization');
    await verifyIdToken(authHeader);

    const [ollama, gemini] = await Promise.all([
        checkOllamaHealth(),
        checkGeminiHealth(),
    ]);

    return NextResponse.json({ ollama, gemini });
}
