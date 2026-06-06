import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { getClone, updateClone, deleteClone } from '@/lib/local-db';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const resolvedParams = await params;
        const voiceId = resolvedParams.id;

        const clone = await getClone(voiceId);
        if (!clone) {
            return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
        }

        const body = await req.json();
        await updateClone(voiceId, { ...body, updatedAt: Date.now() });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get('Authorization');
        await verifyIdToken(authHeader);

        const resolvedParams = await params;
        const voiceId = resolvedParams.id;

        const clone = await getClone(voiceId);
        if (!clone) {
            return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
        }

        await deleteClone(voiceId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
