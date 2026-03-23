'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    subscribeToChapters,
    createChapter as fbCreateChapter,
    updateChapter as fbUpdateChapter,
    deleteChapter as fbDeleteChapter,
    reorderChapters as fbReorderChapters,
} from '@/lib/firestore';
import type { Chapter } from '@/lib/types';
import { toast } from 'sonner';

export function useChapters(projectId: string | null) {
    const { user } = useAuth();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!projectId || !user) {
            setChapters([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToChapters(
            projectId,
            user.uid,
            (list) => {
                setChapters(list);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching chapters:', err);
                setError(err);
                setLoading(false);
                toast.error('Failed to load chapters.');
            }
        );

        return () => unsubscribe();
    }, [projectId, user]);

    const createChapter = useCallback(
        async (data: { title: string; order: number; synopsis?: string }) => {
            if (!user || !projectId) throw new Error('Not available');
            const id = await fbCreateChapter(projectId, user.uid, data);
            toast.success('Chapter added.');
            return id;
        },
        [user, projectId]
    );

    const updateChapter = useCallback(
        async (chapterId: string, data: Partial<Chapter>) => {
            await fbUpdateChapter(chapterId, data);
        },
        []
    );

    const deleteChapter = useCallback(
        async (chapterId: string) => {
            await fbDeleteChapter(chapterId);
            toast.success('Chapter deleted.');
        },
        []
    );

    const reorderChapters = useCallback(
        async (orderedIds: string[]) => {
            if (!projectId) throw new Error('No project');
            await fbReorderChapters(projectId, orderedIds);
        },
        [projectId]
    );

    return { chapters, loading, error, createChapter, updateChapter, deleteChapter, reorderChapters };
}
