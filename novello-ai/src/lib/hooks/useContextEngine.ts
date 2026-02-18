'use client';

import { useState, useCallback, useMemo } from 'react';
import { Chapter, Project } from '@/lib/types';
import { updateChapter, updateProject } from '@/lib/firestore';
import { useAuth } from './useAuth';
import { serverTimestamp, Timestamp } from 'firebase/firestore';

// =============================================
// useContextEngine — Rolling Context from Chapter Summaries
// =============================================

export function useContextEngine(chapters: Chapter[]) {
    const { user } = useAuth();
    const [summarizing, setSummarizing] = useState(false);

    // Build rolling context from last 3 chapters' summaries
    const rollingContext = useMemo(() => {
        const sorted = [...chapters].sort((a, b) => a.order - b.order);
        const last3 = sorted.slice(-3);
        const summaries = last3
            .map((ch) => ch.lastSummary)
            .filter(Boolean);
        if (summaries.length === 0) return '';
        return `[Rolling Story Context — Last ${summaries.length} Chapter(s)]\n${summaries.join('\n---\n')}`;
    }, [chapters]);

    // Summarize a specific chapter and save the summary
    const summarizeChapter = useCallback(
        async (chapter: Chapter, provider: string = 'ollama', model: string = '') => {
            if (!chapter.content || chapter.content.trim().length < 50) return;

            setSummarizing(true);
            try {
                // Strip HTML tags for a cleaner prompt
                const textContent = chapter.content.replace(/<[^>]+>/g, '').trim();

                const token = await user?.getIdToken();
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prompt: textContent,
                        provider,
                        model,
                        mode: 'json',
                        action: 'summarize',
                        projectId: chapter.projectId,
                    }),
                });

                if (!res.ok) throw new Error('Summarization failed');

                const data = await res.json();
                const summary = data.result?.trim() || '';

                // Save summary to Firestore
                await updateChapter(chapter.id, { lastSummary: summary });
            } catch (err) {
                console.error('[Context Engine] Summarization failed:', err);
            } finally {
                setSummarizing(false);
            }
        },
        [user]
    );

    // Sync all summaries to project.contextRollup
    const syncContextRollup = useCallback(async () => {
        if (!chapters.length) return;
        const projectId = chapters[0].projectId;

        // Collect summaries
        const summaries = chapters
            .filter((ch) => ch.lastSummary && ch.lastSummary.length > 0)
            .sort((a, b) => a.order - b.order)
            .map((ch) => ({
                chapterId: ch.id,
                order: ch.order,
                title: ch.title,
                summary: ch.lastSummary,
            }));

        if (summaries.length === 0) return;

        try {
            await updateProject(projectId, {
                contextRollup: {
                    chapterSummaries: summaries,
                    lastUpdated: serverTimestamp() as any as Timestamp,
                },
            });
        } catch (err) {
            console.error('[Context Engine] Failed to sync rollup:', err);
        }
    }, [chapters]);

    // Summarize all chapters that lack summaries
    const summarizeAll = useCallback(
        async (provider: string = 'ollama', model: string = '') => {
            const needsSummary = chapters.filter(
                (ch) => ch.content && ch.content.trim().length >= 50 && !ch.lastSummary
            );
            for (const ch of needsSummary) {
                await summarizeChapter(ch, provider, model);
            }
        },
        [chapters, summarizeChapter]
    );

    return {
        rollingContext,
        summarizing,
        summarizeChapter,
        syncContextRollup,
        summarizeAll,
        hasSummaries: chapters.some((ch) => ch.lastSummary),
    };
}
