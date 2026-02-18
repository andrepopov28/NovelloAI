'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { updateChapter, recalculateProjectWordCount, recalculateProjectStyle, saveVersion } from '@/lib/firestore';
import { saveChapterOffline, isOnline, setupAutoSync, syncOfflineChanges } from '@/lib/offline-storage';
import type { SyncStatus } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';

const MAX_RETRIES = 3;
const SAVE_DELAY = 2000;

export function useAutoSave(
    chapterId: string | null,
    projectId: string | null,
    content: string,
) {
    const { user } = useAuth();
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const retryCount = useRef(0);
    const contentRef = useRef(content);
    const lastVersionTime = useRef<number>(Date.now());

    // Keep ref in sync
    contentRef.current = content;

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            toast.success('Connection restored. Syncing offline changes...');
        };
        const handleOffline = () => {
            setIsOffline(true);
            toast.warning('You are offline. Changes will be saved locally.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        setIsOffline(!isOnline());

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Setup auto-sync when connection restores
    useEffect(() => {
        const cleanup = setupAutoSync((result) => {
            if (result.success > 0) {
                toast.success(`Synced ${result.success} offline change(s)`);
            }
            if (result.failed > 0) {
                toast.error(`Failed to sync ${result.failed} change(s)`);
            }
        });

        return cleanup;
    }, []);

    const save = useCallback(async () => {
        if (!chapterId || !projectId) return;

        setSyncStatus('saving');

        try {
            // Calculate word count for offline storage
            const wordCount = contentRef.current
                ? contentRef.current.replace(/<[^>]*>/g, '').trim().split(/\s+/).length
                : 0;

            // Try to save to Firestore first
            if (isOnline()) {
                await updateChapter(chapterId, { content: contentRef.current });
                await recalculateProjectWordCount(projectId);
                await recalculateProjectStyle(projectId);

                // Check version threshold: 60 seconds (PRD US-004-01)
                const now = Date.now();
                if (user && now - lastVersionTime.current > 60 * 1000) {
                    await saveVersion(chapterId, user.uid, contentRef.current, 'autosave');
                    lastVersionTime.current = now;
                }

                setSyncStatus('saved');
                setLastSaved(new Date());
                retryCount.current = 0;
            } else {
                // Offline: save to IndexedDB
                await saveChapterOffline(
                    chapterId,
                    projectId,
                    contentRef.current,
                    { content: contentRef.current }, // contentJSON
                    wordCount
                );

                setSyncStatus('offline');
                setLastSaved(new Date());
                retryCount.current = 0;
            }
        } catch (err) {
            console.error('Auto-save failed:', err);
            retryCount.current += 1;

            // If Firestore fails, try IndexedDB as fallback
            if (retryCount.current === 1) {
                try {
                    const wordCount = contentRef.current
                        ? contentRef.current.replace(/<[^>]*>/g, '').trim().split(/\s+/).length
                        : 0;

                    await saveChapterOffline(
                        chapterId,
                        projectId,
                        contentRef.current,
                        { content: contentRef.current },
                        wordCount
                    );

                    setSyncStatus('offline');
                    setLastSaved(new Date());
                    toast.info('Saved locally. Will sync when online.');
                    retryCount.current = 0;
                    return;
                } catch (offlineErr) {
                    console.error('Offline save also failed:', offlineErr);
                }
            }

            if (retryCount.current < MAX_RETRIES) {
                // Retry after a short delay
                setTimeout(save, 1000 * retryCount.current);
            } else {
                setSyncStatus('error');
                retryCount.current = 0;
                toast.error('Failed to save changes. Please check your connection.');
            }
        }
    }, [chapterId, projectId, user]);

    useEffect(() => {
        if (!chapterId || !content) return;

        setSyncStatus('idle');
        const timeoutId = setTimeout(save, SAVE_DELAY);
        return () => clearTimeout(timeoutId);
    }, [chapterId, content, save]);

    return { syncStatus, lastSaved, isOffline };
}

