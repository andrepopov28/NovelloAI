import { useState, useCallback, useRef, useEffect } from 'react';
import { AIProvider, OutlineResult } from '@/lib/types';
import { useProjects } from './useProjects';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// =============================================
// useAI — Client hook for AI operations
// PRD V27 §8.3: 60s timeout, Gemini 429 retry,
//               provider resolution hierarchy, SSR-safe localStorage
// =============================================

const AI_TIMEOUT_MS = 60_000;
const MAX_GEMINI_RETRIES = 3;

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wraps a fetch with a 60-second AbortController timeout. */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    signal: AbortSignal
): Promise<Response> {
    const timeoutId = setTimeout(() => {
        (options.signal as AbortController | undefined);
    }, AI_TIMEOUT_MS);

    // Combine the caller's abort signal with a timeout signal
    const timeoutController = new AbortController();
    const timeoutTimer = setTimeout(() => timeoutController.abort('timeout'), AI_TIMEOUT_MS);

    // Merge signals: abort if either fires
    signal.addEventListener('abort', () => timeoutController.abort());

    try {
        const res = await fetch(url, { ...options, signal: timeoutController.signal });
        clearTimeout(timeoutTimer);
        clearTimeout(timeoutId);
        return res;
    } catch (err) {
        clearTimeout(timeoutTimer);
        clearTimeout(timeoutId);
        throw err;
    }
}

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

    // Strategy: Project Settings > Global Settings (localStorage) > Hook Arguments > Defaults
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

        // 2. Try Project Settings (Firestore) — highest priority
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

    /** Sanitize AI HTML output using DOMPurify (client-side only). */
    const sanitizeOutput = useCallback((html: string): string => {
        if (typeof window === 'undefined') return html;
        try {
            // Dynamic import to avoid SSR issues
            const DOMPurify = require('dompurify');
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['p', 'br', 'em', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'blockquote', 'span'],
                ALLOWED_ATTR: ['class'],
            });
        } catch {
            return html;
        }
    }, []);

    /**
     * Fetch with Gemini 429 retry (exponential backoff: 2s, 4s, 8s).
     * For non-Gemini providers, no retry is applied.
     */
    const fetchWithRetry = useCallback(async (
        url: string,
        options: RequestInit,
        signal: AbortSignal,
        retries = MAX_GEMINI_RETRIES
    ): Promise<Response> => {
        const res = await fetchWithTimeout(url, options, signal);

        if (res.status === 429 && config.provider === 'gemini' && retries > 0) {
            const attempt = MAX_GEMINI_RETRIES - retries + 1;
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            toast.warning(`Gemini rate limit hit. Retrying in ${delay / 1000}s... (attempt ${attempt}/${MAX_GEMINI_RETRIES})`);
            await sleep(delay);
            return fetchWithRetry(url, options, signal, retries - 1);
        }

        if (res.status === 429 && retries === 0) {
            toast.error('Gemini rate limit reached. Wait or switch to Ollama in Settings.');
        }

        return res;
    }, [config.provider]);

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
                const res = await fetchWithRetry(
                    '/api/ai/generate',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            prompt,
                            provider: config.provider,
                            model: config.model,
                            mode: 'stream',
                            action,
                            projectId,
                        }),
                    },
                    controller.signal
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    if (res.status === 401 || res.status === 403) {
                        toast.error('AI API key is invalid. Check your key in Settings.');
                    } else {
                        throw new Error(data.error || `Generation failed (${res.status})`);
                    }
                    setLoading(false);
                    return '';
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
                            } catch { /* skip malformed chunk */ }
                        }
                    }
                }

                setLoading(false);
                return sanitizeOutput(accumulated);
            } catch (err) {
                const error = err as Error;
                if (error.name === 'AbortError') {
                    if (error.message === 'timeout') {
                        toast.error('AI request timed out. The model may be loading. Try again.');
                    }
                    setLoading(false);
                    return '';
                }
                const msg = error.message || 'AI generation failed';
                if (msg.includes('context') && msg.includes('length')) {
                    toast.error('Your context is too large for this model. Try a model with a larger context window.');
                } else {
                    toast.error(`AI error: ${msg}`);
                }
                setError(msg);
                setLoading(false);
                return '';
            }
        },
        [config.provider, config.model, fetchWithRetry, sanitizeOutput, user, projectId]
    );

    // --- JSON generation (outline) ---
    const generateOutline = useCallback(
        async (premise: string, genre?: string): Promise<OutlineResult | null> => {
            setLoading(true);
            setError(null);

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const token = await user?.getIdToken();
                const res = await fetchWithRetry(
                    '/api/ai/generate',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            prompt: premise,
                            provider: config.provider,
                            model: config.model,
                            mode: 'json',
                            action: 'outline',
                            genre,
                            projectId,
                        }),
                    },
                    controller.signal
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || 'Outline generation failed');
                }

                const data = await res.json();
                const text = data.result.trim();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error('Invalid outline format — AI returned unexpected response');
                const outline: OutlineResult = JSON.parse(jsonMatch[0]);

                setLoading(false);
                return outline;
            } catch (err) {
                const error = err as Error;
                if (error.name === 'AbortError') {
                    if (error.message === 'timeout') {
                        toast.error('AI request timed out. The model may be loading. Try again.');
                    }
                    setLoading(false);
                    return null;
                }
                const msg = error.message || 'Outline generation failed';
                toast.error(`Outline error: ${msg}`);
                setError(msg);
                setLoading(false);
                return null;
            }
        },
        [config.provider, config.model, fetchWithRetry, user, projectId]
    );

    const writeChapter = useCallback(
        async (title: string, synopsis: string, context?: string, styleProfile?: unknown) => {
            setLoading(true);
            setError(null);

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const token = await user?.getIdToken();
                const res = await fetchWithRetry(
                    '/api/ai/generate',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
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
                            projectId,
                        }),
                    },
                    controller.signal
                );

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Generation failed');
                }

                return res.body;
            } catch (err) {
                const error = err as Error;
                if (error.name === 'AbortError' && error.message === 'timeout') {
                    toast.error('AI request timed out. The model may be loading. Try again.');
                }
                const msg = error.message || 'Failed to generate chapter';
                setError(msg);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [config.provider, config.model, fetchWithRetry, user, projectId]
    );

    return {
        loading,
        error,
        streamedText,
        streamGenerate,
        generateOutline,
        writeChapter,
        cancelGeneration,
        sanitizeOutput,
        clearError: () => setError(null),
        config, // Export current resolved config for UI hints
    };
}
