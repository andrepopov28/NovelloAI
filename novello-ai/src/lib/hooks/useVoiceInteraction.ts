'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { piperService } from '@/lib/piper-service';

/**
 * Voice interaction hook providing:
 * - Speech-to-Text (STT) via Web Speech API (SpeechRecognition)
 * - Text-to-Speech (TTS) via Piper service (with browser fallback)
 */

interface VoiceState {
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    interimTranscript: string;
    isSupported: boolean;
    error: string | null;
}

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

export function useVoiceInteraction() {
    const [state, setState] = useState<VoiceState>({
        isListening: false,
        isSpeaking: false,
        transcript: '',
        interimTranscript: '',
        isSupported: false,
        error: null,
    });

    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Check browser support
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setState((prev) => ({ ...prev, isSupported: !!SpeechRecognition }));
    }, []);

    /**
     * Start listening for voice input via the Web Speech API.
     * Returns a promise that resolves with the final transcript.
     */
    const startListening = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            const SpeechRecognition =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                const err = 'Speech recognition not supported in this browser.';
                setState((prev) => ({ ...prev, error: err }));
                reject(new Error(err));
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            recognitionRef.current = recognition;

            let finalTranscript = '';

            recognition.onstart = () => {
                setState((prev) => ({
                    ...prev,
                    isListening: true,
                    transcript: '',
                    interimTranscript: '',
                    error: null,
                }));
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interim += result[0].transcript;
                    }
                }
                setState((prev) => ({
                    ...prev,
                    transcript: finalTranscript,
                    interimTranscript: interim,
                }));
            };

            recognition.onend = () => {
                setState((prev) => ({
                    ...prev,
                    isListening: false,
                    interimTranscript: '',
                }));
                resolve(finalTranscript.trim());
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                const errMsg = `Speech recognition error: ${event.error}`;
                setState((prev) => ({
                    ...prev,
                    isListening: false,
                    error: errMsg,
                }));
                reject(new Error(errMsg));
            };

            recognition.start();
        });
    }, []);

    /**
     * Stop listening for voice input.
     */
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setState((prev) => ({ ...prev, isListening: false }));
    }, []);

    /**
     * Speak text aloud using Piper TTS (or browser SpeechSynthesis fallback).
     */
    const speakText = useCallback(async (text: string, voiceId?: string) => {
        if (!text.trim()) return;

        setState((prev) => ({ ...prev, isSpeaking: true }));

        try {
            // Try Piper neural TTS first
            await piperService.init();
            if (piperService.isNeuralAvailable()) {
                const audio = await piperService.speak(text, voiceId || 'piper-lessac');
                if (audio) {
                    audioRef.current = audio;
                    audio.onended = () => {
                        setState((prev) => ({ ...prev, isSpeaking: false }));
                    };
                    return;
                }
            }

            // Fallback to browser SpeechSynthesis
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.0;

            // Try to find a good English voice
            const voices = window.speechSynthesis.getVoices();
            const premiumVoice = voices.find(
                (v) =>
                    v.name.includes('Premium') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Google')
            ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

            if (premiumVoice) utterance.voice = premiumVoice;

            utterance.onend = () => {
                setState((prev) => ({ ...prev, isSpeaking: false }));
            };
            utterance.onerror = () => {
                setState((prev) => ({ ...prev, isSpeaking: false }));
            };

            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.error('TTS error:', err);
            setState((prev) => ({ ...prev, isSpeaking: false }));
        }
    }, []);

    /**
     * Stop any ongoing speech output.
     */
    const stopSpeaking = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        setState((prev) => ({ ...prev, isSpeaking: false }));
    }, []);

    return {
        ...state,
        startListening,
        stopListening,
        speakText,
        stopSpeaking,
    };
}
