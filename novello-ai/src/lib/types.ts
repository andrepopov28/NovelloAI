import { Timestamp } from 'firebase/firestore';

// =============================================
// Novello AI v23 — Data Models (The Ironclad Schema)
// =============================================

export type AIProvider = 'ollama' | 'gemini';

export interface Project {
    id: string;
    userId: string;
    title: string;
    genre: string;
    synopsis: string; // The "North Star" premise
    seriesId: string | null; // 🆕 Links to parent Series
    settings: {
        aiProvider: AIProvider;
        modelName: string;
        temperature: number; // 0.0–2.0, default 0.7
        includeSeriesContext: boolean; // Include synopses from other series books in context
    };
    styleProfile: { // 🆕 Computed from existing chapters
        avgSentenceLength: number;
        vocabularyLevel: 'simple' | 'moderate' | 'literary';
        povConsistency: string;
        tenseUsage: string;
        dialogueRatio: number;
    } | null;
    contextRollup: { // 🆕 Denormalized summary cache
        chapterSummaries: Array<{
            chapterId: string;
            order: number;
            title: string;
            summary: string;
        }>;
        lastUpdated: Timestamp;
    };
    blurb: string | null;                // AI-generated marketing blurb (from Publish)
    metadata: {
        authorName: string;
        keywords: string[];
        language: string;                  // ISO 639-1 code
        isbn: string | null;
    } | null;
    wordCount: number;
    chapterCount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    coverImage?: string;
}

export interface Series {
    id: string;
    userId: string;
    title: string;
    description: string;
    projectIds: string[]; // Ordered list of project IDs
    sharedEntityIds: string[]; // Entity IDs visible across all projects
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Chapter {
    id: string;
    projectId: string;
    userId: string;
    title: string;
    content: string; // HTML format from TipTap
    synopsis: string; // AI-generated during Brainstorm phase
    order: number;
    status: 'draft' | 'review' | 'final';
    lastSummary: string; // Cached for "The Loom" context engine
    wordCount: number; // 🆕 Per-chapter word count
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ChapterVersion { // 🆕
    id: string;
    chapterId: string;
    userId: string;
    content: string; // Full HTML snapshot
    wordCount: number;
    source: 'autosave' | 'manual' | 'ai-generation' | 'import';
    isPinned: boolean;
    createdAt: Timestamp;
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
    isShared: boolean; // 🆕 Series visibility
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ContinuityAlert { // 🆕
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
    createdAt: Timestamp;
}

export interface AudiobookSession { // 🆕
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
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface VoiceClone { // 🆕
    id: string;
    userId: string;
    name: string;
    sampleStoragePath: string;
    piperModelPath: string | null;
    status: 'sampling' | 'training' | 'ready' | 'failed';
    createdAt: Timestamp;
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
    gemini: boolean;
}

export interface AIState {
    isGenerating: boolean;
    isStreaming: boolean;
    status: 'idle' | 'generating' | 'streaming' | 'complete' | 'error';
    error: string | null;
}
