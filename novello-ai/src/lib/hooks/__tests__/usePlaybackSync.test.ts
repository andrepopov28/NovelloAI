import { renderHook, act } from '@testing-library/react';
import { usePlaybackSync } from '../usePlaybackSync';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from '@/lib/firebase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Naive mock of Firebase
vi.mock('@/lib/firebase', () => ({
    getFirebaseDb: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    collection: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    onSnapshot: vi.fn((q, cb) => {
        cb({ docs: [] });
        return vi.fn(); // Unsubscribe mock
    }),
    Timestamp: { now: vi.fn(() => ({ toMillis: () => Date.now() })) }
}));

describe('usePlaybackSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches initial playback state successfully', async () => {
        (getDoc as any).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ positionMs: 15000, speed: 1.5 })
        });

        const { result } = renderHook(() => usePlaybackSync('user_123', 'export_abc'));

        // Wait for async effect
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(getDoc).toHaveBeenCalled();
        expect(result.current.initialPositionMs).toBe(15000);
        expect(result.current.initialSpeed).toBe(1.5);
    });

    it('throttles syncPosition calls to prevent excessive writes', async () => {
        const { result } = renderHook(() => usePlaybackSync('user_123', 'export_abc'));

        await act(async () => {
            await result.current.syncPosition(5000, 1.0);
            await result.current.syncPosition(6000, 1.0); // Should be throttled
        });

        // setDoc should only be called once because the second call occurred < 5 seconds later
        expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('forces syncPosition if forced flag is true', async () => {
        const { result } = renderHook(() => usePlaybackSync('user_123', 'export_abc'));

        await act(async () => {
            await result.current.syncPosition(5000, 1.0);
            await result.current.syncPosition(6000, 1.0, true); // Force bypasses throttle
        });

        expect(setDoc).toHaveBeenCalledTimes(2);
    });

    it('adds and removes bookmarks successfully', async () => {
        const { result } = renderHook(() => usePlaybackSync('user_123', 'export_abc'));

        await act(async () => {
            await result.current.addBookmark(12000, 'Chapter 2 Start');
        });

        expect(setDoc).toHaveBeenCalled();

        await act(async () => {
            await result.current.removeBookmark('bookmark_id_1');
        });

        expect(deleteDoc).toHaveBeenCalled();
    });
});
