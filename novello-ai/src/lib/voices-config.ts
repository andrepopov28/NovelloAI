export interface PiperVoice {
    id: string;
    name: string;
    model: string;
    quality: 'Low' | 'Medium' | 'High';
    gender: 'Male' | 'Female' | 'Neutral';
    accent: string;
    description: string;
    commercialOk: boolean;
    licenseName: string;
    licenseUrl: string;
}

export const NEURAL_VOICES: PiperVoice[] = [
    {
        id: 'piper-lessac',
        name: 'The Director',
        model: 'en_US-lessac-high.onnx',
        quality: 'High',
        gender: 'Female',
        accent: 'US English',
        description: 'A professional and clear voice suitable for narration and editing guidance.',
        commercialOk: true,
        licenseName: 'Public Domain',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-cori',
        name: 'The Gentlewoman',
        model: 'en_GB-cori-high.onnx',
        quality: 'High',
        gender: 'Female',
        accent: 'UK English',
        description: 'Sophisticated British accent with a gentle rhythmic flow.',
        commercialOk: true,
        licenseName: 'Public Domain',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-libritts',
        name: 'The Bard',
        model: 'en_US-libritts_r-medium.onnx',
        quality: 'Medium',
        gender: 'Neutral',
        accent: 'US English',
        description: 'An expressive and lyrical voice ideal for audio storytelling.',
        commercialOk: true,
        licenseName: 'CC BY 4.0',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-joe',
        name: 'The Architect',
        model: 'en_US-joe-medium.onnx',
        quality: 'Medium',
        gender: 'Male',
        accent: 'US English',
        description: 'A deep, resonant voice perfect for dramatic thrillers and focused narrative structure.',
        commercialOk: true,
        licenseName: 'Public Domain',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-alan',
        name: 'The Curator',
        model: 'en_GB-alan-medium.onnx',
        quality: 'Medium',
        gender: 'Male',
        accent: 'UK English',
        description: 'A precise and organized voice for clear storytelling.',
        commercialOk: true,
        licenseName: 'Public Domain',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-hfc_male',
        name: 'Soft Storyteller',
        model: 'en_US-hfc_male-medium.onnx',
        quality: 'Medium',
        gender: 'Male',
        accent: 'US English',
        description: 'Warm and inviting voice, ideal for cozy mysteries and emotional prose.',
        commercialOk: true,
        licenseName: 'Public Domain',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-ryan',
        name: 'Epic Narrator',
        model: 'en_US-ryan-high.onnx',
        quality: 'High',
        gender: 'Male',
        accent: 'US English',
        description: 'Consistently highly rated voice for long-form audiobook reading.',
        commercialOk: true,
        licenseName: 'Public Domain',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-kusal',
        name: 'Neutral Reporter',
        model: 'en_US-kusal-medium.onnx',
        quality: 'Medium',
        gender: 'Male',
        accent: 'US English',
        description: 'Clear, articulate voice for objective and stable pacing.',
        commercialOk: true,
        licenseName: 'Public Domain',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-thorsten',
        name: 'The Publisher (DE)',
        model: 'de_DE-thorsten-high.onnx',
        quality: 'High',
        gender: 'Male',
        accent: 'German',
        description: 'The gold standard open-source German voice; incredibly natural.',
        commercialOk: true,
        licenseName: 'CC0',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    },
    {
        id: 'piper-pavoque',
        name: 'The Overseer (DE)',
        model: 'de_DE-pavoque-low.onnx',
        quality: 'Low',
        gender: 'Male',
        accent: 'German',
        description: 'A commanding voice providing alternative German narration.',
        commercialOk: true,
        licenseName: 'CC0',
        licenseUrl: 'https://huggingface.co/datasets/rhasspy/piper-voices'
    }
];
