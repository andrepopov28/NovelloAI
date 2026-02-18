import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// GET /api/ollama/ping
// Alias for /api/ai/health — checks Ollama availability.
// PRD V27 §8.3: Provider health check endpoint.
// =============================================

export async function GET(req: Request) {
    const authHeader = req.headers.get('Authorization');
    await verifyIdToken(authHeader);

    try {
        const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const res = await fetch(`${ollamaBase}/api/tags`, {
            signal: AbortSignal.timeout(3000),
        });

        if (!res.ok) {
            return NextResponse.json({ available: false, error: 'Ollama returned non-OK status' }, { status: 200 });
        }

        const data = await res.json();
        const models = (data.models || []).map((m: { name: string }) => m.name);

        return NextResponse.json({ available: true, models });
    } catch {
        return NextResponse.json({ available: false, models: [] }, { status: 200 });
    }
}
