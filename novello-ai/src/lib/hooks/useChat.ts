'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getProject, getChapters, getEntities } from '@/lib/local-db';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatConfig {
  projectId?: string;
  personaId?: string;
  systemPrompt?: string;
  provider?: string;
  model?: string;
}

const CHAT_HISTORY_KEY = (projectId: string) =>
  `novello_chat_${projectId}_unified`;

export function useChat(config: ChatConfig = {}) {
  const { projectId, personaId, systemPrompt: customPrompt, provider, model } = config;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (!projectId) return;
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY(projectId));
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch { /* ignore parse errors */ }
  }, [projectId]);

  // Persist messages to localStorage whenever they update
  useEffect(() => {
    if (!projectId || messages.length === 0) return;
    try {
      // Keep last 50 messages to avoid storage bloat
      const toStore = messages.slice(-50);
      localStorage.setItem(CHAT_HISTORY_KEY(projectId), JSON.stringify(toStore));
    } catch { /* ignore storage errors */ }
  }, [messages, projectId]);

  const sendMessage = useCallback(
    async (content: string, context?: { projectTitle?: string; chapterContent?: string; overrideSystemPrompt?: string }) => {
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
        let systemPrompt = context?.overrideSystemPrompt || customPrompt ||
          'You are Novello AI, a creative writing assistant. Be helpful, concise, and inspiring. Help the writer with their creative process.';
        if (context?.projectTitle) {
          systemPrompt += `\n\nThe writer is currently working on a project titled "${context.projectTitle}".`;
        }
        if (context?.chapterContent) {
          systemPrompt += `\n\nHere is some of their recent writing for context:\n${context.chapterContent.slice(0, 2000)}`;
        }

        let aiProvider = provider || 'ollama';
        if (!provider && typeof window !== 'undefined') {
          const saved = localStorage.getItem('novello-settings');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              aiProvider = parsed.provider || aiProvider;
            } catch { /* ignore */ }
          }
        }

        let projectData, chaptersData, entitiesData;
        if (projectId) {
          projectData = await getProject(projectId);
          chaptersData = await getChapters(projectId);
          entitiesData = await getEntities(projectId);
        }

        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.uid ?? 'local'}`,
          },
          body: JSON.stringify({
            prompt: `${systemPrompt}\n\nUser: ${content.trim()}`,
            provider: aiProvider,
            model,
            mode: 'stream',
            projectId,
            projectData,
            chaptersData,
            entitiesData,
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
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.substring(2));
                accumulated += text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m
                  )
                );
              } catch { /* skip invalid */ }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // cancelled by user
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
    [isStreaming, user, projectId, personaId, customPrompt, provider, model]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    if (projectId) {
      localStorage.removeItem(CHAT_HISTORY_KEY(projectId));
    }
  }, [projectId]);

  return { messages, isStreaming, error, sendMessage, cancelStream, clearMessages };
}
