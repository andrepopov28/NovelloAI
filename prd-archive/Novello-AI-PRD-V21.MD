Product Requirements Document (PRD) v21.0
Project: Novello AI — The Autonomous Publisher
Version: 21.0 (The "Red-Teamed" Comprehensive Build Specification) Status: READY FOR BUILD Architect: Antigravity (Google DeepMind) Revision Note: This version incorporates a full security audit, edge-case stress test, and commercially critical new features on top of the existing v20 codebase. All ambiguous language from v20.0 has been replaced with measurable engineering constraints. No features have been removed — all existing functionality is retained and further specified. New sections are marked with 🆕.

1. Executive Summary & Philosophy
Novello AI is an AI-first manuscript development platform designed for high-throughput authors. Unlike traditional text editors, Novello is a context-aware ecosystem where the AI acts as a collaborative agent rather than a passive tool.
Core Philosophy: "The Integrated Mind"
	1	Context is King: The AI never generates in a vacuum. It is fed a "Rolling Context" (a denormalized summary rollup) and a "World Bible" (Entity data) with every prompt.
	2	Visual Excellence: The interface uses a dark-mode glassmorphism design system with defined CSS specs (see Section 2) to reduce cognitive strain during long writing sessions.
	3	Local-First Hybrid: Integration with local LLMs (Ollama) ensures privacy and speed, with cloud fallbacks (Gemini) for high-reasoning tasks.
	4	Atomic Consistency: Data models, UI components, and state logic are strictly mapped to ensure no drift between the database and the rendered view.
	5	🆕 Writer Safety: Version history, autosave integrity, and import capabilities ensure that no user work is ever lost and existing work can be brought in from day one.
	6	🆕 Voice Fidelity: The Style Consistency Engine ensures AI-generated prose matches the author's established voice, preventing generic "AI voice" output.

2. Visual Blueprint ("Stitch" Design System)
The UI follows a "Luxury Apple Dark" aesthetic, prioritizing depth, translucency, and vibrant but controlled accents.
A. Design Tokens
	•	Surfaces:
	◦	--surface-primary: #09090b (The deep stage / base background)
	◦	--surface-secondary: #121215 (Cards, sidebars, panels)
	◦	--surface-elevated: #1a1a1f (Modals, dropdowns, popovers)
	◦	--glass-bg: rgba(18, 18, 21, 0.8) with backdrop-filter: blur(20px) and border: 1px solid rgba(255, 255, 255, 0.06)
	•	Typography:
	◦	UI: Inter (Sans-serif), base size 14px, line-height 1.5, for high legibility in menus and controls.
	◦	Manuscript: Merriweather (Serif), base size 18px, line-height 1.8, for a classic, immersive writing feel.
	•	Color Palette (HSL Tailored):
	◦	Accent (Primary): hsl(190, 95%, 50%) / cyan-500 (Novello Blue) — Active states, AI output highlights, "The Muse" persona.
	◦	Accent (Warm): hsl(38, 85%, 38%) / #b8860b (Golden Bronze) — "The Journalist/Novelist" persona, navigation highlights.
	◦	Success: hsl(142, 71%, 45%) — Sync confirmed, save complete.
	◦	Warning: hsl(38, 92%, 50%) — Pending sync, dirty state.
	◦	Destructive: hsl(347, 77%, 50%) / rose-500 — Deletions, errors, destructive actions.
	◦	Offline: hsl(190, 95%, 50%) (Accent Primary) — Offline state indicator.
	◦	Text Primary: hsl(0, 0%, 93%) — Body text on dark surfaces.
	◦	Text Secondary: hsl(0, 0%, 55%) — Labels, captions, metadata.
	•	Animations:
	◦	--transition-spring: cubic-bezier(0.34, 1.56, 0.64, 1), duration 300ms. Used for button presses, panel toggles, modal entrances, bouncy UI transitions.
	◦	--transition-smooth: cubic-bezier(0.4, 0, 0.2, 1), duration 200ms. Used for hover states, color transitions.
	◦	Stagger-children: 50ms interval fade-in (opacity 0→1, translateY 8px→0). Applied to: Project card grid, Chapter navigator list, Entity card grid. Maximum 8 items staggered; items 9+ render immediately with no animation to prevent sluggish load perception.
	•	Interactive Elements:
	◦	Minimum touch target: 44px × 44px on all interactive elements.
	◦	Hover glow: box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.15) with --transition-smooth.
	◦	Active state: transform: scale(0.97) with --transition-spring.
	◦	Focus ring: 2px solid var(--accent-primary) with 2px offset. All interactive elements must be keyboard-navigable.
B. Component Specs
Glass Card (Project Cards, Entity Cards, Navigation Tiles)
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  transition: box-shadow var(--transition-smooth), transform var(--transition-spring);
}
.glass-card:hover {
  box-shadow: 0 0 24px rgba(var(--accent-rgb), 0.12);
}
.glass-card:active {
  transform: scale(0.97);
}
"Write with AI" Button (Editor Empty State)
A pulsing gradient border animation on a glass-card button, centered in the editor viewport.
.write-ai-btn {
  background: var(--surface-secondary);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px 32px;
  background-clip: padding-box;
  position: relative;
}
.write-ai-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-warm), var(--accent-primary));
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
  z-index: -1;
}
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
Audiobook Waveform Display
.waveform-container {
  background: var(--surface-secondary);
  border-radius: 12px;
  padding: 16px;
  height: 120px;
}
.waveform-canvas {
  /* Rendered via WaveSurfer.js — amplitude waveform, not spectrogram */
  /* Colors: inactive region var(--text-secondary), played region var(--accent-primary) */
  /* Click-to-seek enabled: clicking any position on the waveform sets playback position */
  width: 100%;
  height: 100%;
}
Spectrogram Visualization (Voice Cloning Sampling)
.spectrogram-container {
  background: var(--surface-primary);
  border-radius: 12px;
  padding: 16px;
  height: 200px;
}
.spectrogram-canvas {
  /* Frequency-domain visualization rendered via Web Audio API AnalyserNode */
  /* Color map: dark blue (low energy) → cyan → yellow → red (high energy) */
  /* X-axis: time, Y-axis: frequency (0–8kHz range for speech) */
  /* Updates in real-time during voice sample recording */
  width: 100%;
  height: 100%;
}

3. Technology Stack & Language
	•	Frontend: Next.js 15 (App Router), React 19.
	•	Language: TypeScript (Strict Mode) — Essential for data model integrity.
	•	Styling: Vanilla CSS (Global Tokens as CSS Custom Properties) — Modular and flexible without the overhead of heavy utility frameworks.
	•	Editor Core: Tiptap (ProseMirror-based) for a headless, highly customizable rich-text experience.
	•	Backend:
	◦	Firebase Firestore: NoSQL document store with offline persistence enabled (enableIndexedDbPersistence at app init).
	◦	Firebase Storage: For cover images and audio assets (voice samples, generated audiobook files).
	◦	Firebase Authentication: See Section 4.
	•	AI Engine: Custom useAI hook wrapping:
	◦	Local: Ollama API (v1/chat/completions) for privacy and speed.
	◦	Cloud: Google Gemini Pro for high-reasoning tasks (complex brainstorming, continuity analysis on large contexts).
	•	Audio Engine:
	◦	Piper TTS: Local text-to-speech via Piper binary (called from Next.js API route or Electron shell).
	◦	WaveSurfer.js: Waveform rendering and interactive audio playback.
	◦	Web Audio API: Spectrogram visualization during voice cloning.
	•	🆕 Import Engine: mammoth.js for .docx → HTML conversion. marked or remark for .md → HTML. Native text parser for .txt.
	•	Charts: recharts or Chart.js for analytics visualizations.

