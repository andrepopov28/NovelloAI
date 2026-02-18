export interface PiperVoice {
    id: string;
    name: string;
    model: string;
    quality: 'Low' | 'Medium' | 'High';
    gender: 'Male' | 'Female' | 'Neutral';
    accent: string;
    description: string;
}

export const NEURAL_VOICES: PiperVoice[] = [
    {
        id: 'piper-lessac',
        name: 'The Director',
        model: 'en_US-lessac-medium.onnx',
        quality: 'Medium',
        gender: 'Male',
        accent: 'US English',
        description: 'A professional and clear voice suitable for narration and editing guidance.',
    },
    {
        id: 'piper-libritts',
        name: 'The Bard',
        model: 'en_US-libritts-high.onnx',
        quality: 'High',
        gender: 'Male',
        accent: 'US English',
        description: 'An expressive and lyrical voice ideal for audio storytelling.',
    },
    {
        id: 'piper-architect',
        name: 'The Architect',
        model: 'en_US-architect-medium.onnx',
        quality: 'Medium',
        gender: 'Male',
        accent: 'US English',
        description: 'A focused and visionary voice for narrative structure.',
    },
    {
        id: 'piper-curator',
        name: 'The Curator',
        model: 'en_US-curator-medium.onnx',
        quality: 'Medium',
        gender: 'Female',
        accent: 'US English',
        description: 'A precise and organized voice for data management.',
    },
    {
        id: 'piper-overseer',
        name: 'The Overseer',
        model: 'en_US-overseer-high.onnx',
        quality: 'High',
        gender: 'Female',
        accent: 'US English',
        description: 'A commanding and visionary voice for project oversight.',
    },
    {
        id: 'piper-amy',
        name: 'Soft Storyteller',
        model: 'en_US-amy-medium.onnx',
        quality: 'Medium',
        gender: 'Female',
        accent: 'US English',
        description: 'Warm and inviting voice, ideal for cozy mysteries and emotional prose.',
    },
    {
        id: 'piper-southern-female',
        name: 'The Gentlewoman',
        model: 'en_GB-southern_english_female-low.onnx',
        quality: 'Low',
        gender: 'Female',
        accent: 'UK English',
        description: 'Sophisticated British accent with a gentle rhythmic flow.',
    },
    {
        id: 'piper-vctk-neutral',
        name: 'Neutral Reporter',
        model: 'en_US-vctk-medium.onnx',
        quality: 'Medium',
        gender: 'Neutral',
        accent: 'US English',
        description: 'Balanced, objective tone for legal or formal sections.',
    },
    {
        id: 'piper-librispeech-high',
        name: 'Epic Narrator',
        model: 'en_US-librispeech-high.onnx',
        quality: 'High',
        gender: 'Male',
        accent: 'US English',
        description: 'Deep, resonant voice suited for epic fantasy and dramatic tension.',
    },
    {
        id: 'piper-publisher',
        name: 'The Publisher',
        model: 'en_US-publisher-high.onnx',
        quality: 'High',
        gender: 'Male',
        accent: 'US English',
        description: 'A wise and authoritative voice for finalizing your work.',
    },
];
