// =============================================
// Novello AI V33 — Data Models (The Ironclad Schema)
// =============================================

export type AIProvider = 'ollama' | 'auto';

export interface Project {
    id: string;
    userId: string;
    title: string;
    genre: string;
    synopsis: string; // The "North Star" premise
    seriesId: string | null; // Links to parent Series
    settings: {
        aiProvider: AIProvider;
        modelName: string;
        temperature: number; // 0.0–2.0, default 0.7
        includeSeriesContext: boolean; // Include synopses from other series books in context
    };
    styleProfile: { // Computed from existing chapters
        avgSentenceLength: number;
        vocabularyLevel: 'simple' | 'moderate' | 'literary';
        povConsistency: string;
        tenseUsage: string;
        dialogueRatio: number;
    } | null;
    contextRollup: { // Denormalized summary cache
        chapterSummaries: Array<{
            chapterId: string;
            order: number;
            title: string;
            summary: string;
        }>;
        lastUpdated: number;
    };
    blurb: string | null;                // AI-generated marketing blurb (from Publish)
    metadata: {
        authorName: string;
        keywords: string[];
        language: string;                  // ISO 639-1 code
        isbn: string | null;
    } | null;
    wordCount: number;
    targetWordCount?: number; // Target word count for progress tracking
    targetChapterCount?: number; // Target chapter count for progress tracking
    chapterCount: number;
    createdAt: number;
    updatedAt: number;
    coverImage?: string;
}

export interface Series {
    id: string;
    userId: string;
    title: string;
    description: string;
    projectIds: string[]; // Ordered list of project IDs
    sharedEntityIds: string[]; // Entity IDs visible across all projects
    createdAt: number;
    updatedAt: number;
}

export interface Chapter {
    id: string;
    projectId: string;
    userId: string;
    title: string;
    content: string; // HTML format from TipTap
    audioUrl?: string; // Base64 Data URL for manual Hybrid Audiobook recording (Narrator mode)
    synopsis: string; // AI-generated during Brainstorm phase
    order: number;
    status: 'draft' | 'review' | 'final';
    lastSummary: string; // Cached for "The Loom" context engine
    wordCount: number; // Per-chapter word count
    createdAt: number;
    updatedAt: number;
}

export interface ChapterVersion { 
    id: string;
    chapterId: string;
    userId: string;
    content: string; // Full HTML snapshot
    wordCount: number;
    source: 'autosave' | 'manual' | 'ai-generation' | 'import';
    isPinned: boolean;
    createdAt: number;
}

export interface Entity {
    id: string;
    projectId: string;
    userId: string;
    name: string;
    type: 'Character' | 'Location' | 'Item' | 'Lore';
    description: string;
    appearance: string; // Markdown
    motivations: string; // Markdown
    lore: string; // Markdown
    appearances: string[]; // Tracked chapter IDs
    relationships: Array<{
        targetEntityId: string;
        relationshipType: string;
        description: string;
    }>;
    isShared: boolean; // Series visibility
    createdAt: number;
    updatedAt: number;
}

export interface ContinuityAlert {
    id: string;
    projectId: string;
    userId: string;
    chapterId: string;
    entityId: string | null;
    type: 'contradiction' | 'timeline' | 'characterAttribute' | 'settingDetail';
    severity: 'warning' | 'critical';
    message: string;
    sourceChapterId: string;
    sourceExcerpt: string;
    flaggedExcerpt: string;
    status: 'open' | 'dismissed' | 'resolved';
    createdAt: number;
}

export interface AudiobookSession {
    id: string;
    projectId: string;
    userId: string;
    voiceModelId: string;
    chapters: Array<{
        chapterId: string;
        audioStoragePath: string | null;
        status: 'pending' | 'generating' | 'complete' | 'error';
        durationSeconds: number | null;
    }>;
    playbackPosition: {
        chapterId: string;
        timeSeconds: number;
    };
    createdAt: number;
    updatedAt: number;
}

export interface VoiceAvatar {
    path?: string;
    url?: string;
    width?: number;
    height?: number;
    blurhash?: string;
    updatedAt?: number;
}

