import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { getClone, updateClone } from '@/lib/local-db';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(
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

        const formData = await req.formData();
        const action = formData.get('action') as string;

        let avatarUrl = '';

        if (action === 'upload') {
            const imageFile = formData.get('image') as File | null;
            if (!imageFile) {
                return NextResponse.json({ error: 'No image provided for upload' }, { status: 400 });
            }

            // Save avatar locally in public/avatars/clones/
            const ext = imageFile.type === 'image/png' ? '.png' : '.jpg';
            const filename = `${voiceId}${ext}`;
            const avatarsDir = path.join(process.cwd(), 'public', 'avatars', 'clones');
            await fs.mkdir(avatarsDir, { recursive: true });
            const arrayBuffer = await imageFile.arrayBuffer();
            await fs.writeFile(path.join(avatarsDir, filename), Buffer.from(arrayBuffer));
            avatarUrl = `/avatars/clones/${filename}`;
        } else if (action === 'regenerate') {
            // Random placeholder avatars (local-mode: no external image generation)
            const randomAvatars = [
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop',
            ];
            avatarUrl = randomAvatars[Math.floor(Math.random() * randomAvatars.length)];
        } else {
            return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
        }

        await updateClone(voiceId, {
            avatar: { url: avatarUrl, width: 400, height: 400 },
            updatedAt: Date.now(),
        });

        return NextResponse.json({ success: true, avatarUrl });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
