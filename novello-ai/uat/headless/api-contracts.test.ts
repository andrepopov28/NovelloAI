import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Firebase Admin verifyIdToken to bypass auth logic during contract tests
vi.mock('@/lib/firebase-admin', async () => {
    return {
        verifyIdToken: vi.fn().mockResolvedValue({ uid: 'uat-user-1' }),
        db: {
            collection: vi.fn().mockReturnThis(),
            doc: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ userId: 'uat-user-1', chapterCount: 2 }) }),
            set: vi.fn().mockResolvedValue(true),
            update: vi.fn().mockResolvedValue(true),
        }
    };
});

vi.mock('@/lib/queue/audiobookQueue', async () => ({
    audiobookQueue: {
        add: vi.fn().mockResolvedValue({ id: 'mock-job-1' }),
        getJob: vi.fn().mockResolvedValue({
            getState: vi.fn().mockResolvedValue('completed')
        })
    }
}));

vi.mock('@/lib/types', async () => ({}));

// Import the route handlers directly
import { POST as AudioBookPOST } from '../../src/app/api/ai/audiobook/route';
import { POST as AudioBookCancelPOST } from '../../src/app/api/ai/audiobook/cancel/route';
import { POST as VoicePreviewPOST } from '../../src/app/api/ai/voices/preview/route';

function createRequest(body: any) {
    return new NextRequest('http://localhost:3000/api/mock', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

describe('API Contract Validations (Strict Zod Schemas)', () => {

    describe('POST /api/ai/audiobook', () => {
        it('should accept valid payload', async () => {
            const req = createRequest({
                projectId: 'prod-123',
                settings: {
                    voiceId: 'voice-1',
                    speed: 1.5
                }
            });
            const res = await AudioBookPOST(req);
            // Even if queue fails internally in mock, we just want to ensure it didn't return 400 Bad Request
            expect(res.status).not.toBe(400);
        });

        it('should reject missing required fields', async () => {
            const req = createRequest({
                settings: { voiceId: 'voice-1' } // Missing projectId
            });
            const res = await AudioBookPOST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Invalid request payload');
        });

        it('should reject unknown keys (strict)', async () => {
            const req = createRequest({
                projectId: 'prod-123',
                settings: {
                    voiceId: 'voice-1'
                },
                maliciousKey: 'drop_tables' // Unknown key
            });
            const res = await AudioBookPOST(req);
            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.error).toBe('Invalid request payload');
        });
    });

    describe('POST /api/ai/audiobook/cancel', () => {
        it('should accept valid payload', async () => {
            const req = createRequest({ exportId: 'export-123' });
            const res = await AudioBookCancelPOST(req);
            expect(res.status).not.toBe(400);
        });

        it('should reject unknown keys (strict)', async () => {
            const req = createRequest({
                exportId: 'export-123',
                hackThePlanet: true
            });
            const res = await AudioBookCancelPOST(req);
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/ai/voices/preview', () => {
        it('should accept valid payload', async () => {
            const req = createRequest({
                text: 'Hello world',
                engineVoiceId: 'en_US-lessac-high'
            });
            const res = await VoicePreviewPOST(req);
            // It might fail 500 locally because of missing Piper/Storage mocks, but it shouldn't 400
            expect(res.status).not.toBe(400);
        });

        it('should reject unknown keys (strict)', async () => {
            const req = createRequest({
                text: 'Hello world',
                engineVoiceId: 'en_US-lessac-high',
                extra: 'field'
            });
            const res = await VoicePreviewPOST(req);
            expect(res.status).toBe(400);
        });
    });
});
