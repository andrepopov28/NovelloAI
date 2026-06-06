import { NextResponse } from 'next/server';
import { voiceCloneQueue } from '@/lib/queue/voiceCloneQueue';
import { verifyIdToken } from '@/lib/firebase-admin';
import crypto from 'crypto';
import type { VoiceClone } from '@/lib/types';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        const decoded = await verifyIdToken(authHeader);
        const userId = decoded.uid;

        const formData = await req.formData();
        const audioFile = formData.get('audio') as File | null;
        const displayName = formData.get('displayName') as string | null;
        const language = (formData.get('language') as string) || 'en-US';
        const gender = (formData.get('gender') as string) || 'neutral';
        const ageStyle = (formData.get('ageStyle') as string) || 'adult';

        if (!audioFile || !displayName) {
            return NextResponse.json({ error: 'Missing audio file or display name' }, { status: 400 });
        }

        const cloneId = crypto.randomUUID();
        const sampleStoragePath = `users/${userId}/voices/${cloneId}/sample.webm`;

        const randomAvatars = [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
        ];
        const randomAvatarUrl = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];

        const cloneData: Omit<VoiceClone, 'createdAt'> & { createdAt: number } = {
            id: cloneId,
            userId,
            type: 'cloned',
            source: 'upload',
            displayName,
            language,
            gender,
            ageStyle,
            avatar: {
                url: randomAvatarUrl,
                width: 400,
                height: 400,
            },
            sampleStoragePath,
            piperModelPath: null,
            status: 'training',
            createdAt: Date.now(),
        };

        // Enqueue training job (no-op in local mode)
        await voiceCloneQueue.add('clone-voice', { cloneId, userId }, { jobId: cloneId });

        return NextResponse.json({ status: 'queued', cloneId, clone: cloneData });
    } catch (error: any) {
        console.error('API Error starting voice clone:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
