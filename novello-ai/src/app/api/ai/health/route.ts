import { NextResponse } from 'next/server';
import { checkProviderHealth } from '@/lib/ai';
import { verifyIdToken } from '@/lib/firebase-admin';

// =============================================
// GET /api/ai/health
// Returns AI provider availability and active provider.
// =============================================

export async function GET(req: any) {
    const authHeader = req.headers.get('Authorization');
    await verifyIdToken(authHeader);

    const health = await checkProviderHealth();

    return NextResponse.json(health);
}
