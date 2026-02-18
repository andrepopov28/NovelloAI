'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    subscribeToUserSeries,
    createSeries as fbCreateSeries,
    updateSeries as fbUpdateSeries,
    deleteSeries as fbDeleteSeries,
    addProjectToSeries as fbAddProjectToSeries,
    removeProjectFromSeries as fbRemoveProjectFromSeries,
} from '@/lib/firestore';
import type { Series } from '@/lib/types';
import { toast } from 'sonner';

export function useSeries() {
    const { user } = useAuth();
    const [series, setSeries] = useState<Series[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setSeries([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToUserSeries(
            user.uid,
            (list) => {
                setSeries(list);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching series:', err);
                setError(err);
                setLoading(false);
                toast.error('Failed to load series. Please refresh.');
            }
        );

        return () => unsubscribe();
    }, [user]);

    const createSeries = useCallback(
        async (data: { title: string; description: string }) => {
            if (!user) throw new Error('Not authenticated');
            const id = await fbCreateSeries(user.uid, data);
            toast.success('Series created!');
            return id;
        },
        [user]
    );

    const updateSeries = useCallback(
        async (seriesId: string, data: Partial<Series>) => {
            await fbUpdateSeries(seriesId, data);
        },
        []
    );

    const deleteSeries = useCallback(
        async (seriesId: string) => {
            await fbDeleteSeries(seriesId);
            toast.success('Series deleted.');
        },
        []
    );

    const addProjectToSeries = useCallback(
        async (seriesId: string, projectId: string) => {
            await fbAddProjectToSeries(seriesId, projectId);
            toast.success('Project added to series.');
        },
        []
    );

    const removeProjectFromSeries = useCallback(
        async (seriesId: string, projectId: string) => {
            await fbRemoveProjectFromSeries(seriesId, projectId);
            toast.success('Project removed from series.');
        },
        []
    );

    return {
        series,
        loading,
        error,
        createSeries,
        updateSeries,
        deleteSeries,
        addProjectToSeries,
        removeProjectFromSeries
    };
}
