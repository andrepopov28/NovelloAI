'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    subscribeToEntities,
    createEntity as fbCreateEntity,
    updateEntity as fbUpdateEntity,
    deleteEntity as fbDeleteEntity,
} from '@/lib/firestore';
import type { Entity } from '@/lib/types';
import { toast } from 'sonner';

export function useEntities(projectId: string | null) {
    const { user } = useAuth();
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!projectId || !user) {
            setEntities([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToEntities(
            projectId,
            user.uid,
            (list) => {
                setEntities(list);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching entities:', err);
                setError(err);
                setLoading(false);
                toast.error('Failed to load entities.');
            }
        );

        return () => unsubscribe();
    }, [projectId, user]);

    const createEntity = useCallback(
        async (data: { name: string; type: Entity['type']; description: string }) => {
            if (!user || !projectId) throw new Error('Not available');
            const id = await fbCreateEntity(projectId, user.uid, data);
            toast.success(`${data.type} "${data.name}" created.`);
            return id;
        },
        [user, projectId]
    );

    const updateEntity = useCallback(
        async (entityId: string, data: Partial<Entity>) => {
            await fbUpdateEntity(entityId, data);
        },
        []
    );

    const deleteEntity = useCallback(
        async (entityId: string) => {
            await fbDeleteEntity(entityId);
            toast.success('Entity deleted.');
        },
        []
    );

    return { entities, loading, error, createEntity, updateEntity, deleteEntity };
}
