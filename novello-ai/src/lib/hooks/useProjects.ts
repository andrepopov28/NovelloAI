'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    subscribeToUserProjects,
    createProject as fbCreateProject,
    updateProject as fbUpdateProject,
    deleteProject as fbDeleteProject,
} from '@/lib/firestore';
import type { Project } from '@/lib/types';
import { toast } from 'sonner';

export function useProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setProjects([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToUserProjects(
            user.uid,
            (list) => {
                setProjects(list);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error fetching projects:', err);
                setError(err);
                setLoading(false);
                toast.error('Failed to load projects. Please refresh.');
            }
        );

        return () => unsubscribe();
    }, [user]);

    const createProject = useCallback(
        async (data: { title: string; genre: string; synopsis: string }) => {
            if (!user) throw new Error('Not authenticated');
            const id = await fbCreateProject(user.uid, data);
            toast.success('Project created!');
            return id;
        },
        [user]
    );

    const updateProject = useCallback(
        async (projectId: string, data: Partial<Project>) => {
            await fbUpdateProject(projectId, data);
        },
        []
    );

    const deleteProject = useCallback(
        async (projectId: string) => {
            await fbDeleteProject(projectId);
            toast.success('Project deleted.');
        },
        []
    );

    return { projects, loading, error, createProject, updateProject, deleteProject };
}
