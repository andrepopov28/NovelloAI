import { db } from '@/lib/firebase-admin';
import { NEURAL_VOICES } from '../lib/voices-config';
import * as admin from '@/lib/firebase-admin';
import type { VoiceCatalog } from '../lib/types';

const AVATAR_MAP: Record<string, string> = {
    'piper-lessac': 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-libritts': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-architect': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-curator': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-overseer': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-amy': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-southern-female': 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-vctk-neutral': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-librispeech-high': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80',
    'piper-publisher': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces&q=80',
};

async function seedVoiceCatalog() {
    console.log('Seeding voice_catalog...');

    const batch = db.batch();

    for (const voice of NEURAL_VOICES) {
        const docRef = db.collection('voice_catalog').doc(voice.id);

        const voiceData: VoiceCatalog = {
            id: voice.id,
            type: 'builtin',
            provider: 'piper',
            engineVoiceId: voice.model,
            displayName: voice.name,
            language: voice.accent.includes('UK') ? 'en-GB' : 'en-US',
            accent: voice.accent,
            gender: voice.gender.toLowerCase(),
            ageStyle: 'adult',
            description: voice.description,
            commercialOk: voice.commercialOk,
            licenseName: voice.licenseName,
            licenseUrl: voice.licenseUrl,
            tags: [voice.quality.toLowerCase(), 'narration'],
            defaultSettings: {
                speed: 1.0,
                pauseMs: 1000,
            },
            avatar: {
                url: AVATAR_MAP[voice.id] || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop&crop=faces&q=80',
                width: 400,
                height: 400,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
            updatedAt: admin.firestore.FieldValue.serverTimestamp() as any,
        };

        batch.set(docRef, voiceData, { merge: true });
        console.log(`Prepared ${voice.name} (${voice.id})`);
    }

    try {
        await batch.commit();
        console.log('Successfully seeded voice_catalog!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding voice_catalog:', err);
        process.exit(1);
    }
}

seedVoiceCatalog();
