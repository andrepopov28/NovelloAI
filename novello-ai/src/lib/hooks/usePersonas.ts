import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { PersonaSettings } from '@/lib/types';

export const DEFAULT_PERSONAS: Record<string, Omit<PersonaSettings, 'id' | 'userId' | 'updatedAt'>> = {
  default: {
    name: 'Novello AI',
    provider: 'ollama',
    model: 'deepseek-r1:32b',
    voiceId: null,
    personality: 'You are Novello AI, a creative writing assistant. Be helpful, concise, and inspiring. Help the writer with their creative process.',
  },
  write: {
    name: 'The Novelist',
    provider: 'ollama',
    model: 'deepseek-r1:32b',
    voiceId: null,
    personality: 'You are The Novelist, an expert writing companion. Focus strictly on prose, dialogue, pacing, and narrative structure.',
  },
  brainstorm: {
    name: 'The Muse',
    provider: 'ollama',
    model: 'deepseek-r1:32b',
    voiceId: null,
    personality: 'You are The Muse, a chaotic and wildly creative brainstormer. Help spark ideas, plot twists, character concepts, and world-building.',
  },
  codex: {
    name: 'The Archivist',
    provider: 'ollama',
    model: 'deepseek-r1:32b',
    voiceId: null,
    personality: 'You are The Archivist, a meticulous lore keeper. You help track characters, locations, and lore for consistency, pointing out timeline or factual issues.',
  },
  audiobook: {
    name: 'The Narrator',
    provider: 'ollama',
    model: 'deepseek-r1:32b',
    voiceId: null,
    personality: 'You are The Narrator, an expert in voice acting and audio production. You help prepare the manuscript for narration, pacing, and emotional delivery.',
  },
  publish: {
    name: 'The Publisher',
    provider: 'ollama',
    model: 'deepseek-r1:32b',
    voiceId: null,
    personality: 'You are The Publisher, an advisor on the business of books. You guide the user on metadata, cover design, blurbs, marketing, and distribution readiness.',
  }
};

const PERSONAS_KEY = (uid: string) => `novello_personas_${uid}`;

export function usePersonas() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<PersonaSettings[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonas = useCallback(() => {
    if (!user) {
      setPersonas([]);
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(PERSONAS_KEY(user.uid));
      const dbPersonas: PersonaSettings[] = stored ? JSON.parse(stored) : [];

      // Merge with defaults guaranteed for the 6 core personas
      const merged = Object.keys(DEFAULT_PERSONAS).map(key => {
        const existing = dbPersonas.find(p => p.id === key);
        if (existing) return existing;
        return {
          id: key,
          userId: user.uid,
          ...DEFAULT_PERSONAS[key],
          updatedAt: null as unknown as number,
        } as PersonaSettings;
      });

      setPersonas(merged);
    } catch (error) {
      console.error('Error fetching persona settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const updatePersona = async (personaId: string, updates: Partial<PersonaSettings>) => {
    if (!user) return;

    const updated = personas.map(p =>
      p.id === personaId ? { ...p, ...updates, updatedAt: Date.now() } : p
    );
    setPersonas(updated);

    try {
      localStorage.setItem(PERSONAS_KEY(user.uid), JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving persona:', error);
      throw error;
    }
  };

  const getPersona = useCallback((key: string): PersonaSettings => {
    return personas.find(p => p.id === key) || {
      id: key,
      userId: user?.uid || '',
      ...DEFAULT_PERSONAS[key] || DEFAULT_PERSONAS['default'],
      updatedAt: null as unknown as number,
    };
  }, [personas, user]);

  return { personas, loading, updatePersona, getPersona, refresh: fetchPersonas };
}
