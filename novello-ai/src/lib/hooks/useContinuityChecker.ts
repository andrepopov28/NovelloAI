import { useState, useCallback } from 'react';
import { useChapters } from './useChapters';
import { useEntities } from './useEntities';
import { useAuth } from './useAuth';
import { ContinuityAlert, Chapter } from '../types';


export function useContinuityChecker(projectId: string) {
    const { chapters } = useChapters(projectId);
    const { entities } = useEntities(projectId);
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<ContinuityAlert[]>([]);
    const [checking, setChecking] = useState(false);

    const checkContinuity = useCallback(async (chapterContent: string, currentChapterId: string) => {
        if (!user) return;

        setChecking(true);
        try {
            // Build context from previous chapters
            // Find current chapter order
            const currentChapter = chapters.find(ch => ch.id === currentChapterId);
            const currentOrder = currentChapter ? currentChapter.order : 0;

            const previousChapters = chapters
                .filter(c => c.order < currentOrder)
                .sort((a, b) => a.order - b.order);

            const contextText = previousChapters.map(c => `Chapter: ${c.title}\nSynopsis: ${c.synopsis || c.lastSummary || 'No summary available.'}`).join('\n\n');

            const entitiesText = entities.map(e => `Name: ${e.name} (${e.type})\nDescription: ${e.description}\nAppearance: ${e.appearance}`).join('\n\n');

            const res = await fetch('/api/ai/continuity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapterContent,
                    entities: entitiesText,
                    previousContext: contextText || 'Start of story.',
                })
            });

            if (!res.ok) throw new Error('Failed to check continuity');

            const data = await res.json();

            if (data.alerts && Array.isArray(data.alerts)) {
                const newAlerts: ContinuityAlert[] = data.alerts.map((a: any) => ({
                    id: crypto.randomUUID(),
                    projectId,
                    userId: user.uid,
                    chapterId: currentChapterId,
                    entityId: null, // AI doesn't return ID, logic could be improved to match by name
                    type: a.type || 'contradiction',
                    severity: a.severity || 'warning',
                    message: a.message,
                    sourceChapterId: currentChapterId, // The alert is ABOUT this chapter
                    sourceExcerpt: '', // Could be filled if we knew previous source
                    flaggedExcerpt: a.quote || '',
                    status: 'open',
                  createdAt: Date.now(),
                }));
                setAlerts(newAlerts);
            } else {
                setAlerts([]);
            }
        } catch (error) {
            console.error('Continuity check failed:', error);
            // toast.error('Check failed'); // Optional
        } finally {
            setChecking(false);
        }
    }, [chapters, entities, projectId, user]);

    const dismissAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, []);

    return { checkContinuity, alerts, checking, dismissAlert };
}
