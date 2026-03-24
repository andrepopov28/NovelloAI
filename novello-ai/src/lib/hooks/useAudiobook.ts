'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { piperService } from '@/lib/piper-service';
import { NEURAL_VOICES, PiperVoice } from '@/lib/voices-config';

interface PlaybackState {
    isPlaying: boolean;
    isPaused: boolean;
    currentChapterIndex: number;
    progress: number;
    speed: number;
    selectedVoiceId: string;
    isNeuralAvailable: boolean;
    isLoading: boolean;
}

export function useAudiobook() {
    const [voices] = useState<PiperVoice[]>(NEURAL_VOICES);
    const [playback, setPlayback] = useState<PlaybackState>({
        isPlaying: false,
        isPaused: false,
        currentChapterIndex: -1,
        progress: 0,
        speed: 1,
        selectedVoiceId: 'piper-lessac',
        isNeuralAvailable: false,
        isLoading: false,
    });

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const totalCharsRef = useRef(0);
    const spokenCharsRef = useRef(0);

    // Initialize Piper on mount
    useEffect(() => {
        piperService.init().then(() => {
            setPlayback((prev) => ({
                ...prev,
                isNeuralAvailable: piperService.isNeuralAvailable(),
            }));
        });
    }, []);

    const allVoices = voices;

    const stripHtml = useCallback((html: string) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }, []);

    const speak = useCallback(
        async (text: string, chapterIndex: number, customAudioUrl?: string) => {
            if (typeof window === 'undefined') return;

            // Stop anything playing
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const plainText = stripHtml(text);
            if (!plainText.trim()) return;

            totalCharsRef.current = plainText.length;
            spokenCharsRef.current = 0;

            setPlayback((prev) => ({
                ...prev,
                isPlaying: true,
                isPaused: false,
                currentChapterIndex: chapterIndex,
                progress: 0,
                isLoading: true,
            }));

            // Handle Narrator Mode Custom Audio
            if (customAudioUrl) {
                const audio = new Audio(customAudioUrl);
                audioRef.current = audio;
                audio.playbackRate = playback.speed;
                
                audio.ontimeupdate = () => {
                    const progress = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
                    setPlayback((prev) => ({ ...prev, progress, isLoading: false }));
                };

                audio.onended = () => {
                    setPlayback((prev) => ({
                        ...prev,
                        isPlaying: false,
                        isPaused: false,
                        progress: 1,
                        isLoading: false,
                    }));
                };
                
                try {
                    await audio.play();
                } catch (err: any) {
                    console.error('Custom audio playback failed', err);
                    setPlayback(prev => ({ ...prev, isPlaying: false, isLoading: false }));
                }
                return;
            }

            // Try Piper neural first
            if (piperService.isNeuralAvailable()) {
                try {
                    const audio = await piperService.speak(plainText, playback.selectedVoiceId);
                    if (audio) {
                        audioRef.current = audio;
                        audio.playbackRate = playback.speed;

                        audio.ontimeupdate = () => {
                            const progress = audio.duration > 0 ? audio.currentTime / audio.duration : 0;
                            setPlayback((prev) => ({ ...prev, progress, isLoading: false }));
                        };

                        audio.onended = () => {
                            setPlayback((prev) => ({
                                ...prev,
                                isPlaying: false,
                                isPaused: false,
                                progress: 1,
                                isLoading: false,
                            }));
                        };

                        return; // Piper is handling it
                    }
                } catch (err) {
                    console.warn('Piper playback failed, falling back to SpeechSynthesis', err);
                }
            }

            // Fallback: Browser SpeechSynthesis
            const utterance = new SpeechSynthesisUtterance(plainText);
            utterance.rate = playback.speed;

            // Try to find a good system voice matching the selected neural voice's characteristics
            const selectedNeural = allVoices.find((v) => v.id === playback.selectedVoiceId);
            const systemVoices = window.speechSynthesis.getVoices();
            const systemVoice = systemVoices.find(
                (v) =>
                    v.name.includes('Premium') ||
                    (selectedNeural?.gender === 'Female' && v.name.includes('Samantha')) ||
                    (selectedNeural?.gender === 'Male' && v.name.includes('Daniel'))
            ) || systemVoices.find((v) => v.lang.startsWith('en')) || systemVoices[0];

            if (systemVoice) utterance.voice = systemVoice;

            utterance.onboundary = (event) => {
                spokenCharsRef.current = event.charIndex;
                const progress = totalCharsRef.current > 0 ? event.charIndex / totalCharsRef.current : 0;
                setPlayback((prev) => ({ ...prev, progress, isLoading: false }));
            };

            utterance.onend = () => {
                setPlayback((prev) => ({
                    ...prev,
                    isPlaying: false,
                    isPaused: false,
                    progress: 1,
                    isLoading: false,
                }));
            };

            utterance.onerror = () => {
                setPlayback((prev) => ({
                    ...prev,
                    isPlaying: false,
                    isLoading: false,
                }));
            };

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
            setPlayback((prev) => ({ ...prev, isLoading: false }));
        },
        [playback.speed, playback.selectedVoiceId, allVoices, stripHtml]
    );

    const pause = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        } else if (typeof window !== 'undefined') {
            window.speechSynthesis.pause();
        }
        setPlayback((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
    }, []);

    const resume = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play();
        } else if (typeof window !== 'undefined') {
            window.speechSynthesis.resume();
        }
        setPlayback((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        setPlayback((prev) => ({
            ...prev,
            isPlaying: false,
            isPaused: false,
            progress: 0,
            currentChapterIndex: -1,
            isLoading: false,
        }));
    }, []);

    const setSpeed = useCallback((speed: number) => {
        setPlayback((prev) => ({ ...prev, speed }));
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, []);

    const setVoice = useCallback((voiceId: string) => {
        setPlayback((prev) => ({ ...prev, selectedVoiceId: voiceId }));
    }, []);

    return {
        voices: allVoices,
        playback,
        speak,
        pause,
        resume,
        stop,
        setSpeed,
        setVoice,
    };
}