4. Authentication System 🆕
A. Providers
	•	Google Sign-In (Primary): OAuth 2.0 via Firebase Authentication. One-tap sign-in on supported browsers.
	•	Email/Password (Secondary): With email verification required before first project creation.
B. Session Management
	•	Firebase Authentication manages session tokens automatically.
	•	Token Refresh: Firebase SDK handles token refresh silently. If a token refresh fails (e.g., user revokes access), the app redirects to /login with a toast: "Your session has expired. Please sign in again."
	•	Persistence: browserLocalPersistence — user stays signed in across tabs and browser restarts.
C. Auth State Flow
	1	App loads → Firebase onAuthStateChanged listener fires.
	2	If user === null → redirect to /login. No authenticated routes are accessible.
	3	If user !== null → proceed to Dashboard. The userId is available globally via a useAuth context hook.
	4	Sign Out: Clears Firebase auth state, clears any local caches (localStorage AI config, not chapter backups), redirects to /login.
D. Protected Routes
All routes except /login require authentication. Middleware checks onAuthStateChanged before rendering any page component. Unauthenticated requests to protected routes return a redirect, never a flash of authenticated content.

5. Data Architecture
Firestore Structures
All documents include userId for security rule validation.
A. Projects (/projects/{projectId})
interface Project {
  id: string;
  userId: string;
  title: string;
  genre: string;
  synopsis: string;                  // The "North Star" premise
  seriesId: string | null;           // 🆕 Links to parent Series (null if standalone)
  settings: {
    aiProvider: 'ollama' | 'gemini';
    modelName: string;               // Dynamic based on scan
    temperature: number;             // 🆕 0.0–2.0, default 0.7
  };
  styleProfile: {                    // 🆕 Computed from existing chapters
    avgSentenceLength: number;
    vocabularyLevel: 'simple' | 'moderate' | 'literary';
    povConsistency: string;          // e.g., "third-person limited"
    tenseUsage: string;              // e.g., "past tense"
    dialogueRatio: number;           // 0.0–1.0
  } | null;
  contextRollup: {                   // 🆕 Denormalized summary cache (solves N+1 reads)
    chapterSummaries: Array<{
      chapterId: string;
      order: number;
      title: string;
      summary: string;
    }>;
    lastUpdated: Timestamp;
  };
  wordCount: number;
  chapterCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
B. Series (/series/{seriesId}) 🆕
interface Series {
  id: string;
  userId: string;
  title: string;
  description: string;
  projectIds: string[];              // Ordered list of project IDs in the series
  sharedEntityIds: string[];         // Entity IDs that persist across all projects in the series
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
C. Chapters (/projects/{projectId}/chapters/{chapterId})
interface Chapter {
  id: string;
  projectId: string;
  userId: string;                    // 🆕 Duplicated for security rule validation on subcollections
  title: string;
  content: string;                   // HTML format from TipTap (max 900KB — enforced, see Limits)
  synopsis: string;                  // AI-generated during Brainstorm phase
  order: number;
  status: 'draft' | 'review' | 'final';
  lastSummary: string;               // Cached for "The Loom" context engine
  wordCount: number;                 // 🆕 Per-chapter word count
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
D. Chapter Versions (/projects/{projectId}/chapters/{chapterId}/versions/{versionId}) 🆕
interface ChapterVersion {
  id: string;
  chapterId: string;
  userId: string;
  content: string;                   // Full HTML snapshot
  wordCount: number;
  source: 'autosave' | 'manual' | 'ai-generation' | 'import';
  isPinned: boolean;                 // Pinned versions are exempt from auto-pruning
  createdAt: Timestamp;
}
Retention Policy: Keep the last 50 versions per chapter. On version 51, delete the oldest non-pinned version. Users can manually pin up to 5 versions per chapter.
E. Entities (/projects/{projectId}/entities/{entityId})
interface Entity {
  id: string;
  projectId: string;
  userId: string;                    // 🆕 Duplicated for security rules
  name: string;
  type: 'Character' | 'Location' | 'Item' | 'Lore';
  description: string;
  appearance: string;                // Markdown field
  motivations: string;               // Markdown field (Characters)
  lore: string;                      // Markdown field
  appearances: string[];             // Tracked chapter IDs
  relationships: Array<{             // Entity-to-entity links
    targetEntityId: string;
    relationshipType: string;        // e.g., "Sibling of", "Located in", "Created by"
    description: string;
  }>;
  isShared: boolean;                 // 🆕 If true, entity belongs to a Series and is visible across projects
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
F. Continuity Alerts (/projects/{projectId}/alerts/{alertId}) 🆕
interface ContinuityAlert {
  id: string;
  projectId: string;
  userId: string;
  chapterId: string;                 // Chapter where the inconsistency was detected
  entityId: string | null;           // Related entity, if applicable
  type: 'contradiction' | 'timeline' | 'characterAttribute' | 'settingDetail';
  severity: 'warning' | 'critical';
  message: string;                   // Human-readable description
  sourceChapterId: string;           // The earlier chapter containing the "canonical" fact
  sourceExcerpt: string;             // Relevant excerpt from the source chapter
  flaggedExcerpt: string;            // The conflicting excerpt in the current chapter
  status: 'open' | 'dismissed' | 'resolved';
  createdAt: Timestamp;
}
G. Audiobook Sessions (/projects/{projectId}/audiobook/{sessionId})
interface AudiobookSession {
  id: string;
  projectId: string;
  userId: string;
  voiceModelId: string;              // Reference to selected Piper voice or custom clone
  chapters: Array<{
    chapterId: string;
    audioStoragePath: string | null;  // Firebase Storage path for generated audio
    status: 'pending' | 'generating' | 'complete' | 'error';
    durationSeconds: number | null;
  }>;
  playbackPosition: {                // Session-persisted playback state
    chapterId: string;
    timeSeconds: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
H. Voice Clones (/users/{userId}/voiceClones/{cloneId})
interface VoiceClone {
  id: string;
  userId: string;
  name: string;                      // User-assigned name, e.g., "Narrator - Deep Male"
  sampleStoragePath: string;         // Firebase Storage path to the voice sample WAV
  piperModelPath: string | null;     // Path to the fine-tuned Piper model (null while training)
  status: 'sampling' | 'training' | 'ready' | 'failed';
  createdAt: Timestamp;
}
Firestore Document Limits (Enforced) 🆕
Resource
Limit
Enforcement
Projects per user
50
Checked on create; toast error if exceeded
Chapters per project
200
Checked on create
Entities per project
500
Checked on create
Chapter content size
900 KB
Validated before Firestore write; warning toast at 800 KB
Versions per chapter
50 (+ 5 pinned)
Auto-pruned on new version save
Voice clones per user
10
Checked on create

6. Firestore Security Rules 🆕
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: Check if the authenticated user owns the parent project
    function isProjectOwner(projectId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
    }

    // PROJECTS
    match /projects/{projectId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid;  // Cannot transfer ownership
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;

      // CHAPTERS (subcollection)
      match /chapters/{chapterId} {
        allow read: if isProjectOwner(projectId);
        allow create: if isProjectOwner(projectId)
                      && request.resource.data.userId == request.auth.uid
                      && request.resource.data.projectId == projectId;
        allow update: if isProjectOwner(projectId)
                      && request.resource.data.userId == request.auth.uid;
        allow delete: if isProjectOwner(projectId);

        // CHAPTER VERSIONS (sub-subcollection)
        match /versions/{versionId} {
          allow read: if isProjectOwner(projectId);
          allow create: if isProjectOwner(projectId)
                        && request.resource.data.userId == request.auth.uid;
          allow delete: if isProjectOwner(projectId);
          allow update: if isProjectOwner(projectId);  // For pinning/unpinning only
        }
      }

      // ENTITIES (subcollection)
      match /entities/{entityId} {
        allow read: if isProjectOwner(projectId);
        allow create: if isProjectOwner(projectId)
                      && request.resource.data.userId == request.auth.uid;
        allow update: if isProjectOwner(projectId)
                      && request.resource.data.userId == request.auth.uid;
        allow delete: if isProjectOwner(projectId);
      }

      // CONTINUITY ALERTS (subcollection)
      match /alerts/{alertId} {
        allow read: if isProjectOwner(projectId);
        allow create: if isProjectOwner(projectId);
        allow update: if isProjectOwner(projectId);
        allow delete: if isProjectOwner(projectId);
      }

      // AUDIOBOOK SESSIONS (subcollection)
      match /audiobook/{sessionId} {
        allow read: if isProjectOwner(projectId);
        allow create: if isProjectOwner(projectId);
        allow update: if isProjectOwner(projectId);
        allow delete: if isProjectOwner(projectId);
      }
    }

    // SERIES
    match /series/{seriesId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // VOICE CLONES (user-level collection)
    match /users/{userId}/voiceClones/{cloneId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // DEFAULT DENY
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

7. State Management & Synchronicity
Novello uses a Decentralized Multi-Hook Architecture to manage complexity.
A. Hook Architecture
useAuth 🆕
Global context providing user object, userId, isLoading, signIn(), signOut(). Wraps Firebase onAuthStateChanged.
useAutoSave (🔧 Fixed from v20)
	•	Debounce: 2000ms after last keystroke.
	•	Payload Capture: On invocation, the hook captures a snapshot of { chapterId, content, wordCount } at debounce-trigger time. The Firestore write uses this captured chapterId, not the currently active chapter ID. This prevents cross-chapter data clobbering on rapid navigation.
	•	Abort on Navigate: If the user switches chapters while a debounce is pending, the pending debounce is cancelled. Any in-flight write (already dispatched to Firestore) completes normally because it carries its own chapterId.
	•	Version Creation: Every autosave also creates a ChapterVersion document with source: 'autosave'. Pruning runs after write (delete oldest non-pinned if count > 50).
	•	Context Rollup Sync: If the chapter's lastSummary has changed since last save, update the corresponding entry in project.contextRollup.chapterSummaries in the same batch write.
	•	SyncIndicator States:
	◦	Gold (Warning color): Content is dirty / unsaved.
	◦	Green (Success color): Save confirmed by Firestore.
	◦	Red (Destructive color): Save failed. Toast: "Save failed. Retrying..." Auto-retry 3× with exponential backoff (2s, 4s, 8s). After 3 failures: persistent toast: "Unable to save. Your work is preserved locally. Check your connection."
	◦	Blue (Accent Primary): Offline. Toast: "You're offline. Changes saved locally and will sync when you reconnect."
useAI (🔧 Fixed from v20)
	•	Provider Resolution: Hierarchical: Project Settings → LocalStorage Defaults → Hardcoded Fallbacks.
	◦	Ollama fallback: llama3.2:latest, temperature 0.7.
	◦	Gemini fallback: gemini-pro, temperature 0.7 (requires API key in settings).
	•	Request Lifecycle:
	1	Check provider connectivity (Ollama: cached status from Connection Watcher; Gemini: attempt request directly).
	2	If Ollama selected but unreachable → check if Gemini API key is configured. If yes, auto-fallback to Gemini with toast: "Ollama unavailable. Using Gemini." If no Gemini key → toast: "AI is unavailable. Ollama server not detected at localhost:11434. Check that Ollama is running."
	3	If reachable → Send request with 60-second timeout.
	4	On timeout → Toast: "AI request timed out. The model may be loading. Try again."
	5	On rate limit (Gemini 429) → Exponential backoff: retry after 2s, 4s, 8s. After 3 failures → toast: "Gemini rate limit reached. Wait a moment and try again, or switch to Ollama in Settings."
	6	On malformed response → Log error. Toast: "AI returned an unexpected response. Try again or switch models in Settings."
	7	On context window exceeded → Toast: "Your context is too large for this model. Try a model with a larger context window, or reduce the number of chapters included in context."
	•	Output Sanitization: All AI-generated content is sanitized through DOMPurify before insertion into TipTap. Allowed tags: p, br, em, strong, h1-h6, ul, ol, li, blockquote, span. All other tags and attributes are stripped.
	•	Streaming: AI responses stream token-by-token into the editor using Ollama's streaming endpoint (or Gemini's streaming API). A "Stop Generating" button appears during streaming.
useContextEngine (The Loom) (🔧 Fixed from v20)
	•	Data Source: Reads project.contextRollup.chapterSummaries — a single Firestore read on the Project document. No subcollection scan required.
	•	Context Assembly: Concatenates summaries for chapters with order less than the current chapter's order. Injects Entity descriptions for entities appearing in adjacent chapters (current ± 2).
	•	Token Budget: Context string is truncated to 2,000 tokens maximum. Priority order: (1) most recent 3 chapter summaries, (2) entities relevant to current chapter, (3) earlier chapter summaries in reverse order, (4) style profile constraints.
	•	Rollup Update Trigger: Handled by useAutoSave — when a chapter save includes a changed lastSummary, the rollup is updated in the same batch write.
useStyleProfile 🆕
	•	Purpose: Analyzes the author's existing prose to compute a style fingerprint.
	•	Trigger: Runs when a project has ≥ 3 chapters with ≥ 500 words each. Re-runs when any chapter content changes significantly (> 20% word count delta from last analysis).
	•	Computed Metrics (client-side text analysis, no AI call required):
	◦	avgSentenceLength: Mean word count per sentence.
	◦	vocabularyLevel: Distribution of word syllable counts → classified as simple (< 1.4 avg syllables), moderate (1.4–1.8), literary (> 1.8).
	◦	povConsistency: Pronoun frequency analysis to detect dominant POV.
	◦	tenseUsage: Verb tense detection for dominant tense.
	◦	dialogueRatio: Ratio of text within quotation marks to total text.
	•	Storage: Written to project.styleProfile.
	•	Prompt Injection: When The Novelist generates prose, the system prompt includes: STYLE CONSTRAINTS (derived from the author's existing chapters):- Average sentence length: [X] words. Vary naturally but maintain this center.- Vocabulary: [level]. Do not use words significantly above or below this register.- POV: [pov]. Maintain strictly.- Tense: [tense]. Do not switch unless the author has established tense shifts.- Dialogue ratio: approximately [X]% of prose should be dialogue.Prioritize matching the author's voice over literary flourish.
	•	
useContinuityChecker 🆕
	•	Trigger: Runs as a background task after each chapter save (debounced, 10-second delay after save confirmation).
	•	Process:
	1	Sends the saved chapter's content + all Entity data + summaries of preceding chapters to the AI.
	2	System prompt: "You are a continuity editor with perfect recall. Compare the provided chapter against the established facts from prior chapters and the entity database. Identify contradictions in: character physical descriptions, character abilities, timeline/chronology, location details, established world rules. Return a JSON array of findings or an empty array if none."
	3	Parses AI response. Creates ContinuityAlert documents for each finding.
	•	Provider: Prefers Gemini for continuity checks (larger context window for cross-chapter analysis). Falls back to Ollama if no Gemini key configured.
	•	Rate Limiting: Maximum one continuity check per chapter per 5-minute window to prevent excessive AI calls during rapid editing.
useAudiobook
	•	Purpose: Manages audiobook generation session state, playback position, and voice model selection.
	•	Playback Sync: On pause or every 30 seconds during playback, writes playbackPosition to the AudiobookSession document.
	•	Generation Queue: Chapters are queued for TTS generation sequentially. Each chapter's status transitions: pending → generating → complete (or error). Failed chapters can be retried individually.
B. URL-Driven State
Next.js params and searchParams drive the current active project, chapter, and view:
	•	/project/[projectId]?chapter=[chapterId] — Editor
	•	/project/[projectId]/brainstorm — Brainstorm
	•	/project/[projectId]/codex — Codex
	•	/project/[projectId]/audiobook — Audiobook Studio
	•	/project/[projectId]/publish — Publish This enables bookmarkable deep-links.

8. Import System 🆕
A. Supported Formats
	•	.docx (Microsoft Word): Converted to HTML via mammoth.js.
	•	.md (Markdown): Parsed to HTML via marked or remark.
	•	.txt (Plain Text): Wrapped in <p> tags, preserving paragraph breaks.
B. Import Flow
	1	User clicks "Import Manuscript" on the Dashboard or inside a Project.
	2	File picker accepts .docx, .md, .txt (max file size: 10 MB).
	3	File is processed client-side (no server upload needed).
	4	Chapter Detection:
	◦	For .docx: Split on Heading 1 (<h1>) elements. Each H1 becomes a chapter title; content until the next H1 becomes chapter content.
	◦	For .md: Split on # (H1 Markdown headers). Same logic.
	◦	For .txt: Split on --- (horizontal rule) or triple newlines. If no delimiters found, the entire file becomes a single chapter.
	◦	Fallback: If no chapter boundaries are detected, present the user with a manual split interface: a scrollable preview with clickable "Split Here" markers every ~2,000 words.
	5	Preview Step: Before committing, user sees a list of detected chapters with titles and word counts. They can rename, reorder, merge, or split chapters.
	6	Commit: Batch-writes all chapters to Firestore. Each chapter gets a ChapterVersion with source: 'import'.
	7	Post-Import: Toast: "Imported [N] chapters ([X] words). Review your chapter list."
C. Import into Existing Project
When importing into a project that already has chapters, new chapters are appended after the last existing chapter (order continues from maxOrder + 1). Warning toast: "This will add [N] new chapters to your project. Existing chapters will not be modified."

9. Version History System 🆕
A. User-Facing Behavior
	•	Access Point: "History" icon button in the Editor toolbar for the active chapter.
	•	Version List Panel: Slides in from the right. Shows a reverse-chronological list of versions with: timestamp, word count, source badge (Autosave, Manual Save, AI Generation, Import), and pinned status (📌 icon).
	•	Preview: Clicking a version shows a read-only preview in the editor area with a diff highlight (additions in green, deletions in red strikethrough) compared to the current content.
	•	Restore: "Restore this version" button replaces the current chapter content with the selected version's content. The current content is saved as a new version (with source: 'manual') before the restore, so restoration is always non-destructive.
	•	Pin: Toggle pin on a version to exempt it from auto-pruning. Maximum 5 pinned versions per chapter. Attempting to pin a 6th shows toast: "Maximum 5 pinned versions. Unpin one first."
	•	Manual Save: A "Save Snapshot" button in the Editor toolbar creates a version with source: 'manual' on demand.
B. Automatic Version Creation
Versions are created automatically on:
	•	Every autosave (debounced, so roughly every 2+ seconds of idle after typing).
	•	Every AI generation that modifies the chapter content.
	•	Every import.
	•	Every version restore.

10. Style Consistency Engine 🆕
A. Purpose
Ensures AI-generated prose matches the author's established voice, preventing the "ChatGPT voice" problem where AI output feels generic and tonally mismatched.
B. Analysis Pipeline
	1	Input: All chapter content in the project with ≥ 500 words each (minimum 3 qualifying chapters to trigger).
	2	Metrics Computed (client-side text analysis, no AI call required):
	◦	avgSentenceLength: Mean word count per sentence.
	◦	vocabularyLevel: Distribution of word syllable counts → classified as simple (< 1.4 avg), moderate (1.4–1.8), literary (> 1.8).
	◦	povConsistency: Pronoun frequency analysis to detect dominant POV.
	◦	tenseUsage: Verb tense detection for dominant tense.
	◦	dialogueRatio: Ratio of text within quotation marks to total text.
	3	Output: Stored in project.styleProfile.
C. User Controls
	•	Style Profile Panel: Accessible from Project Settings. Shows computed metrics with plain-language explanations (e.g., "Your average sentence is 14 words — concise and punchy.").
	•	Override Toggle: User can disable style enforcement per-generation if they want the AI to write freely.
	•	Manual Adjustments: User can nudge individual metrics (e.g., set vocabulary to "literary" even if their existing prose is "moderate") to intentionally evolve their style.

11. Continuity Checker (The Archivist — Active Mode) 🆕
A. Purpose
Proactively detects factual contradictions within the manuscript, surfacing them as alerts rather than requiring the author to manually cross-reference.
B. Detection Categories
	•	Character Attributes: Physical descriptions (eye color, height, scars), abilities, relationships.
	•	Timeline/Chronology: Events referenced as happening "last week" that conflict with established timeline.
	•	Location Details: A room described as having a window in Chapter 3 but being windowless in Chapter 10.
	•	World Rules: Magic systems, technology constraints, or physical laws established in-world.
C. Alert Lifecycle
	1	Created: After a chapter save triggers a continuity check and the AI finds an issue.
	2	Open: Visible in the Alerts panel. Badge count shown on chapter navigator.
	3	Dismissed: User reviews and determines it's intentional or a false positive. Alert is hidden but retained in Firestore.
	4	Resolved: User edits the text to fix the inconsistency. Alert can be manually marked resolved.
D. UI Spec
	•	Badge: Orange dot with count on the chapter list item in the navigator sidebar.
	•	Alert Card: Glass card in the Alerts panel showing: severity icon (⚠️ warning / 🔴 critical), message, source excerpt (collapsed by default, expandable), flagged excerpt, and action buttons ("Dismiss", "Go to Source Chapter", "Mark Resolved").
	•	Empty State: "No continuity issues detected. Keep writing!" with a green checkmark icon.

12. Series Bible (Cross-Project Continuity) 🆕
A. Purpose
High-throughput authors write series. Entities, lore, and world rules must persist across multiple books (projects) without manual re-entry.
B. User Flow
	1	Create Series: From the Dashboard, user creates a Series with a title and description.
	2	Add Projects: Existing or new projects can be assigned to a Series via Project Creation wizard or Project Settings. A project can belong to only one Series.
	3	Shared Entities: Within a Series, entities can be flagged as "Shared." Shared entities appear in the Codex of every project in the series, marked with a "Series" badge.
	4	Cross-Project Context: When The Loom assembles context for a chapter in Book 3, it can optionally include high-level synopses from Books 1 and 2 (stored as synopsis fields on those Project documents). This is toggled per-project in settings: "Include series context" checkbox.
C. Data Model
	•	Series document holds projectIds (ordered) and sharedEntityIds.
	•	Shared entities live under the first project in the series but are readable by all projects in the series via a Firestore query filtered by isShared: true and the series' entity IDs.
	•	Security: The isProjectOwner function validates ownership. Since all projects in a series belong to the same userId, cross-project reads are safe.

13. Tool & Agent Delegation (Persona Matrix)
AI capabilities are divided into five distinct "Personas" to provide specialized assistance based on the user's current route.
Persona
Role
Location
Focus
System Prompt Prefix
The Muse
Brainstormer
/brainstorm
Outlines, plot twists, world-building ideas.
"You are a creative writing consultant specializing in story structure and genre conventions..."
The Novelist
Writer
/project/[id]
Prose generation, dialogue, sensory expansion. Constrained by Style Profile when available.
"You are a ghostwriter. Match the author's voice precisely. [Style constraints injected here]..."
The Archivist
Librarian / Checker
/codex & background
Entity management, continuity checking, lore consistency.
"You are a continuity editor with perfect recall. Track every fact, attribute, and timeline detail..."
The Narrator
Performer
/audiobook
Voice cloning, narration pacing, audio preparation, chapter-to-speech generation.
"You are an audiobook director. Optimize text for spoken narration..."
The Publisher
Launchpad
/publish
Blurbs, metadata, export formatting (Markdown, HTML, PDF, EPUB).
"You are a publishing assistant specializing in book metadata and marketing copy..."

14. Detailed User Flows & Screen Specs
A. Login (/login) 🆕
	•	Layout: Centered glass card on --surface-primary background. Novello logo above.
	•	Elements: "Sign in with Google" button (following Google branding guidelines). Email/password form below with "Sign Up" toggle.
	•	Error States: Invalid credentials → inline error below the field in Destructive color. Network failure → toast: "Unable to connect. Check your internet."
	•	Post-Login: Redirect to Dashboard.
B. Dashboard (Home Node) (/dashboard)
	•	Layout: Top navigation bar (logo, settings gear, sign-out). Main area: Series section (if any exist) → Project card grid.
	•	Visuals: Glass navigation tiles, project cards with hover-glow effects, activity feed with staggered animations (max 8 items animated, remainder instant).
	•	Features:
	◦	Project Creation: 3-step wizard modal:
	1	Title & Genre (text input + genre dropdown: Fantasy, Sci-Fi, Romance, Thriller, Literary Fiction, Non-Fiction, Other).
	2	Premise (textarea, max 500 characters). This is the "North Star" synopsis.
	3	🆕 Series Assignment (optional — dropdown of existing Series, or "Create New Series", or "Standalone"). Initial AI Goal setting (optional text field).
	◦	🆕 Import Manuscript: Button opens file picker → Import Flow (Section 8).
	◦	🆕 Series Management: Section above project grid showing Series as grouped headers. Clicking a Series title expands/collapses its projects. "Create Series" button to create a new empty series.
	◦	Analytics: Cumulative word count chart (via recharts or Chart.js — line chart, x-axis: date, y-axis: total words). Daily streak counter (consecutive days with ≥ 100 words written). Both displayed in a collapsible "Stats" panel at the top of the dashboard.
	◦	Project List: Card grid (glass cards) with search input (filters by title) and genre dropdown filter. Each card shows: title, genre badge, word count, chapter count, last-edited relative timestamp (e.g., "2 hours ago"). Click → navigate to Editor.
	•	Empty State (New User): Centered SVG illustration + text: "Welcome to Novello. Create your first project or import an existing manuscript." Two buttons: "New Project" and "Import Manuscript."
	•	Empty State (No projects matching filter): "No projects match your search." with a "Clear Filters" link.
C. Brainstorm (Blueprint Area) (/project/[id]/brainstorm)
	•	Layout: Workspace with three tabs: Outline (Standard), Whiteboard (Infinite Canvas), Mind Map (Visual Nodes).
	•	Outline Tab (Primary):
	1	User sees the project's Premise displayed at the top (editable inline).
	2	Below: textarea for additional instructions to The Muse (e.g., "I want a three-act structure with a false climax in act 2").
	3	"Generate Outline" button → AI returns a structured chapter list as JSON: [{ title: string, synopsis: string }].
	4	Results render as a draggable list of chapter cards (title + synopsis preview, editable inline).
	5	User can: reorder (drag-and-drop), edit titles/synopses inline, delete individual chapters, add blank chapters manually.
	6	"Apply Outline" button → Confirmation modal: "This will create [N] chapters in your project. Existing chapters will not be affected." → Batch-write to Firestore creating all chapter documents.
	•	Whiteboard Tab:
	◦	Infinite canvas powered by a canvas rendering library (e.g., tldraw or reactflow).
	◦	Freeform placement of text nodes, sticky notes, connector arrows.
	◦	Nodes can be promoted to chapters via right-click context menu → "Convert to Chapter."
	◦	Canvas state persisted to Firestore as a JSON blob on the Project document: brainstormCanvas: string (serialized canvas state).
	◦	Pan: Click-drag on empty space. Zoom: Scroll wheel or pinch gesture. Select: Click node. Multi-select: Shift-click or drag-select box.
	•	Mind Map Tab:
	◦	Tree-structured node graph radiating from a central "Premise" node.
	◦	Click a node to expand children. Double-click to edit node text.
	◦	AI-assisted expansion: Select a node → "Expand with AI" button → The Muse generates 3–5 child nodes (sub-plots, scene ideas, character moments).
	◦	Nodes can be promoted to chapters via context menu.
	◦	Tree state persisted to Firestore as JSON on the Project document: brainstormMindMap: string.
	•	Empty State (no outline): Premise and generation form visible by default, with instructional text: "Describe your story premise above, then click Generate Outline to get started."
D. Editor (Write Area) (/project/[id]?chapter=[chapterId])
	•	Layout: Three-column: Left sidebar (Chapter Navigator), Center (TipTap Editor), Right sidebar (Context Panel — collapsible).
	•	Chapter Navigator (Left Sidebar):
	◦	Scrollable list of chapters ordered by order field.
	◦	Each item shows: chapter number, title (truncated to 1 line), status badge (draft/review/final — color-coded), word count, 🆕 continuity alert badge (orange dot with count, if alerts exist).
	◦	Click to switch chapters. Active chapter highlighted with Accent Primary left border.
	◦	Drag to reorder. Optimistic UI: reorder reflected immediately; Firestore batch-update of order fields runs in background. On failure, revert order and toast: "Reorder failed. Please try again."
	◦	"+" button at bottom to create a new blank chapter.
	•	Editor Area (Center):
	◦	TipTap editor with Merriweather font at 18px, line-height 1.8. Max-width 720px centered for comfortable reading line length.
	◦	Toolbar: Bold, Italic, Heading levels (H1–H3), Blockquote, Bullet List, Ordered List, Undo/Redo, 🆕 "Save Snapshot" (manual version), 🆕 "History" (version panel), Word Count display, SyncIndicator.
	◦	Empty Chapter State: If content is empty, center the "Write with AI" button (gradient border animation, see CSS spec in Section 2). Clicking sends the chapter synopsis + Rolling Context + Style Profile to The Novelist. AI output streams into the editor.
	◦	Inline Assist (Prose Surgeon):
	▪	Select text → floating toolbar appears above selection with options:
	▪	"Polish" — Improves prose quality while preserving meaning.
	▪	"Shorten" — Reduces word count by ~30%.
	▪	"Expand" — Adds sensory detail and interiority.
	▪	"Rephrase" — Alternative phrasing, same meaning.
	▪	Trace Mode: Selection → "Trace" button → AI analyzes selection for passive voice, repetitive sentence starts, adverb overuse. Results shown as inline annotations (underlined with tooltip explanations).
	▪	🆕 Each Inline Assist action creates a ChapterVersion before modifying content, ensuring the user can always undo via History.
	◦	Manual Export: Floating action button (FAB) in bottom-right corner. Click → dropdown: "Export as Markdown", "Export as HTML", "Export as PDF", "Export as EPUB". Status spinner during generation → Download link on completion.
	•	Context Panel (Right Sidebar — collapsible):
	◦	🆕 Rolling Context: Shows the assembled context string (chapter summaries) being fed to the AI. Read-only, for transparency. Expandable/collapsible sections per chapter.
	◦	Entity Quick-View: Lists entities appearing in the current chapter (based on appearances array). Click to view/edit in a slide-over panel without leaving the editor.
	◦	🆕 Continuity Alerts: Lists open alerts for this chapter (see Section 11).
	◦	🆕 Prompt Inspector: Expandable section showing the full system prompt + context + style constraints that will be sent with the next AI call. Power users can review and understand what the AI "sees."
	◦	🆕 Style Profile Summary: Compact display of current style metrics with a link to full Style Profile in settings.
	•	Keyboard Shortcuts:
	◦	Cmd/Ctrl + S: Manual save snapshot (creates version).
	◦	Cmd/Ctrl + Shift + A: Open inline assist on current selection.
	◦	Cmd/Ctrl + ←/→: Previous/Next chapter.
	◦	Cmd/Ctrl + Shift + H: Toggle version history panel.
E. Codex (Library Area) (/project/[id]/codex)
	•	Layout: Filter bar at top (Type dropdown: All, Character, Location, Item, Lore + Search input). Below: Masonry grid of Entity glass cards.
	•	Entity Card: Shows name, type badge (color-coded: Character = cyan, Location = green, Item = amber, Lore = purple), description preview (2 lines truncated), appearance count badge.
	•	Entity Detail: Click card → slide-over panel with full editable fields:
	◦	Name (text input)
	◦	Type (dropdown)
	◦	Description (textarea)
	◦	Appearance (markdown editor — physical details for Characters, visual details for Locations)
	◦	Motivations (markdown editor — Characters only, hidden for other types)
	◦	Lore (markdown editor)
	◦	Relationship Mapping: Section showing linked entities. Each relationship shows: target entity name (clickable), relationship type, description. "Add Relationship" button → modal with entity search/select + relationship type input (freeform text, e.g., "Sibling of", "Located in", "Wielder of") + optional description.
	◦	Appearances (read-only list of linked chapters — click to navigate to that chapter in the Editor).
	•	Create Entity: "+" FAB → form with same fields as detail panel.
	•	Shared Entities: If the project belongs to a Series, shared entities are shown with a "Series" badge overlay on the card. Edits to shared entities propagate across all projects in the series.
	•	Empty State: Centered text: "No entities yet. Create characters, locations, and lore to build your world bible." + "Create Entity" button.
F. Audiobook (Studio Area) (/project/[id]/audiobook)
	•	Layout: Full-width workspace divided into three sections: Voice Selection (top), Chapter Queue (left), Player/Waveform (right/bottom).
	•	Voice Selection:
	◦	Dropdown of available Piper voices (bundled with the app or downloaded).
	◦	🆕 "My Voice Clones" section showing user's custom voice clones with status badges (Sampling, Training, Ready, Failed).
	◦	"Clone New Voice" button → opens Voice Cloning flow (see below).
	•	Chapter Queue:
	◦	List of all chapters with generation status: ⏳ Pending, 🔄 Generating (with progress spinner), ✅ Complete (with duration), ❌ Error (with "Retry" button).
	◦	"Generate All" button starts sequential generation from first pending chapter.
	◦	"Generate Selected" for individual chapters.
	◦	Drag to reorder the generation queue.
	•	Player / Waveform:
	◦	Waveform Display: Rendered via WaveSurfer.js. Amplitude waveform (not spectrogram) with: inactive region in --text-secondary color, played region in --accent-primary color. Click anywhere on waveform to seek.
	◦	Player Controls: Glass-morphism dark grey bar. Play/Pause, Skip Back 15s, Skip Forward 15s, Chapter Previous/Next, Speed selector (0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×), Volume slider.
	◦	Progress Sync: Playback position saved to AudiobookSession.playbackPosition every 30 seconds and on pause/stop. On reload, playback resumes from last saved position.
	◦	Download: "Download Chapter Audio" (individual WAV/MP3) and "Download Full Audiobook" (concatenated MP3 with chapter markers).
	•	Voice Cloning Flow:
	1	User clicks "Clone New Voice" → modal opens.
	2	User names the voice (text input, e.g., "Deep Male Narrator").
	3	User records or uploads a voice sample (minimum 30 seconds, maximum 5 minutes).
	▪	Record: Microphone access → real-time spectrogram visualization (see CSS spec in Section 2, using Web Audio API AnalyserNode, frequency-domain, dark blue → cyan → yellow → red color map). Recording timer displayed.
	▪	Upload: File picker for WAV/MP3 (max 20 MB).
	4	Sample is uploaded to Firebase Storage.
	5	Voice clone document created with status: 'training'.
	6	Piper fine-tuning process runs (via local Piper binary or API route). Status updates poll every 10 seconds.
	7	On completion: status: 'ready'. Toast: "Voice clone '[name]' is ready to use."
	8	On failure: status: 'failed'. Toast: "Voice cloning failed. Try recording a clearer sample." + "Retry" button.
	•	Empty State (no audio generated): "Select a voice and click 'Generate All' to create your audiobook." Chapter queue visible but all items show ⏳ Pending.
G. Publish (Launchpad) (/project/[id]/publish)
	•	Layout: Glass card sections for each export/publish task, stacked vertically.
	•	Features:
	◦	Blurb Generator: Textarea showing current project synopsis. "Generate Blurb" button → AI (The Publisher) generates a 150-word marketing blurb based on the full manuscript context. User can edit inline, regenerate (new blurb replaces current), or accept. Accepted blurb is saved to a blurb field on the Project document.
	◦	Metadata Form: Title, Author Name, Genre, Keywords (comma-separated tag input), Language dropdown (ISO 639-1 codes), ISBN (optional text input). Saved to Project document.
	◦	Export Options:
	▪	Markdown: Concatenates all chapters in order as a .md file with # Chapter Title headers. Immediate download.
	▪	HTML: Same structure rendered as styled HTML with embedded CSS (Merriweather font, configurable light/dark theme). Immediate download.
	▪	PDF: Generated via a headless rendering pipeline (e.g., Puppeteer rendering the HTML export, or a library like pdf-lib). Includes: title page (title, author, genre), table of contents with page numbers, chapter title pages, body text in Merriweather 12pt with 1-inch margins, page numbers in footer. Generation may take 10–30 seconds for large manuscripts — show progress bar.
	▪	EPUB: Generated via epub-gen or equivalent. Includes: OPF metadata (title, author, language, ISBN), NCX/NAV table of contents, chapter XHTML files with embedded CSS, cover image (if uploaded to Firebase Storage). Validates against EPUB 3.0 spec.
	◦	Export Status: Each export button shows a spinner during generation, then transforms into a "Download [format]" link on completion. Failed exports show toast with error message and "Retry" button.
H. Settings (/settings)
	•	AI Configuration:
	◦	Provider Toggle: Radio buttons: "Ollama (Local)" / "Gemini (Cloud)". Active provider is highlighted.
	◦	Ollama Settings:
	▪	"Scan Models" button pings http://localhost:11434/api/tags. On success, populates a dropdown with available model names. On failure, inline error: "Could not connect to Ollama at localhost:11434. Make sure Ollama is running."
	▪	Default model dropdown (populated by scan).
	◦	Gemini Settings:
	▪	API Key input field (type: password, with show/hide toggle). Saved to encrypted localStorage (or environment variable in self-hosted setups). Never sent to Firestore.
	▪	Model name (default: gemini-pro).
	◦	Temperature Slider: Range 0.0–2.0, step 0.1, default 0.7. Label: "Lower = more predictable, Higher = more creative."
	•	🆕 Style Profile: Displays computed style metrics for the active project with plain-language explanations. Override toggles for each metric. "Disable Style Enforcement" master toggle.
	•	Account: Display name, email (read-only from auth provider), Sign Out button.
	•	🆕 Data Management:
	◦	"Export All Data" button → downloads a JSON file containing all projects, chapters, entities, series, and settings for the authenticated user.
	◦	"Delete Account" button → confirmation modal requiring typed confirmation ("DELETE") → deletes all Firestore data and Firebase Auth account. Irreversible.

15. AI Failure Cascade & Error Handling 🆕
A. AI Provider Failure Modes
Failure
Detection
User Impact
Recovery
Ollama server not running
Connection Watcher ping fails
AI buttons show disabled state with tooltip: "AI unavailable — Start Ollama." If Gemini key configured, auto-fallback with toast.
User starts Ollama; next ping re-enables AI. Or user switches to Gemini.
Ollama model not loaded
Ollama returns 404 on model name
Toast: "Model [name] not found. Run ollama pull [name] or select a different model in Settings."
User pulls model or changes selection.
Request timeout (> 60s)
AbortController timeout
Toast: "AI request timed out. The model may still be loading. Try again."
User retries.
Malformed AI response
JSON parse failure or missing expected fields
Toast: "AI returned an unexpected response. Try again." Logged to console.
Retry. If persistent, suggest switching models.
Context window exceeded
Provider returns context length error
Toast: "Your context is too large for this model. Try a model with a larger context window."
User switches model or reduces context in settings.
Gemini rate limit (429)
HTTP 429 response
Auto-retry with exponential backoff (2s, 4s, 8s). After 3 failures → toast: "Gemini rate limit reached. Wait a moment or switch to Ollama."
Wait and retry, or switch provider.
Gemini API key invalid
HTTP 401/403 response
Toast: "Gemini API key is invalid. Check your key in Settings."
User corrects API key.
Network failure during AI call
Fetch error / network timeout
Toast: "Network error during AI request. Check your connection."
User checks connectivity and retries.
B. Firestore Failure Modes
Failure
Detection
User Impact
Recovery
Offline
Firebase SDK offline detection + navigator.onLine
SyncIndicator turns Blue. Toast: "You're offline. Changes saved locally and will sync when you reconnect."
Automatic sync on reconnect via Firestore offline persistence.
Write failure (online)
Firestore promise rejection
SyncIndicator turns Red. Auto-retry 3× with backoff (2s, 4s, 8s). After 3 failures: persistent toast with "Retry" button.
User clicks retry or refreshes.
Permission denied
Firestore security rule rejection (PERMISSION_DENIED)
Toast: "Permission denied. Please sign in again." Redirect to /login.
Re-authentication.
Document too large
Client-side size check before write (> 900 KB)
Toast: "This chapter is too large to save ([X] KB / 900 KB max). Consider splitting it into two chapters." Autosave paused until content size is reduced.
User splits content or removes large embedded content.
C. Connection Watcher (🔧 Improved from v20)
	•	Target: http://localhost:11434/api/tags (Ollama health endpoint).
	•	Interval: Every 15 seconds (reduced from 60s in v20 for faster recovery detection).
	•	State: Exposed via useAI hook as ollamaStatus: 'connected' | 'disconnected' | 'checking'.
	•	UI: Small status dot in the bottom-left corner of the app. Green = connected. Red = disconnected. Pulsing grey = checking. Clicking it opens Settings > AI Configuration.

16. Resilience & Stability Layer
	1	Global Error Boundary: Wraps the entire app. On unhandled error: renders a fallback UI with a generic error message ("Something went wrong"), a "Reload" button, and an "Emergency Repair" button (clears localStorage, sessionStorage, and IndexedDB, then reloads). Full error details logged to browser console.
	2	Optimistic UI (OUI): Chapter reordering, status changes, and entity updates are reflected instantly in the UI. Firestore sync runs in background. On failure: revert the UI change, show a toast explaining the failure.
	3	Firestore Offline Persistence: Enabled at app initialization (enableIndexedDbPersistence). All reads and writes work offline via the local IndexedDB cache. Sync occurs automatically when connectivity resumes.
	4	🆕 Content Backup (Last Resort): On every autosave, the current chapter content is also written to localStorage keyed by chapter:{chapterId}:backup. This provides recovery if Firestore and its offline cache both fail. On editor load, if Firestore content is empty but a localStorage backup exists, prompt: "We found unsaved content for this chapter. Would you like to restore it?" with "Restore" and "Discard" buttons.
	5	Connection Watcher: See Section 15C.

17. Deletion Cascade Rules 🆕
When deleting entities at various levels, the following cascade operations must execute atomically (Firestore batch writes):
A. Delete a Chapter
	1	Delete the Chapter document.
	2	Delete all ChapterVersion documents in the chapter's versions subcollection.
	3	Remove the chapter's entry from project.contextRollup.chapterSummaries.
	4	Remove the chapter's ID from all Entity appearances arrays in the project.
	5	Recompute order for all remaining chapters (close the gap — no sparse ordering).
	6	Update project.chapterCount and project.wordCount (subtract deleted chapter's word count).
	7	Delete all ContinuityAlert documents referencing this chapterId.
	8	If audiobook audio exists for this chapter, delete the Firebase Storage file and update the AudiobookSession.chapters array.
B. Delete an Entity
	1	Delete the Entity document.
	2	If the entity isShared and belongs to a Series, remove its ID from series.sharedEntityIds.
	3	Delete all ContinuityAlert documents referencing this entityId.
	4	Remove the entity from any other entity's relationships array where it appears as targetEntityId.
C. Delete a Project
	1	Delete all Chapters (and their Versions) in the project.
	2	Delete all Entities in the project.
	3	Delete all ContinuityAlert documents in the project.
	4	Delete all AudiobookSession documents in the project (and associated Firebase Storage audio files).
	5	If the project belongs to a Series, remove its ID from series.projectIds.
	6	Delete the Project document.
	7	Confirmation: Requires the user to type the project title to confirm. Modal text: "This will permanently delete '[Title]' and all its chapters, entities, audio, and history. This cannot be undone."
D. Delete a Series
	1	Unlink all projects from the series (set project.seriesId = null on each).
	2	Set isShared = false on all shared entities (they remain in their original project but are no longer cross-project visible).
	3	Delete the Series document.
	4	Confirmation: Requires typing the series title. Modal text: "This will unlink all projects from '[Title]'. Projects and their content will not be deleted."
E. Delete a Voice Clone
	1	Delete the Firebase Storage voice sample file.
	2	Delete the local Piper model file (if exists).
	3	Delete the VoiceClone document.
	4	If any AudiobookSession references this voiceModelId, update those sessions to have no voice selected and toast: "The voice clone used for this audiobook was deleted. Please select a new voice."

18. Performance Considerations 🆕
A. Firestore Read Optimization
	•	Context Engine: Reads project.contextRollup (1 read) instead of scanning all chapter subcollection documents (N reads). This is the single most important optimization in the data model.
	•	Chapter List: The chapter navigator sidebar requires reading all chapter documents to display titles, order, status, and word counts. For projects within the 200-chapter enforced limit, this is ~200 reads on project load. Cached by Firestore SDK thereafter; subsequent updates arrive via onSnapshot listener.
	•	Entity List: Same pattern. 500-entity limit keeps reads bounded.
	•	Listener Strategy: Use Firestore onSnapshot real-time listeners for: (1) the active chapter document, (2) the active project document. Chapter list and Entity list use one-time getDocs fetch on project load, refreshed on create/delete events.
B. Editor Performance
	•	Large Documents: TipTap/ProseMirror handles documents up to ~100,000 words well. The 900 KB content limit prevents pathological cases.
	•	AI Streaming: Tokens are appended to the TipTap document one at a time via insertContent. Batch DOM updates using requestAnimationFrame to prevent jank during fast token streams.
C. Audiobook Performance
	•	TTS Generation: Piper runs locally and is CPU-bound. Large chapters (10,000+ words) may take 30–60 seconds. Generation runs in a Web Worker or Node.js child process to avoid blocking the UI thread.
	•	Audio Storage: Generated audio files can be large (10–50 MB per chapter). Firebase Storage handles this, but download/playback uses streaming (HTTP Range requests) to avoid loading entire files into memory.

19. Empty States (Complete List) 🆕
Every list-based view must have a defined empty state. No blank screens.
View
Empty State Content
Actions
Dashboard (no projects)
SVG illustration + "Welcome to Novello. Create your first project or import an existing manuscript."
"New Project", "Import Manuscript" buttons
Dashboard (no series)
Series section hidden entirely. No "empty series" message needed.
—
Dashboard (filter yields nothing)
"No projects match your search."
"Clear Filters" link
Brainstorm (no outline)
Premise + generation form visible by default with instructional text.
"Generate Outline" button
Brainstorm Whiteboard (empty canvas)
Faint grid background + centered text: "Double-click to add a note."
Double-click creates first node
Brainstorm Mind Map (empty)
Central "Premise" node auto-created from project synopsis.
Click node to expand
Editor (no chapters)
Full-screen: "This project has no chapters yet. Go to Brainstorm to generate an outline, or create a chapter manually."
"Go to Brainstorm", "Create Chapter" buttons
Editor (empty chapter)
"Write with AI" centered button (gradient animation).
Click triggers AI generation
Codex (no entities)
"No entities yet. Create characters, locations, and lore to build your world bible."
"Create Entity" button
Codex (filter yields nothing)
"No entities match your filter."
"Clear Filters" link
Version History (no versions)
"No version history yet. Versions are created automatically as you write."
—
Continuity Alerts (none)
"No continuity issues detected. Keep writing!" + green checkmark icon.
—
Audiobook (no audio)
"Select a voice and click 'Generate All' to create your audiobook."
Voice selector + "Generate All" button
Audiobook (no voice clones)
"No custom voices yet." within the "My Voice Clones" section.
"Clone New Voice" button
Publish (no blurb)
Synopsis shown in textarea.
"Generate Blurb" button
Settings (no models found)
"No models detected. Make sure Ollama is running, then click Scan."
"Scan Models" button

20. Concurrent Editing & Conflict Resolution 🆕
A. Same User, Multiple Devices
Novello is a single-user product (no collaboration in v1), but a user may have the app open on multiple devices simultaneously.
B. Conflict Strategy
	•	Active Chapter Lock: When a user opens a chapter for editing, a lockedBy: { deviceId: string, lockedAt: Timestamp } field is set on the Chapter document. The deviceId is a randomly generated UUID stored in sessionStorage (unique per browser tab).
	•	Lock Check on Open: When opening a chapter, check the lockedBy field. If locked by a different deviceId and lockedAt is less than 5 minutes ago:
	◦	Show warning: "This chapter is being edited in another session. Opening it here may cause conflicts. Continue anyway?"
	◦	If user continues, both sessions can edit. Last-write-wins with version history as the safety net.
	•	Lock Heartbeat: Every 2 minutes, the active editing session refreshes lockedAt. If a session closes or crashes without releasing the lock, the lock expires after 5 minutes.
	•	Lock Release: On chapter navigation away or tab close (beforeunload), clear the lockedBy field.

21. Prompt Architecture Reference 🆕
This section documents the full prompt templates used by each Persona. These are the system prompts injected before the user's request.
A. The Muse (Brainstorm)
You are a creative writing consultant specializing in story structure, genre conventions, and narrative tension.

PROJECT CONTEXT:
- Title: {project.title}
- Genre: {project.genre}
- Premise: {project.synopsis}
- Existing chapters: {contextRollup.chapterSummaries (titles only)}

INSTRUCTIONS:
- Generate a structured chapter outline as a JSON array: [{"title": "...", "synopsis": "..."}]
- Each synopsis should be 2-3 sentences describing the key events and emotional arc of the chapter.
- Respect genre conventions for {project.genre}.
- Ensure rising tension and satisfying pacing across the full outline.
- Do not repeat plot points across chapters.

USER REQUEST:
{userInput}
B. The Novelist (Prose Generation)
You are a ghostwriter. Your sole job is to write prose that sounds like it was written by this specific author. You are invisible — the reader should never detect AI involvement.

STYLE CONSTRAINTS (derived from the author's existing chapters):
{styleProfile constraints — see Section 10}

STORY CONTEXT:
- Genre: {project.genre}
- Previous chapters summary: {contextRollup — truncated to token budget}
- Current chapter synopsis: {chapter.synopsis}
- Relevant entities: {entities with descriptions}

INSTRUCTIONS:
- Continue the narrative from where the previous content ends.
- Maintain the established POV, tense, and voice.
- Include sensory details appropriate to the scene.
- Advance the plot according to the chapter synopsis.
- Do not summarize or tell — show through action and dialogue.

{userInput or "Write the next section of this chapter."}
C. The Archivist (Continuity Check)
You are a continuity editor with perfect recall. Your job is to find factual contradictions in a manuscript.

ENTITY DATABASE:
{all entities with full descriptions, appearances, motivations, relationships}

PRIOR CHAPTER SUMMARIES:
{contextRollup.chapterSummaries for all chapters before the current one}

CURRENT CHAPTER CONTENT:
{chapter.content — full text}

INSTRUCTIONS:
- Compare every factual claim in the current chapter against the entity database and prior chapter summaries.
- Look for contradictions in: physical descriptions, character abilities, timeline/chronology, location details, world rules/magic systems, relationship statuses.
- Return a JSON array of findings:
  [{"type": "characterAttribute|timeline|settingDetail|contradiction", "severity": "warning|critical", "message": "Human-readable description", "sourceChapterId": "...", "sourceExcerpt": "...", "flaggedExcerpt": "..."}]
- Return an empty array [] if no contradictions found.
- Do NOT flag intentional character development or unreliable narrator techniques as contradictions.
- Only flag clear factual inconsistencies.
D. The Narrator (Audiobook Prep)
You are an audiobook director. Your job is to optimize written text for spoken narration.

INSTRUCTIONS:
- Review the provided chapter text.
- Suggest SSML annotations or pacing markers where appropriate (pauses after dramatic moments, emphasis on key dialogue).
- Flag any text that would sound awkward when read aloud (e.g., complex parentheticals, visual formatting that doesn't translate to audio).
- Return the optimized text ready for TTS processing.

CHAPTER TEXT:
{chapter.content}
E. The Publisher (Blurb/Metadata)
You are a publishing assistant specializing in book metadata and marketing copy.

PROJECT:
- Title: {project.title}
- Genre: {project.genre}
- Full synopsis: {project.synopsis}
- Chapter summaries: {contextRollup.chapterSummaries}

INSTRUCTIONS:
- Generate a compelling back-cover blurb of approximately 150 words.
- Hook the reader in the first sentence.
- Introduce the protagonist and central conflict without spoiling the resolution.
- End with a question or cliffhanger that compels the reader to buy.
- Match the tone to the genre (e.g., urgent for thrillers, whimsical for fantasy, steamy for romance).

22. Accessibility Requirements 🆕
	•	Keyboard Navigation: All interactive elements reachable via Tab. Focus ring visible (see Section 2). Editor supports standard text editing shortcuts.
	•	Screen Reader: Semantic HTML throughout. ARIA labels on icon-only buttons. Live regions for toast notifications and SyncIndicator state changes.
	•	Color Contrast: All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) against dark surfaces. Status colors (Green/Gold/Red/Blue) are paired with icons or text labels, never color-alone.
	•	Motion Sensitivity: Respect prefers-reduced-motion media query. When active: disable all animations (spring transitions, stagger-children, gradient-shift on Write with AI button). Transitions become instant.
	•	Focus Management: When modals open, focus is trapped inside the modal. On close, focus returns to the triggering element. On page navigation, focus moves to the main content area.
