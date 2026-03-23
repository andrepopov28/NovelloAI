import { useState, useEffect, useCallback, useRef } from 'react';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, collection, query, onSnapshot, deleteDoc } from '@/lib/firebase';
import type { Bookmark } from '@/lib/types';
import { toast } from 'sonner';

export function usePlaybackSync(userId: string | undefined, exportId: string | undefined) {
    const [initialPositionMs, setInitialPositionMs] = useState<number>(0);
    const [initialSpeed, setInitialSpeed] = useState<number>(1);
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const lastSyncRef = useRef<number>(0);
    // Guard: prevent syncPosition from overwriting the cloud-saved position
    // before the async initial-fetch has had a chance to resolve.
    const isInitialisedRef = useRef<boolean>(false);

    // Initial state fetch
    useEffect(() => {
        if (!userId || !exportId) return;
        const fetchInitial = async () => {
            const db = getFirebaseDb();
            const docRef = doc(db, `users/${userId}/playback/${exportId}`);
            try {
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.positionMs !== undefined) setInitialPositionMs(data.positionMs);
                    if (data.speed !== undefined) setInitialSpeed(data.speed);
                }
            } catch (e) {
                console.warn('Failed to fetch initial playback state', e);
            } finally {
                // Only allow syncPosition writes after this point
                isInitialisedRef.current = true;
            }
        };
        fetchInitial();
    }, [userId, exportId]);

    // Bookmarks listener
    useEffect(() => {
        if (!userId || !exportId) return;
        const db = getFirebaseDb();
        const q = query(collection(db, `users/${userId}/bookmarks/${exportId}/items`));

        const unsubscribe = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Bookmark));
            docs.sort((a, b) => a.positionMs - b.positionMs);
            setBookmarks(docs);
        }, (err) => {
            console.error('Bookmarks listener error', err);
        });

        return () => unsubscribe();
    }, [userId, exportId]);

    const syncPosition = useCallback(async (positionMs: number, speed: number, force = false) => {
        if (!userId || !exportId) return;
        // Do not sync until we have loaded the remote initial state
        if (!isInitialisedRef.current) return;

        const now = Date.now();
        if (!force && now - lastSyncRef.current < 5000) return; // Max 1 sync per 5 seconds unless forced

        lastSyncRef.current = now;
        const db = getFirebaseDb();
        const docRef = doc(db, `users/${userId}/playback/${exportId}`);

        try {
            await setDoc(docRef, {
                id: exportId,
                userId,
                positionMs,
                speed,
                updatedAt: Timestamp.now(),
                lastPlayedAt: Timestamp.now()
            }, { merge: true });
        } catch (e) {
            console.warn('Failed to sync playback state', e);
        }
    }, [userId, exportId]);

    const addBookmark = useCallback(async (positionMs: number, label: string) => {
        if (!userId || !exportId) return;
        const db = getFirebaseDb();
        const bookmarkRef = doc(collection(db, `users/${userId}/bookmarks/${exportId}/items`));
        try {
            await setDoc(bookmarkRef, {
                id: bookmarkRef.id,
                exportId,
                userId,
                positionMs,
                label,
                createdAt: Timestamp.now()
            });
            toast.success('Bookmark saved!');
        } catch (e) {
            toast.error('Failed to save bookmark.');
        }
    }, [userId, exportId]);

    const removeBookmark = useCallback(async (bookmarkId: string) => {
        if (!userId || !exportId) return;
        const db = getFirebaseDb();
        const bookmarkRef = doc(db, `users/${userId}/bookmarks/${exportId}/items/${bookmarkId}`);
        try {
            await deleteDoc(bookmarkRef);
        } catch (e) {
            toast.error('Failed to delete bookmark.');
        }
    }, [userId, exportId]);

    return {
        initialPositionMs,
        initialSpeed,
        bookmarks,
        syncPosition,
        addBookmark,
        removeBookmark
    };
}
