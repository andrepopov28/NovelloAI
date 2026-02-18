import { useState, useCallback, useRef, useEffect } from 'react';
import { AIProvider, OutlineResult } from '@/lib/types';
import { useProjects } from './useProjects';
import { useAuth } from './useAuth';

// =============================================
// useAI — Client hook for AI operations
// =============================================

export function useAI(initialProvider: AIProvider = 'ollama', initialModel: string = '', projectId?: string) {
    const { projects } = useProjects();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamedText, setStreamedText] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    // Resolved settings
    const [config, setConfig] = useState({
        provider: initialProvider,
        model: initialModel,
    });

    // Strategy: Project Settings > Global Settings > Hook Arguments > Defaults
    useEffect(() => {
        let provider = initialProvider;
        let model = initialModel;

        // 1. Try Global Settings (localStorage) — SSR guard
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('novello-settings');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    provider = parsed.provider || provider;
                    model = (parsed.provider === 'ollama' ? parsed.ollamaModel : parsed.geminiModel) || model;
                } catch { /* ignore */ }
            }
        }

        // 2. Try Project Settings (Firestore)
        if (projectId) {
            const project = projects.find((p) => p.id === projectId);
            if (project?.settings) {
                provider = project.settings.aiProvider || provider;
                model = project.settings.modelName || model;
            }
        }

        setConfig({ provider, model });
    }, [projectId, projects, initialProvider, initialModel]);

    const cancelGeneration = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setLoading(false);
    }, []);

    // --- Streaming generation (rewrite / expand / freeform) ---
    const streamGenerate = useCallback(
        async (prompt: string, action?: 'rewrite' | 'expand') => {
            setLoading(true);
            setError(null);
            setStreamedText('');

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const token = await user?.getIdToken();
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prompt,
                        provider: config.provider,
                        model: config.model,
                        mode: 'stream',
                        action,
                        projectId, // 🆕 Pass projectId for LoomEngine
                    }),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Generation failed');
                }

                const reader = res.body?.getReader();
                if (!reader) throw new Error('No response stream');

                const decoder = new TextDecoder();
                let accumulated = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('0:')) {
                            try {
                                const text = JSON.parse(line.slice(2));
                                accumulated += text;
                                setStreamedText(accumulated);
                            } catch { /* skip */ }
                        }
                    }
                }

                setLoading(false);
                return accumulated;
            } catch (err) {
                if ((err as Error).name === 'AbortError') {
                    setLoading(false);
                    return '';
                }
                const msg = err instanceof Error ? err.message : 'AI generation failed';
                setError(msg);
                setLoading(false);
                return '';
            }
        },
        [config.provider, config.model]
    );

    // --- JSON generation (outline) ---
    const generateOutline = useCallback(
        async (premise: string, genre?: string): Promise<OutlineResult | null> => {
            setLoading(true);
            setError(null);

            try {
                const token = await user?.getIdToken();
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prompt: premise,
                        provider: config.provider,
                        model: config.model,
                        mode: 'json',
                        action: 'outline',
                        genre,
                        projectId, // 🆕 Pass projectId
                    }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Outline generation failed');
                }

                const data = await res.json();
                const text = data.result.trim();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error('Invalid outline format');
                const outline: OutlineResult = JSON.parse(jsonMatch[0]);

                setLoading(false);
                return outline;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Outline generation failed';
                setError(msg);
                setLoading(false);
                return null;
            }
        },
        [config.provider, config.model]
    );

    const writeChapter = useCallback(
        async (title: string, synopsis: string, context?: string, styleProfile?: any) => {
            setLoading(true);
            setError(null);

            try {
                const token = await user?.getIdToken();
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title,
                        synopsis,
                        context,
                        provider: config.provider,
                        model: config.model,
                        mode: 'stream',
                        action: 'write_chapter',
                        styleProfile,
                        projectId, // 🆕 Pass projectId
                    }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Generation failed');
                }

                return res.body;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to generate chapter';
                setError(msg);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [config.provider, config.model]
    );

    return {
        loading,
        error,
        streamedText,
        streamGenerate,
        generateOutline,
        writeChapter,
        cancelGeneration,
        clearError: () => setError(null),
        config, // Export current resolved config for UI hints
    };
}