export interface VoiceSettings {
    speed: number;
    pitch?: number;
    pauseMs?: number;
    emphasis?: string;
    normalizeLufs?: boolean;
    chapterPauseMs?: number;
}

export interface VoiceCatalog {
    id: string; // voiceId
    type: 'builtin';
    provider: string; // e.g., 'piper'
    engineVoiceId: string;
    displayName: string;
    language: string;
    accent?: string;
    gender?: string;
    ageStyle?: string;
    description?: string;
    commercialOk: boolean;
    licenseName: string;
    licenseUrl: string;
    tags?: string[];
    defaultSettings?: VoiceSettings;
    avatar?: VoiceAvatar;
    createdAt: number;
    updatedAt: number;
}

export interface VoiceClone { 
    id: string; // voiceId
    userId: string;
    type: 'cloned';
    source: 'upload' | 'recording' | 'import';
    engineVoiceId?: string;

    displayName: string; // Replaces previous 'name'
    description?: string;
    language?: string;
    accent?: string;
    gender?: string;
    ageStyle?: string;
    tags?: string[];

    defaultSettings?: VoiceSettings;
    avatar?: VoiceAvatar;

    sampleStoragePath: string;
    piperModelPath: string | null;

    status: 'sampling' | 'training' | 'ready' | 'failed' | 'deleted';
    createdAt: number;
    updatedAt?: number;
    deletedAt?: number;
}

export interface PersonaSettings { 
    id: string; // persona key e.g., 'write', 'brainstorm', 'codex'
    userId: string;
    name: string;
    provider: string;
    model: string;
    voiceId: string | null;
    personality: string;
    updatedAt: number;
}

export interface ExportJob {
    id: string; // exportId
    projectId: string; // The parent project
    userId: string; // The owner
    type: 'audiobook' | 'pdf' | 'epub';
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: {
        currentChapter: number;
        totalChapters: number;
        percentComplete: number;
        stage: 'cleaning' | 'tts' | 'concatenating' | 'uploading';
    };
    formats: {
        wav?: string; // Storage URL or path
        mp3?: string; // Storage URL or path
        m4b?: {
            path: string;
            sizeBytes: number;
            durationMs: number;
            codec: string;
            bitrateKbps: number;
            channels: number;
            sampleRate: number;
        };
    };
    bookMeta?: {
        title: string;
        author: string;
        narrator: string;
        language: string;
        description: string;
        year: string;
        coverAssetRef?: string;
    };
    chapters?: Array<{
        chapterId: string;
        title: string;
        index: number;
        startMs: number;
        endMs: number;
        durationMs: number;
    }>;
    settings: {
        voiceId: string;
        language: string;
        speed: number;
        pauseDurationMs: number;
        bitrateKbps?: number;
    };
    error?: string;
    createdAt: number;
    updatedAt: number;
}

export interface ExportChapter {
    id: string; // chapterId
    exportId: string;
    order: number;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'; // skipped if resuming
    audioStoragePath?: string;
    durationSeconds?: number;
    updatedAt: number;
}

export interface PlaybackState {
    id: string; // Matches exportId
    userId: string;
    positionMs: number;
    speed: number;
    updatedAt: number;
    lastPlayedAt: number;
}

export interface Bookmark {
    id: string; // bookmarkId
    exportId: string;
    userId: string;
    positionMs: number;
    label: string;
    createdAt: number;
}

// =============================================
// Helper Types
// =============================================

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

export interface AIRequest {
    prompt: string;
    provider: AIProvider;
    model: string;
    mode: 'stream' | 'json';
    action?: 'rewrite' | 'expand' | 'outline' | 'continuity'; // Added continuity
    genre?: string;
}

export interface OutlineChapter {
    title: string;
    synopsis: string;
}

export interface OutlineResult {
    chapters: OutlineChapter[];
}

export interface AIHealthStatus {
    ollama: boolean;
}

export interface AIState {
    isGenerating: boolean;
    isStreaming: boolean;
    status: 'idle' | 'generating' | 'streaming' | 'complete' | 'error';
    error: string | null;
}
