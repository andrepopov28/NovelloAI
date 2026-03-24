import { useState, useEffect, useCallback, useRef } from 'react';
import type { Bookmark } from '@/lib/types';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Local-first playback sync using localStorage
// Stores playback position, speed, and bookmarks per export.
// ─────────────────────────────────────────────────────────────────────────────

const positionKey = (userId: string, exportId: string) => `novello_pb_${userId}_${exportId}`;
const bookmarksKey = (userId: string, exportId: string) => `novello_bm_${userId}_${exportId}`;

interface PlaybackState {
    positionMs: number;
    speed: number;
    updatedAt: number;
}

function readPlaybackState(userId: string, exportId: string): PlaybackState | null {
    try {
        const raw = localStorage.getItem(positionKey(userId, exportId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function writePlaybackState(userId: string, exportId: string, state: PlaybackState): void {
    try {
        localStorage.setItem(positionKey(userId, exportId), JSON.stringify(state));
    } catch { /* ignore quota errors */ }
}

function readBookmarks(userId: string, exportId: string): Bookmark[] {
    try {
        const raw = localStorage.getItem(bookmarksKey(userId, exportId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function writeBookmarks(userId: string, exportId: string, bookmarks: Bookmark[]): void {
    try {
        localStorage.setItem(bookmarksKey(userId, exportId), JSON.stringify(bookmarks));
    } catch { /* ignore quota errors */ }
}

export function usePlaybackSync(userId: string | undefined, exportId: string | undefined) {
    const [initialPositionMs, setInitialPositionMs] = useState<number>(0);
    const [initialSpeed, setInitialSpeed] = useState<number>(1);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const lastSyncRef = useRef<number>(0);
    const isInitialisedRef = useRef<boolean>(false);

    // Initial state fetch from localStorage
    useEffect(() => {
        if (!userId || !exportId) return;
        const state = readPlaybackState(userId, exportId);
        if (state) {
            setInitialPositionMs(state.positionMs);
            setInitialSpeed(state.speed);
        }
        const saved = readBookmarks(userId, exportId);
        setBookmarks(saved.sort((a, b) => a.positionMs - b.positionMs));
        isInitialisedRef.current = true;
    }, [userId, exportId]);

    const syncPosition = useCallback((positionMs: number, speed: number, force = false) => {
        if (!userId || !exportId || !isInitialisedRef.current) return;
        const now = Date.now();
        if (!force && now - lastSyncRef.current < 5000) return;
        lastSyncRef.current = now;
        writePlaybackState(userId, exportId, { positionMs, speed, updatedAt: now });
    }, [userId, exportId]);

    const addBookmark = useCallback((positionMs: number, label: string) => {
        if (!userId || !exportId) return;
        const id = crypto.randomUUID();
        const newBookmark: Bookmark = {
            id,
            exportId,
            userId,
            positionMs,
            label,
            createdAt: Date.now(),
        };
        const updated = [...bookmarks, newBookmark].sort((a, b) => a.positionMs - b.positionMs);
        setBookmarks(updated);
        writeBookmarks(userId, exportId, updated);
        toast.success('Bookmark saved!');
    }, [userId, exportId, bookmarks]);

    const removeBookmark = useCallback((bookmarkId: string) => {
        if (!userId || !exportId) return;
        const updated = bookmarks.filter((b) => b.id !== bookmarkId);
        setBookmarks(updated);
        writeBookmarks(userId, exportId, updated);
    }, [userId, exportId, bookmarks]);

    return {
        initialPositionMs,
        initialSpeed,
        bookmarks,
        syncPosition,
        addBookmark,
        removeBookmark,
    };
}
