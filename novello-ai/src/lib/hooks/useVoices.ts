import { useState, useEffect } from 'react';
import type { VoiceCatalog, VoiceClone } from '@/lib/types';

export type UnifiedVoice = (VoiceCatalog | VoiceClone) & { isBuiltin: boolean };

const BUILTIN_VOICES_KEY = 'novello_builtin_voices';
const USER_VOICES_KEY = (uid: string) => `novello_cloned_voices_${uid}`;

export function useVoices(userId: string | undefined) {
  const [builtinVoices, setBuiltinVoices] = useState<VoiceCatalog[]>([]);
  const [clonedVoices, setClonedVoices] = useState<VoiceClone[]>([]);
  const [loading, setLoading] = useState(true);

  // Load builtin voices from local API or localStorage cache
  useEffect(() => {
    const fetchBuiltin = async () => {
      try {
        // Try local cache first
        const cached = localStorage.getItem(BUILTIN_VOICES_KEY);
        if (cached) {
          setBuiltinVoices(JSON.parse(cached));
          return;
        }
        // Fallback: empty list (no Firebase, voices come from TTS service)
        setBuiltinVoices([]);
      } catch (err) {
        console.error('Error loading builtin voices:', err);
        setBuiltinVoices([]);
      }
    };
    fetchBuiltin();
  }, []);

  // Load user cloned voices from localStorage
  useEffect(() => {
    if (!userId) {
      setClonedVoices([]);
      setLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(USER_VOICES_KEY(userId));
      const voices: VoiceClone[] = stored ? JSON.parse(stored) : [];
      setClonedVoices(voices.filter(v => v.status !== 'deleted'));
    } catch (err) {
      console.error('Error loading cloned voices:', err);
      setClonedVoices([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const allVoices: UnifiedVoice[] = [
    ...builtinVoices.map(v => ({ ...v, isBuiltin: true })),
    ...clonedVoices.map(v => ({ ...v, isBuiltin: false })),
  ];

  return { builtinVoices, clonedVoices, allVoices, loading };
}
