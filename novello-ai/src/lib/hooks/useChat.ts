'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export function useChat(projectId?: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(
        async (content: string, context?: { projectTitle?: string; chapterContent?: string }) => {
            if (!content.trim() || isStreaming) return;

            const userMsg: ChatMessage = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: content.trim(),
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMsg]);
            setIsStreaming(true);
            setError(null);

            const assistantId = `assistant-${Date.now()}`;
            const assistantMsg: ChatMessage = {
                id: assistantId,
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMsg]);

            const controller = new AbortController();
            abortRef.current = controller;

            try {
                // Build system context
                let systemPrompt =
                    'You are Novello AI, a creative writing assistant. Be helpful, concise, and inspiring. Help the writer with their creative process.';
                if (context?.projectTitle) {
                    systemPrompt += `\n\nThe writer is currently working on a project titled "${context.projectTitle}".`;
                }
                if (context?.chapterContent) {
                    systemPrompt += `\n\nHere is some of their recent writing for context:\n${context.chapterContent.slice(0, 2000)}`;
                }

                // Resolve AI provider from user settings (default to ollama for local-first dev)
                let aiProvider = 'ollama';
                if (typeof window !== 'undefined') {
                    const saved = localStorage.getItem('novello-settings');
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            aiProvider = parsed.provider || aiProvider;
                        } catch { /* ignore */ }
                    }
                }

                const token = await user?.getIdToken();
                const res = await fetch('/api/ai/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prompt: `${systemPrompt}\n\nUser: ${content.trim()}`,
                        provider: aiProvider,
                        mode: 'stream',
                        projectId, // 🆕 Pass projectId for LoomEngine
                    }),
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'AI response failed');
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
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantId ? { ...m, content: accumulated } : m
                                    )
                                );
                            } catch {
                                // skip invalid
                            }
                        }
                    }
                }
            } catch (err) {
                if ((err as Error).name === 'AbortError') {
                    // cancelled
                } else {
                    const msg = err instanceof Error ? err.message : 'Chat failed';
                    setError(msg);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId
                                ? { ...m, content: 'Sorry, I encountered an error. Please try again.' }
                                : m
                        )
                    );
                }
            } finally {
                setIsStreaming(false);
                abortRef.current = null;
            }
        },
        [isStreaming, user, projectId]
    );

    const cancelStream = useCallback(() => {
        abortRef.current?.abort();
        setIsStreaming(false);
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isStreaming,
        error,
        sendMessage,
        cancelStream,
        clearMessages,
    };
}
