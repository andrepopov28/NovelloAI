/**
 * Novello TTS Service
 * 
 * Provides Text-to-Speech using the browser's SpeechSynthesis API
 * with premium voice matching based on the neural voice library.
 * Each voice in the library maps to the best available system voice.
 */

import { NEURAL_VOICES, PiperVoice } from './voices-config';

class PiperService {
    private initialized: boolean = false;
    private systemVoices: SpeechSynthesisVoice[] = [];
    private voiceMap: Map<string, SpeechSynthesisVoice | null> = new Map();

    async init(): Promise<void> {
        if (this.initialized) return;
        if (typeof window === 'undefined') return;

        try {
            this.systemVoices = await this.loadVoices();
            this.buildVoiceMap();
            this.initialized = true;
            console.log(`TTS Service Initialized (${this.systemVoices.length} system voices available)`);
        } catch (err) {
            console.warn('TTS Service initialization warning:', err);
            this.initialized = true;
        }
    }

    private loadVoices(): Promise<SpeechSynthesisVoice[]> {
        return new Promise((resolve) => {
            const synth = window.speechSynthesis;
            const voices = synth.getVoices();
            if (voices.length > 0) {
                resolve(voices);
                return;
            }
            // Voices may load asynchronously
            synth.onvoiceschanged = () => {
                resolve(synth.getVoices());
            };
            // Fallback timeout
            setTimeout(() => resolve(synth.getVoices()), 1000);
        });
    }

    /**
     * Map each neural voice to the best available system voice
     * based on gender, accent, and premium quality indicators.
     */
    private buildVoiceMap(): void {
        for (const nv of NEURAL_VOICES) {
            const match = this.findBestSystemVoice(nv);
            this.voiceMap.set(nv.id, match);
        }
    }

    private findBestSystemVoice(nv: PiperVoice): SpeechSynthesisVoice | null {
        if (this.systemVoices.length === 0) return null;

        const isEnglish = (v: SpeechSynthesisVoice) => v.lang.startsWith('en');
        const isPremium = (v: SpeechSynthesisVoice) =>
            v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Neural');
        const isGoodQuality = (v: SpeechSynthesisVoice) =>
            !v.name.includes('Compact') && !v.name.includes('eSpeak');

        // Gender-based name hints
        const femaleNames = ['Samantha', 'Karen', 'Victoria', 'Fiona', 'Moira', 'Serena', 'Tessa', 'Allison'];
        const maleNames = ['Daniel', 'Alex', 'James', 'Thomas', 'Aaron', 'Oliver', 'Fred'];

        const genderNames = nv.gender === 'Female' ? femaleNames : maleNames;

        // Tier 1: Premium voice matching gender
        const premiumMatch = this.systemVoices.find(
            (v) => isEnglish(v) && isPremium(v) && genderNames.some((n) => v.name.includes(n))
        );
        if (premiumMatch) return premiumMatch;

        // Tier 2: Any premium English voice
        const anyPremium = this.systemVoices.find((v) => isEnglish(v) && isPremium(v));
        if (anyPremium) return anyPremium;

        // Tier 3: Good quality English voice matching gender
        const genderMatch = this.systemVoices.find(
            (v) => isEnglish(v) && isGoodQuality(v) && genderNames.some((n) => v.name.includes(n))
        );
        if (genderMatch) return genderMatch;

        // Tier 4: Any good quality English voice
        const anyGood = this.systemVoices.find((v) => isEnglish(v) && isGoodQuality(v));
        if (anyGood) return anyGood;

        // Tier 5: Any English voice
        const anyEnglish = this.systemVoices.find((v) => isEnglish(v));
        if (anyEnglish) return anyEnglish;

        // Last resort: first available voice
        return this.systemVoices[0] || null;
    }

    isNeuralAvailable(): boolean {
        return this.initialized && this.systemVoices.length > 0;
    }

    async speak(text: string, voiceId: string = 'piper-lessac'): Promise<HTMLAudioElement | null> {
        if (!this.initialized) await this.init();

        return new Promise((resolve) => {
            if (typeof window === 'undefined') { resolve(null); return; }

            const synth = window.speechSynthesis;
            // Cancel any ongoing speech
            synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            const nv = NEURAL_VOICES.find((v) => v.id === voiceId);

            // Use mapped system voice
            const systemVoice = this.voiceMap.get(voiceId) || this.voiceMap.values().next().value || null;
            if (systemVoice) utterance.voice = systemVoice;

            // Adjust rate/pitch per voice personality
            utterance.rate = nv?.quality === 'High' ? 0.92 : 0.95;
            utterance.pitch = nv?.gender === 'Female' ? 1.05 : 0.95;

            utterance.onend = () => resolve(null);
            utterance.onerror = () => resolve(null);

            synth.speak(utterance);
        });
    }

    /**
     * Simulate voice cloning by creating a "Custom" profile.
     * In a production implementation, this would send the audio sample
     * to a training pipeline.
     */
    async simulateCloning(_sampleBlob: Blob): Promise<PiperVoice> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newVoice: PiperVoice = {
                    id: `cloned-${Date.now()}`,
                    name: 'Personal Clone #1',
                    model: 'custom-cloned.onnx',
                    quality: 'High',
                    gender: 'Neutral',
                    accent: 'Personalized',
                    description: 'A high-fidelity clone generated from your audio sample.',
                    commercialOk: false,
                    licenseName: 'Personal Use Only',
                    licenseUrl: ''
                };
                resolve(newVoice);
            }, 3000); // 3 second simulated training
        });
    }
}

export const piperService = new PiperService();
