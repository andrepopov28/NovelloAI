import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, Timestamp, getFirebaseDb } from '@/lib/firebase';
import type { Bookmark } from '@/lib/types';
import { toast } from 'sonner';

export function usePlaybackSync(userId: string | undefined, exportId: string | undefined) {
    const [initialPositionMs, setInitialPositionMs] = useState<number>(0);
    const [initialSpeed, setInitialSpeed] = useState<number>(1);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const lastSyncRef = useRef<number>(0);
    const isInitialisedRef = useRef<boolean>(false);

    // Initial state fetch
    useEffect(() => {
        if (!userId || !exportId) return;

        async function fetchInitialState() {
            const db = getFirebaseDb();
            const playbackRef = doc(db as any, `users/${userId}/playback/${exportId}`);
            try {
                const snap = await getDoc(playbackRef);
                if (snap.exists()) {
                    const data = snap.data() as any;
                    setInitialPositionMs(data.positionMs || 0);
                    setInitialSpeed(data.speed || 1);
                }
            } catch (e) {
                console.error('Failed to fetch playback state', e);
            }
            isInitialisedRef.current = true;
        }

        fetchInitialState();

        // Subscribe to bookmarks
        const db = getFirebaseDb();
        const bookmarksRef = doc(db as any, `users/${userId}/bookmarks/${exportId}`);
        const unsub = onSnapshot(bookmarksRef as any, (snap: any) => {
            if (snap.exists()) {
                const data = snap.data();
                const items = (data.items || []) as Bookmark[];
                setBookmarks(items.sort((a, b) => a.positionMs - b.positionMs));
            }
        });

        return () => unsub();
    }, [userId, exportId]);

    const syncPosition = useCallback(async (positionMs: number, speed: number, force = false) => {
        if (!userId || !exportId || !isInitialisedRef.current) return;
        
        const now = Date.now();
        if (!force && now - lastSyncRef.current < 5000) return;
        
        lastSyncRef.current = now;
        const db = getFirebaseDb();
        const playbackRef = doc(db as any, `users/${userId}/playback/${exportId}`);
        
        try {
            await setDoc(playbackRef, {
                positionMs,
                speed,
                updatedAt: Timestamp.now()
            }, { merge: true });
        } catch (e) {
            console.error('Failed to sync playback position', e);
        }
    }, [userId, exportId]);

    const addBookmark = useCallback(async (positionMs: number, label: string) => {
        if (!userId || !exportId) return;
        
        const db = getFirebaseDb();
        const bookmarksRef = doc(db as any, `users/${userId}/bookmarks/${exportId}`);
        const id = crypto.randomUUID();
        
        const newBookmark: Bookmark = {
            id,
            exportId,
            userId,
            positionMs,
            label,
            createdAt: Date.now()
        };

        try {
            const updated = [...bookmarks, newBookmark].sort((a, b) => a.positionMs - b.positionMs);
            await setDoc(bookmarksRef, { items: updated }, { merge: true });
            toast.success('Bookmark saved!');
        } catch (e) {
            toast.error('Failed to save bookmark.');
        }
    }, [userId, exportId, bookmarks]);

    const removeBookmark = useCallback(async (bookmarkId: string) => {
        if (!userId || !exportId) return;
        
        const db = getFirebaseDb();
        const bookmarksRef = doc(db as any, `users/${userId}/bookmarks/${exportId}`);
        const updated = bookmarks.filter((b) => b.id !== bookmarkId);

        try {
            await setDoc(bookmarksRef, { items: updated }, { merge: true });
        } catch (e) {
            toast.error('Failed to delete bookmark.');
        }
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
