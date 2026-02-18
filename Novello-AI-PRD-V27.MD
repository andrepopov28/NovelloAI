# Novello AI — Product Requirements Document (PRD) v27
## The Definitive Specification — Clean Slate Edition

**Status:** AUTHORITATIVE BUILD SPEC  
**Architect:** Antigravity (Google DeepMind)  
**Purpose:** This document is the single, exhaustive source of truth for the Novello AI platform. It synthesizes all prior PRD versions (V21–V26) into one clean, forward-looking specification. No prior build iterations are referenced. Build from this document alone.

---

## 0. Executive Summary & Philosophy

Novello AI is an **AI-first manuscript development platform** for high-throughput authors. Unlike traditional text editors, Novello is a context-aware ecosystem where the AI acts as a **collaborative agent** — not a passive tool or chat widget.

### Core Philosophy: "The Integrated Mind"

| Pillar | Description |
|--------|-------------|
| **Context is King** | The AI never generates in a vacuum. Every prompt is enriched with a Rolling Context (denormalized chapter summaries) and a World Bible (entity data). |
| **Visual Excellence** | The interface uses the "Cupertino Luxury Minimalism" design system — generous whitespace, premium typography, subtle glassmorphism, and micro-animations. |
| **Local-First Hybrid** | Ollama (local LLM) ensures privacy and speed. Gemini (cloud) handles high-reasoning tasks. The system degrades gracefully between providers. |
| **Atomic Consistency** | Data models, UI components, and state logic are strictly mapped. No drift between the database and the rendered view. |
| **Writer Safety** | Version history, autosave integrity, IndexedDB offline fallback, and import capabilities ensure no user work is ever lost. |
| **Voice Fidelity** | The Style Consistency Engine ensures AI-generated prose matches the author's established voice, preventing generic "AI voice" output. |

### Non-Negotiables

- **No lost work**: Autosave + versions + IndexedDB local fallback + restore path.
- **Context integrity**: Rolling context + entity world bible always injected via the Loom Context Engine.
- **Provider robustness**: Local-first Ollama, cloud fallback Gemini, graceful degradation.
- **Security correctness**: Firestore rules + server-side Firebase Admin SDK verification for all API routes.

### Out of Scope

- Marketplace, collaboration/real-time multi-user editing, payments, mobile native apps.

---

## 1. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript (Strict Mode) |
| Styling | Vanilla CSS (Global Tokens as CSS Custom Properties) |
| Editor | TipTap (ProseMirror-based, headless) |
| Backend | Firebase Auth + Firestore (offline persistence) + Firebase Storage |
| AI — Local | Ollama API (`v1/chat/completions`) |
| AI — Cloud | Google Gemini Pro (streaming API) |
| Audio | Piper TTS (local binary), WaveSurfer.js, Web Audio API |
| Import | mammoth.js (.docx), marked/remark (.md), native parser (.txt) |
| Charts | recharts or Chart.js |
| Icons | Lucide React |
| Security | firebase-admin (server-side token verification) |

---

## 2. Design System — Cupertino Luxury Minimalism

### 2.1 Principles

- **Whitespace**: Generous padding and breathing room. Never crowded.
- **Typography**: Inter (UI) + Georgia/Playfair Display (editorial/manuscript).
- **Colors**: Neutral dark grays, subtle accents, high contrast. Gold/silver brand accents.
- **Shadows**: Soft, layered shadows for depth. No harsh drop shadows.
- **Borders**: Hairline (0.5px–1px) or none. Never heavy outlines.
- **Glass effects**: `backdrop-filter: blur()` for nav, panels, and overlays.
- **Animations**: 60fps, 200–300ms transitions. Skeleton screens (not spinners) for loading.

### 2.2 Design Tokens (CSS Custom Properties)

```css
/* Surfaces */
--surface-primary: #09090b;          /* Deep stage / base background */
--surface-secondary: #121215;        /* Cards, sidebars, panels */
--surface-elevated: #1a1a1f;         /* Modals, dropdowns, popovers */
--glass-bg: rgba(18, 18, 21, 0.8);  /* backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06) */

/* Typography */
--font-sans: 'Inter', system-ui, sans-serif;  /* UI text, 14px base, line-height 1.5 */
--font-serif: 'Merriweather', Georgia, serif;  /* Manuscript text, 18px base, line-height 1.8 */

/* Color Palette (HSL Tailored) */
--accent-primary: hsl(190, 95%, 50%);   /* Cyan-500 — active states, AI highlights */
--accent-warm: hsl(38, 85%, 38%);       /* Golden Bronze — navigation, warm accents */
--color-success: hsl(142, 71%, 45%);    /* Save confirmed, sync complete */
--color-warning: hsl(38, 92%, 50%);     /* Dirty/unsaved state */
--color-destructive: hsl(347, 77%, 50%); /* Deletions, errors */
--text-primary: hsl(0, 0%, 93%);        /* Body text on dark surfaces */
--text-secondary: hsl(0, 0%, 55%);      /* Labels, captions, metadata */

/* Animations */
--transition-spring: cubic-bezier(0.34, 1.56, 0.64, 1) 300ms;  /* Bouncy UI transitions */
--transition-smooth: cubic-bezier(0.4, 0, 0.2, 1) 200ms;        /* Hover states, color transitions */
```

### 2.3 Interactive Element Standards

- **Minimum touch target**: 44px × 44px on all interactive elements.
- **Hover glow**: `box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.15)` with `--transition-smooth`.
- **Active state**: `transform: scale(0.97)` with `--transition-spring`.
- **Focus ring**: `2px solid var(--accent-primary)` with 2px offset. All interactive elements must be keyboard-navigable.
- **Stagger animations**: 50ms interval fade-in (`opacity 0→1`, `translateY 8px→0`). Max 8 items staggered; items 9+ render immediately.

### 2.4 Component Specs

#### Glass Card
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  transition: box-shadow var(--transition-smooth), transform var(--transition-spring);
}
.glass-card:hover { box-shadow: 0 0 24px rgba(var(--accent-rgb), 0.12); }
.glass-card:active { transform: scale(0.97); }
```

#### "Write with AI" Button (Editor Empty State)
Pulsing gradient border animation on a glass-card button, centered in the editor viewport.
```css
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
```

#### Audiobook Waveform
```css
.waveform-container { background: var(--surface-secondary); border-radius: 12px; padding: 16px; height: 120px; }
/* WaveSurfer.js: inactive region = --text-secondary, played region = --accent-primary. Click-to-seek enabled. */
```

#### Voice Cloning Spectrogram
```css
.spectrogram-container { background: var(--surface-primary); border-radius: 12px; padding: 16px; height: 200px; }
/* Web Audio API AnalyserNode. Color map: dark blue (low) → cyan → yellow → red (high). X: time, Y: freq 0–8kHz. */
```

### 2.5 Navigation Design

- **Top bar**: Fixed 80px height, glassmorphism background, centered module tabs.
- **Active state**: Subtle `rgba(255,255,255,0.08)` glass pill + 3px top accent bar.
- **Hover state**: `rgba(255,255,255,0.04)` + slight icon scale (1.1×).
- **Logo**: `NovelloLogo.tsx` SVG component (responsive, 42px container height). Gold/silver gradient isometric diamonds.
- **Tab layout**: Photorealistic 24×24 thumbnails + uppercase 11px labels.

### 2.6 Dashboard Design

- **Layout**: 2-column grid of hero module cards.
- **Cards**: Photorealistic background images at 50% opacity with multi-stop dark gradient overlay.
- **Hover**: `scale(1.02)` + shadow lift.
- **Hero images**: Write, Brainstorm, Data, Audiobook, Publish, Settings.

### 2.7 AI Chatbox Design

- **Position**: Fixed right panel, `top: var(--nav-height)`, z-index 99 (below nav at 100).
- **Width**: 450px default (maximized).
- **Header**: Full-width photorealistic persona banner (16:10 aspect ratio).
- **Overlay**: Gradient overlay + glass-blur label bar for agent name/role.
- **Thinking state**: Blue glow pulse animation.
- **Personas**: Route-aware persona switching.

### 2.8 Multi-Theme Appearance System

The application supports **9 themes** via a `ThemePicker` component. Each theme overrides all CSS custom properties. Theme persists to `localStorage('novello-theme')` and sets `data-theme` attribute on `<html>`.

#### Core Themes
| Theme | Surfaces | Accent | Font | Notes |
|-------|----------|--------|------|-------|
| **Dark Mode** (default) | Deep blacks `#09090b` | Cyan | Inter | `colorScheme: dark` |
| **Light Mode** | White | Cyan | Inter | `colorScheme: light` |
| **Swiss International** | Clean whites | Deep blue `#0038a8` | Helvetica Neue | No glass blur, sharp 2–4px radii |
| **Warm E-Ink** | Cream/parchment `#f5f0e8` | Burnt orange `#c0540c` | Charter/Georgia | Soft rounded radii |
| **Cupertino Glass** | Translucent whites (0.55 opacity) | iOS blue `#007aff` | SF Pro | 60px blur, 20–38px radii |

#### Immersive Themes
| Theme | Surfaces | Accent | Font | Notes |
|-------|----------|--------|------|-------|
| **Dark Academia** | Deep forest green `#1a2e1a` | Gold `#c5a44e` | Baskerville | `colorScheme: dark` |
| **Neo-Brutalist** | Pure white | Coral `#ff6b6b` | Courier New | 0px radii, hard offset shadows, 2–3px solid borders |
| **Cyber-Terminal** | Near-black `#050505` | Neon green `#39ff14` / cyan `#00e5ff` | JetBrains Mono | Glowing neon shadows, `colorScheme: dark` |

#### Editorial Themes
| Theme | Surfaces | Accent | Font | Notes |
|-------|----------|--------|------|-------|
| **High-Fashion Editorial** | White | Monochromatic black | Playfair Display | Minimal 0–8px radii |

**Implementation:**
- Hook: `useTheme.tsx` — `ThemeProvider` wraps app via `layout.tsx`. Exposes `theme`, `setTheme(t)`, `toggleTheme()`, `themeMeta`.
- Tokens: `globals.css` — Each theme is a `[data-theme="slug"]` selector block overriding all `--surface-*`, `--text-*`, `--accent-*`, `--glass-*`, `--border-*`, `--shadow-*`, `--radius-*`, `--font-sans`.
- Picker: `ThemePicker.tsx` — Palette icon in nav opens frosted dropdown. 3-column swatch grid grouped by category. Active theme shows checkmark. Dismisses on click-outside or Escape.
- Font loading: Google Fonts for JetBrains Mono and Playfair Display. System fonts for all others.

---

## 3. Authentication System

### 3.1 Providers
- **Google Sign-In (Primary)**: OAuth 2.0 via Firebase Authentication. One-tap sign-in on supported browsers.
- **Email/Password (Secondary)**: Email verification required before first project creation.

### 3.2 Session Management
- **Persistence**: `browserLocalPersistence` — user stays signed in across tabs and browser restarts.
- **Token Refresh**: Firebase SDK handles silently. On failure → redirect to `/login` with toast: "Your session has expired. Please sign in again."

### 3.3 Auth State Flow
1. App loads → Firebase `onAuthStateChanged` listener fires.
2. `user === null` → redirect to `/login`. No authenticated routes accessible.
3. `user !== null` → proceed to Dashboard. `userId` available globally via `useAuth` context.
4. Sign Out → clears Firebase auth state, clears localStorage AI config (not chapter backups), redirects to `/login`.

### 3.4 Protected Routes
All routes except `/login`, `/signup`, `/forgot-password` require authentication. Middleware checks auth state before rendering any page component. Unauthenticated requests return a redirect — never a flash of authenticated content.

---

## 4. Application Structure & Navigation

### 4.1 Route Hierarchy

```
├── /app                                  — Dashboard (project grid + module cards)
├── /project/[projectId]                  — Editor (write chapters)
│   ├── ?chapter=[chapterId]              — Active chapter in editor
│   ├── /brainstorm                       — Ideation + outlines
│   ├── /codex                            — Entities / world bible
│   ├── /continuity                       — Continuity alerts triage
│   ├── /audiobook                        — TTS generation + playback
│   ├── /publish                          — Export + metadata
│   └── /settings                         — Project-level settings
├── /series                               — Series list
│   └── /series/[seriesId]               — Series detail + shared entities
├── /settings                             — User settings
│   ├── /profile
│   ├── /ai
│   ├── /themes
│   ├── /storage
│   └── /security
└── Auth Flows
    ├── /login
    ├── /signup
    └── /forgot-password
```

### 4.2 Navigation Component (`GlobalNav.tsx`)
- Top bar with centered module tabs. Context-aware: dashboard nav on `/app`, project-specific nav within `/project/[id]`.
- Right controls: User avatar menu (sign out) + `ThemePicker`.
- Brand: `NovelloLogo.tsx` SVG, 42px container height, responsive.

---

## 5. Data Architecture (Firestore)

All documents include `userId` for security rule validation.

### 5.1 Projects (`/projects/{projectId}`)

```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  genre: 'Fantasy' | 'Sci-Fi' | 'Romance' | 'Thriller' | 'Literary Fiction' | 'Non-Fiction' | 'Other';
  synopsis: string;                    // The "North Star" premise (max 500 chars)
  seriesId: string | null;             // Links to parent Series (null if standalone)
  blurb: string | null;                // AI-generated marketing blurb (from Publish)
  brainstormCanvas: string | null;     // Serialized tldraw/reactflow canvas state
  brainstormMindMap: string | null;    // Serialized mind map tree state
  settings: {
    aiProvider: 'ollama' | 'gemini';
    modelName: string;                 // Dynamic based on scan
    temperature: number;               // 0.0–2.0, default 0.7
    includeSeriesContext: boolean;     // Include synopses from other series books in context
  };
  styleProfile: {
    avgSentenceLength: number;
    vocabularyLevel: 'simple' | 'moderate' | 'literary';
    povConsistency: string;            // e.g., "third-person limited"
    tenseUsage: string;                // e.g., "past tense"
    dialogueRatio: number;             // 0.0–1.0
  } | null;
  contextRollup: {                     // Denormalized summary cache (solves N+1 reads)
    chapterSummaries: Array<{
      chapterId: string;
      order: number;
      title: string;
      summary: string;
    }>;
    lastUpdated: Timestamp;
  };
  metadata: {                          // For Publish module
    authorName: string;
    keywords: string[];
    language: string;                  // ISO 639-1 code
    isbn: string | null;
  } | null;
  wordCount: number;
  chapterCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.2 Series (`/series/{seriesId}`)

```typescript
interface Series {
  id: string;
  userId: string;
  title: string;
  description: string;
  projectIds: string[];                // Ordered list of project IDs in the series
  sharedEntityIds: string[];           // Entity IDs visible across all projects in the series
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.3 Chapters (`/projects/{projectId}/chapters/{chapterId}`)

```typescript
interface Chapter {
  id: string;
  projectId: string;
  userId: string;                      // Duplicated for security rule validation on subcollections
  title: string;
  content: string;                     // HTML format from TipTap (max 900KB — enforced)
  synopsis: string;                    // AI-generated during Brainstorm phase
  order: number;
  status: 'draft' | 'review' | 'final';
  lastSummary: string;                 // Cached for Loom context engine
  wordCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.4 Chapter Versions (`/projects/{projectId}/chapters/{chapterId}/versions/{versionId}`)

```typescript
interface ChapterVersion {
  id: string;
  chapterId: string;
  userId: string;
  content: string;                     // Full HTML snapshot
  wordCount: number;
  source: 'autosave' | 'manual' | 'ai-generation' | 'import';
  isPinned: boolean;                   // Pinned versions exempt from auto-pruning
  createdAt: Timestamp;
}
```

**Retention Policy**: Keep last 50 versions per chapter. On version 51, delete oldest non-pinned. Users can pin up to 5 versions per chapter.

### 5.5 Entities (`/projects/{projectId}/entities/{entityId}`)

```typescript
interface Entity {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  type: 'Character' | 'Location' | 'Item' | 'Lore';
  description: string;
  appearance: string;                  // Markdown field
  motivations: string;                 // Markdown field (Characters only)
  lore: string;                        // Markdown field
  appearances: string[];               // Tracked chapter IDs
  relationships: Array<{
    targetEntityId: string;
    relationshipType: string;          // e.g., "Sibling of", "Located in", "Created by"
    description: string;
  }>;
  isShared: boolean;                   // If true, visible across all projects in the series
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5.6 Continuity Alerts (`/projects/{projectId}/alerts/{alertId}`)

```typescript
interface ContinuityAlert {
  id: string;
  projectId: string;
  userId: string;
  chapterId: string;                   // Chapter where inconsistency was detected
  entityId: string | null;
  type: 'contradiction' | 'timeline' | 'characterAttribute' | 'settingDetail';
  severity: 'warning' | 'critical';
  message: string;
  sourceChapterId: string;             // Earlier chapter with the "canonical" fact
  sourceExcerpt: string;
  flaggedExcerpt: string;
  status: 'open' | 'dismissed' | 'resolved';
  createdAt: Timestamp;
}
```

### 5.7 Audiobook Sessions (`/projects/{projectId}/audiobook/{sessionId}`)

```typescript
interface AudiobookSession {
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
```

### 5.8 Voice Clones (`/users/{userId}/voiceClones/{cloneId}`)

```typescript
interface VoiceClone {
  id: string;
  userId: string;
  name: string;
  sampleStoragePath: string;
  piperModelPath: string | null;
  status: 'sampling' | 'training' | 'ready' | 'failed';
  createdAt: Timestamp;
}
```

### 5.9 Document Limits (Enforced)

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| Projects per user | 50 | Checked on create; toast error if exceeded |
| Chapters per project | 200 | Checked on create |
| Entities per project | 500 | Checked on create |
| Chapter content size | 900 KB | Validated before Firestore write; warning toast at 800 KB |
| Versions per chapter | 50 (+ 5 pinned) | Auto-pruned on new version save |
| Voice clones per user | 10 | Checked on create |

---

## 6. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isProjectOwner(projectId) {
      return request.auth != null &&
        get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
    }

    match /projects/{projectId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;

      match /chapters/{chapterId} {
        allow read: if isProjectOwner(projectId);
        allow create: if isProjectOwner(projectId)
                      && request.resource.data.userId == request.auth.uid
                      && request.resource.data.projectId == projectId;
        allow update: if isProjectOwner(projectId) && request.resource.data.userId == request.auth.uid;
        allow delete: if isProjectOwner(projectId);

        match /versions/{versionId} {
          allow read: if isProjectOwner(projectId);
          allow create: if isProjectOwner(projectId) && request.resource.data.userId == request.auth.uid;
          allow update: if isProjectOwner(projectId);  // For pinning/unpinning only
          allow delete: if isProjectOwner(projectId);
        }
      }

      match /entities/{entityId} {
        allow read: if isProjectOwner(projectId);
        allow create: if isProjectOwner(projectId) && request.resource.data.userId == request.auth.uid;
        allow update: if isProjectOwner(projectId) && request.resource.data.userId == request.auth.uid;
        allow delete: if isProjectOwner(projectId);
      }

      match /alerts/{alertId} {
        allow read, create, update, delete: if isProjectOwner(projectId);
      }

      match /audiobook/{sessionId} {
        allow read, create, update, delete: if isProjectOwner(projectId);
      }
    }

    match /series/{seriesId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    match /users/{userId}/voiceClones/{cloneId} {
      allow read, create, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    match /{document=**} {
      allow read, write: if false;  // Default deny
    }
  }
}
```

---

## 7. API Route Registry

All Next.js API routes must verify the Firebase ID token server-side using the Firebase Admin SDK. Unauthenticated requests are rejected with HTTP 401.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST (SSE) | Streaming AI generation (Ollama or Gemini) |
| `/api/ai/continuity` | POST | Background continuity check |
| `/api/export/epub` | POST | EPUB 3.0 generation via epub-gen-memory |
| `/api/export/html` | POST | Styled HTML export (print-ready) |
| `/api/ollama/ping` | GET | Check Ollama server availability |
| `/api/voice/train` | POST | Initiate Piper voice clone training |
| `/api/voice/tts` | POST | Generate TTS audio for a chapter |

---

## 8. State Management — Decentralized Multi-Hook Architecture

### 8.1 `useAuth`
Global context providing `user`, `userId`, `isLoading`, `signIn()`, `signOut()`. Wraps Firebase `onAuthStateChanged`.

### 8.2 `useAutoSave`

- **Debounce**: 2000ms after last keystroke.
- **Payload Capture**: On invocation, captures a snapshot of `{ chapterId, content, wordCount }` at debounce-trigger time. The Firestore write uses this captured `chapterId` — not the currently active chapter ID — preventing cross-chapter data clobbering on rapid navigation.
- **Dependency Correctness**: The `save` callback's dependency array includes `user` to prevent stale closure bugs.
- **Abort on Navigate**: If the user switches chapters while a debounce is pending, the pending debounce is cancelled. In-flight writes complete normally (they carry their own `chapterId`).
- **Version Creation**: Every autosave creates a `ChapterVersion` with `source: 'autosave'`. Pruning runs after write.
- **Context Rollup Sync**: If `lastSummary` changed since last save, update `project.contextRollup.chapterSummaries` in the same batch write.
- **SyncIndicator States**:
  - 🟡 Gold: Content dirty / unsaved.
  - 🟢 Green: Save confirmed by Firestore.
  - 🔴 Red: Save failed. Toast: "Save failed. Retrying..." Auto-retry 3× with exponential backoff (2s, 4s, 8s). After 3 failures: persistent toast: "Unable to save. Your work is preserved locally. Check your connection."
  - 🔵 Blue: Offline. Toast: "You're offline. Changes saved locally and will sync when you reconnect."

### 8.3 `useAI`

- **SSR Safety**: All `localStorage` reads guarded with `typeof window !== 'undefined'` checks.
- **Provider Resolution**: Hierarchical — Project Settings → LocalStorage Defaults → Hardcoded Fallbacks.
  - Ollama fallback: `llama3.2:latest`, temperature 0.7.
  - Gemini fallback: `gemini-pro`, temperature 0.7 (requires API key in settings).
- **Request Lifecycle**:
  1. Check provider connectivity.
  2. If Ollama unreachable → auto-fallback to Gemini (if key configured) with toast: "Ollama unavailable. Using Gemini." If no Gemini key → toast: "AI is unavailable. Ollama server not detected at localhost:11434."
  3. Send request with 60-second `AbortController` timeout.
  4. On timeout → Toast: "AI request timed out. The model may be loading. Try again."
  5. On Gemini 429 → Exponential backoff (2s, 4s, 8s). After 3 failures → toast: "Gemini rate limit reached."
  6. On malformed response → Log error. Toast: "AI returned an unexpected response."
  7. On context window exceeded → Toast: "Your context is too large for this model."
- **Output Sanitization**: All AI content sanitized via DOMPurify before TipTap insertion. Allowed tags: `p, br, em, strong, h1-h6, ul, ol, li, blockquote, span`.
- **Streaming**: Token-by-token via Ollama streaming endpoint or Gemini streaming API. "Stop Generating" button visible during streaming.

### 8.4 `useContextEngine` (The Loom)

- **Data Source**: Reads `project.contextRollup.chapterSummaries` — a single Firestore read. No subcollection scan.
- **Context Assembly**: Concatenates summaries for chapters with `order` < current chapter's order. Injects Entity descriptions for entities appearing in adjacent chapters (current ± 2).
- **Token Budget**: Max 2,000 tokens. Priority: (1) most recent 3 chapter summaries, (2) entities relevant to current chapter, (3) earlier summaries in reverse order, (4) style profile constraints.
- **Rollup Update**: Handled by `useAutoSave` — when a save includes a changed `lastSummary`, the rollup updates in the same batch write.

### 8.5 `useStyleProfile`

- **Trigger**: Runs when a project has ≥ 3 chapters with ≥ 500 words each. Re-runs when any chapter content changes significantly (> 20% word count delta from last analysis).
- **Computed Metrics** (client-side, no AI call):
  - `avgSentenceLength`: Mean word count per sentence.
  - `vocabularyLevel`: Syllable distribution → `simple` (<1.4 avg), `moderate` (1.4–1.8), `literary` (>1.8).
  - `povConsistency`: Pronoun frequency analysis.
  - `tenseUsage`: Dominant verb tense detection.
  - `dialogueRatio`: Ratio of text within quotation marks to total text.
- **Storage**: Written to `project.styleProfile`.
- **Prompt Injection** (when The Novelist generates prose):
  ```
  STYLE CONSTRAINTS (from author's existing chapters):
  - Average sentence length: [X] words. Vary naturally but maintain this center.
  - Vocabulary: [level]. Do not use words significantly above or below this register.
  - POV: [pov]. Maintain strictly.
  - Tense: [tense]. Do not switch unless the author has established tense shifts.
  - Dialogue ratio: approximately [X]% of prose should be dialogue.
  Prioritize matching the author's voice over literary flourish.
  ```

### 8.6 `useContinuityChecker`

- **Trigger**: Background task after each chapter save (debounced, 10-second delay after save confirmation).
- **Rate Limiting**: Max one continuity check per chapter per 5-minute window.
- **Process**:
  1. Sends saved chapter content + all Entity data + preceding chapter summaries to AI.
  2. System prompt: "You are a continuity editor with perfect recall. Compare the provided chapter against established facts from prior chapters and the entity database. Identify contradictions in: character physical descriptions, character abilities, timeline/chronology, location details, established world rules. Return a JSON array of findings or an empty array if none."
  3. Parses AI response. Creates `ContinuityAlert` documents for each finding.
- **Provider**: Prefers Gemini (larger context window). Falls back to Ollama if no Gemini key.

### 8.7 `useAudiobook`

- **Purpose**: Manages audiobook generation session state, playback position, and voice model selection.
- **Playback Sync**: Writes `playbackPosition` to `AudiobookSession` on pause and every 30 seconds during playback.
- **Generation Queue**: Sequential. Status transitions: `pending → generating → complete | error`. Failed chapters can be retried individually.

### 8.8 URL-Driven State

Next.js `params` and `searchParams` drive the active project, chapter, and view:
- `/project/[projectId]?chapter=[chapterId]` — Editor
- `/project/[projectId]/brainstorm` — Brainstorm
- `/project/[projectId]/codex` — Codex
- `/project/[projectId]/audiobook` — Audiobook Studio
- `/project/[projectId]/publish` — Publish

This enables bookmarkable deep-links.

---

## 9. AI Persona Matrix

AI capabilities are divided into five distinct Personas, each specialized for the user's current route.

| Persona | Role | Route | Focus | System Prompt Prefix |
|---------|------|-------|-------|----------------------|
| **The Muse** | Brainstormer | `/brainstorm` | Outlines, plot twists, world-building | "You are a creative writing consultant specializing in story structure and genre conventions..." |
| **The Novelist** | Writer | `/project/[id]` | Prose generation, dialogue, sensory expansion. Constrained by Style Profile. | "You are a ghostwriter. Match the author's voice precisely. [Style constraints injected here]..." |
| **The Archivist** | Librarian | `/codex` + background | Entity management, continuity checking, lore consistency | "You are a continuity editor with perfect recall. Track every fact, attribute, and timeline detail..." |
| **The Narrator** | Performer | `/audiobook` | Voice cloning, narration pacing, audio preparation | "You are an audiobook director. Optimize text for spoken narration..." |
| **The Publisher** | Launchpad | `/publish` | Blurbs, metadata, export formatting | "You are a publishing assistant specializing in book metadata and marketing copy..." |

---

## 10. Module Specifications

### 10.1 Login (`/login`)

- **Layout**: Centered glass card on `--surface-primary`. Novello logo above.
- **Elements**: "Sign in with Google" button (Google branding guidelines). Email/password form with "Sign Up" toggle.
- **Error States**: Invalid credentials → inline error in Destructive color. Network failure → toast: "Unable to connect. Check your internet."
- **Post-Login**: Redirect to `/app`.

### 10.2 Dashboard (`/app`)

- **Layout**: Top navigation bar. Main area: Series section (if any) → Module hero cards → Project card grid.
- **Module Hero Cards**: Write, Brainstorm, Data, Audiobook, Publish, Settings — each with photorealistic background image.
- **Project Creation Wizard** (3-step modal):
  1. Title & Genre (text input + genre dropdown).
  2. Premise (textarea, max 500 chars) — the "North Star" synopsis.
  3. Series Assignment (optional: existing Series, "Create New Series", or "Standalone") + Initial AI Goal (optional).
- **Import Manuscript**: Button opens file picker → Import Flow (Section 11).
- **Series Management**: Section above project grid showing Series as grouped headers. Expand/collapse. "Create Series" button.
- **Analytics Panel** (collapsible): Cumulative word count chart (line chart, x-axis: date, y-axis: total words). Daily streak counter (consecutive days with ≥ 100 words written).
- **Project Cards**: Glass cards with photorealistic background, search input (filter by title), genre dropdown filter. Each card shows: title, genre badge, word count, chapter count, last-edited relative timestamp.
- **Empty State (new user)**: "Welcome to Novello. Create your first project or import an existing manuscript." Two buttons: "New Project" and "Import Manuscript."
- **Empty State (no filter match)**: "No projects match your search." + "Clear Filters" link.

### 10.3 Brainstorm (`/project/[id]/brainstorm`)

Three tabs: **Outline**, **Whiteboard**, **Mind Map**.

**Outline Tab (Primary)**:
1. Project Premise displayed at top (editable inline).
2. Textarea for additional instructions to The Muse.
3. "Generate Outline" → AI returns `[{ title: string, synopsis: string }]` JSON.
4. Results render as draggable chapter cards (editable inline).
5. User can: reorder (drag-and-drop), edit, delete, add blank chapters.
6. "Apply Outline" → confirmation modal → batch-write chapters to Firestore.

**Whiteboard Tab**: Infinite canvas (tldraw or reactflow). Freeform text nodes, sticky notes, connector arrows. Nodes promotable to chapters via right-click. Canvas state persisted to `project.brainstormCanvas`. Pan: click-drag. Zoom: scroll wheel. Multi-select: Shift-click or drag-select.

**Mind Map Tab**: Tree graph from central "Premise" node. Click to expand, double-click to edit. "Expand with AI" → The Muse generates 3–5 child nodes. Nodes promotable to chapters. State persisted to `project.brainstormMindMap`.

**Empty State**: Premise and generation form visible by default.

### 10.4 Editor (`/project/[id]?chapter=[chapterId]`)

**Layout**: Three-column — Left sidebar (Chapter Navigator), Center (TipTap Editor), Right sidebar (Context Panel, collapsible).

**Chapter Navigator (Left)**:
- Scrollable list ordered by `order` field.
- Each item: chapter number, title (1-line truncated), status badge (color-coded), word count, continuity alert badge (orange dot with count).
- Click to switch. Active chapter: Accent Primary left border.
- Drag to reorder (optimistic UI; Firestore batch-update in background; revert on failure).
- "+" button to create new blank chapter.

**Editor Area (Center)**:
- TipTap with Merriweather 18px, line-height 1.8. Max-width 720px centered.
- Toolbar: Bold, Italic, H1–H3, Blockquote, Bullet List, Ordered List, Undo/Redo, "Save Snapshot", "History", Word Count, SyncIndicator.
- Empty chapter state: "Write with AI" button (gradient border animation). Click → sends synopsis + Rolling Context + Style Profile to The Novelist. Output streams into editor.
- AI Chatbox: Floating panel, 450px width, route-aware persona.
- **Inline Assist (Prose Surgeon)**: Select text → floating toolbar: "Polish", "Shorten" (~30% reduction), "Expand" (sensory detail), "Rephrase". "Trace" mode: AI analyzes for passive voice, repetitive sentence starts, adverb overuse → inline annotations with tooltip explanations. Each Inline Assist action creates a `ChapterVersion` before modifying content.
- **Manual Export FAB**: Bottom-right. Dropdown: "Export as Markdown", "Export as HTML", "Export as PDF", "Export as EPUB". Download filenames use sanitized project title.

**Context Panel (Right, collapsible)**:
- Rolling Context: Assembled context string (read-only, for transparency). Expandable/collapsible per chapter.
- Entity Quick-View: Entities appearing in current chapter. Click to view/edit in slide-over.
- Continuity Alerts: Open alerts for this chapter.
- Prompt Inspector: Full system prompt + context + style constraints for next AI call.
- Style Profile Summary: Compact metrics display.

**Keyboard Shortcuts**:
- `Cmd/Ctrl + S`: Manual save snapshot.
- `Cmd/Ctrl + Shift + A`: Open inline assist on selection.
- `Cmd/Ctrl + ←/→`: Previous/Next chapter.
- `Cmd/Ctrl + Shift + H`: Toggle version history panel.

### 10.5 Codex (`/project/[id]/codex`)

- **Layout**: Filter bar (Type dropdown: All, Character, Location, Item, Lore + Search input). Below: Masonry grid of Entity glass cards.
- **Entity Card**: Name, type badge (Character = cyan, Location = green, Item = amber, Lore = purple), description preview (2 lines), appearance count badge.
- **Entity Detail** (slide-over panel): Name, Type, Description, Appearance (markdown), Motivations (markdown, Characters only), Lore (markdown), Relationship Mapping (linked entities with type + description, "Add Relationship" button), Appearances (read-only linked chapters, click to navigate).
- **Create Entity**: "+" FAB.
- **Shared Entities**: "Series" badge overlay on shared entity cards. Edits propagate across all series projects.
- **Empty State**: "No entities yet. Create characters, locations, and lore to build your world bible." + "Create Entity" button.

### 10.6 Continuity (`/project/[id]/continuity`)

- **Layout**: Alert list with filter controls (severity, status, chapter).
- **Alert Card**: Severity icon (⚠️ warning / 🔴 critical), message, source excerpt (collapsed, expandable), flagged excerpt, action buttons: "Dismiss", "Go to Source Chapter", "Mark Resolved".
- **Empty State**: "No continuity issues detected. Keep writing!" with green checkmark.
- **Chapter Navigator Badge**: Orange dot with count on chapter list items with open alerts.

### 10.7 Audiobook (`/project/[id]/audiobook`)

**Layout**: Three sections — Voice Selection (top), Chapter Queue (left), Player/Waveform (right/bottom).

**Voice Selection**:
- Dropdown of available Piper voices.
- "My Voice Clones" section with status badges (Sampling, Training, Ready, Failed).
- "Clone New Voice" button.

**Chapter Queue**: Status per chapter: ⏳ Pending, 🔄 Generating (spinner), ✅ Complete (duration), ❌ Error ("Retry"). "Generate All" and "Generate Selected" buttons. Drag to reorder queue.

**Player / Waveform**:
- WaveSurfer.js amplitude waveform. Inactive: `--text-secondary`. Played: `--accent-primary`. Click-to-seek.
- Controls: Play/Pause, Skip ±15s, Chapter Prev/Next, Speed (0.5×–2×), Volume slider.
- Progress sync: every 30s + on pause. Resumes from last saved position on reload.
- Download: individual WAV/MP3 + full audiobook concatenated MP3 with chapter markers.

**Voice Cloning Flow**:
1. Name the voice.
2. Record (min 30s, max 5min) or upload WAV/MP3 (max 20MB).
3. Real-time spectrogram during recording (Web Audio API AnalyserNode, dark blue → cyan → yellow → red).
4. Upload to Firebase Storage → create VoiceClone doc (`status: 'training'`).
5. Piper fine-tuning runs. Status polls every 10 seconds.
6. On completion: `status: 'ready'`. Toast: "Voice clone '[name]' is ready to use."
7. On failure: `status: 'failed'`. Toast + "Retry" button.

### 10.8 Publish (`/project/[id]/publish`)

- **Blurb Generator**: Current synopsis displayed. "Generate Blurb" → The Publisher generates 150-word marketing blurb. User can edit, regenerate, or accept. Saved to `project.blurb`.
- **Metadata Form**: Title, Author Name, Genre, Keywords (comma-separated tag input), Language (ISO 639-1 dropdown), ISBN (optional). Saved to `project.metadata`.
- **Export Options**:
  - **Markdown**: All chapters concatenated with `# Chapter Title` headers. Immediate download.
  - **HTML**: Styled HTML with embedded CSS (Merriweather font, configurable theme). Immediate download.
  - **PDF**: Print-ready styled HTML (`.html` extension) with embedded fonts and page-break CSS. Future: true server-side PDF via Puppeteer (title page, TOC, chapter pages, Merriweather 12pt, 1-inch margins, page numbers).
  - **EPUB**: via epub-gen-memory. OPF metadata, NCX/NAV TOC, chapter XHTML, embedded CSS, cover image. EPUB 3.0 compliant. Filename: sanitized project title.
- **Export Status**: Spinner during generation → "Download [format]" link on completion. Failed: toast + "Retry".

### 10.9 Settings (`/settings`)

**AI Configuration**:
- Provider toggle: "Ollama (Local)" / "Gemini (Cloud)".
- Ollama: "Scan Models" button pings `http://localhost:11434/api/tags`. Populates model dropdown. On failure: "Could not connect to Ollama at localhost:11434."
- Gemini: API Key input (password, show/hide toggle). Saved to localStorage. Never sent to Firestore.
- Temperature slider: 0.0–2.0, step 0.1, default 0.7.

**Style Profile**: Computed metrics with plain-language explanations. Override toggles per metric. "Disable Style Enforcement" master toggle.

**Themes**: ThemePicker with all 9 themes.

**Account**: Display name, email (read-only), Sign Out.

**Data Management**:
- "Export All Data" → JSON file with all projects, chapters, entities, series, settings.
- "Delete Account" → confirmation modal (type "DELETE") → deletes all Firestore data + Firebase Auth account. Irreversible.

---

## 11. Import System

### 11.1 Supported Formats
- `.docx`: Converted to HTML via mammoth.js.
- `.md`: Parsed to HTML via marked or remark.
- `.txt`: Wrapped in `<p>` tags, preserving paragraph breaks.

### 11.2 Import Flow
1. User clicks "Import Manuscript" (Dashboard or Project).
2. File picker: `.docx`, `.md`, `.txt` (max 10 MB).
3. Client-side processing (no server upload needed).
4. **Chapter Detection**:
   - `.docx`: Split on `<h1>` elements. Each H1 → chapter title.
   - `.md`: Split on `#` (H1 headers).
   - `.txt`: Split on `---` or triple newlines. If no delimiters → entire file = one chapter.
   - **Fallback**: Manual split interface — scrollable preview with clickable "Split Here" markers every ~2,000 words.
5. **Preview Step**: List of detected chapters with titles and word counts. User can rename, reorder, merge, or split.
6. **Commit**: Batch-write all chapters to Firestore. Each chapter gets a `ChapterVersion` with `source: 'import'`.
7. Toast: "Imported [N] chapters ([X] words). Review your chapter list."

### 11.3 Import into Existing Project
New chapters appended after last existing chapter (`order` continues from `maxOrder + 1`). Warning toast: "This will add [N] new chapters to your project. Existing chapters will not be modified."

---

## 12. Version History System

### 12.1 User-Facing Behavior
- **Access**: "History" icon button in Editor toolbar.
- **Version List Panel**: Slides in from right. Reverse-chronological list with: timestamp, word count, source badge (Autosave / Manual Save / AI Generation / Import), pinned status (📌).
- **Preview**: Read-only preview with diff highlight (additions in green, deletions in red strikethrough) vs. current content.
- **Restore**: "Restore this version" → current content saved as new version (`source: 'manual'`) before restore. Always non-destructive.
- **Pin**: Toggle pin to exempt from auto-pruning. Max 5 pinned per chapter. Toast on 6th attempt: "Maximum 5 pinned versions. Unpin one first."
- **Manual Save**: "Save Snapshot" button in toolbar → `source: 'manual'`.

### 12.2 Automatic Version Creation
Versions created automatically on:
- Every autosave.
- Every AI generation that modifies chapter content.
- Every import.
- Every version restore.

---

## 13. Style Consistency Engine

### 13.1 Purpose
Prevents "ChatGPT voice" — AI output that feels generic and tonally mismatched to the author's established style.

### 13.2 Analysis Pipeline
- **Trigger**: ≥ 3 chapters with ≥ 500 words each. Re-runs on >20% word count delta.
- **Metrics** (client-side, no AI call): `avgSentenceLength`, `vocabularyLevel`, `povConsistency`, `tenseUsage`, `dialogueRatio`.
- **Output**: Stored in `project.styleProfile`.

### 13.3 User Controls
- **Style Profile Panel** (in Settings): Computed metrics with plain-language explanations.
- **Override Toggle**: Disable style enforcement per-generation.
- **Manual Adjustments**: Nudge individual metrics to intentionally evolve style.

---

## 14. Continuity Checker (The Archivist)

### 14.1 Detection Categories
- Character Attributes: Physical descriptions, abilities, relationships.
- Timeline/Chronology: Events that conflict with established timeline.
- Location Details: Contradictory room/place descriptions across chapters.
- World Rules: Magic systems, technology constraints, physical laws.

### 14.2 Alert Lifecycle
1. **Created**: After chapter save triggers continuity check and AI finds an issue.
2. **Open**: Visible in Alerts panel. Badge count on chapter navigator.
3. **Dismissed**: User determines it's intentional or false positive. Hidden but retained.
4. **Resolved**: User edits text to fix. Manually marked resolved.

---

## 15. Series Bible (Cross-Project Continuity)

### 15.1 Purpose
Entities, lore, and world rules persist across multiple books (projects) without manual re-entry.

### 15.2 User Flow
1. Create Series from Dashboard (title + description).
2. Assign projects to Series via Project Creation wizard or Project Settings. One Series per project.
3. Flag entities as "Shared" → visible in Codex of every project in the series with "Series" badge.
4. Cross-Project Context: Loom can optionally include synopses from other books in the series (toggled per-project via `settings.includeSeriesContext`).

### 15.3 Data Model
- Series document holds `projectIds` (ordered) and `sharedEntityIds`.
- Shared entities readable across projects via Firestore query filtered by `isShared: true`.
- **Delete Cascade**: When a Series is deleted, all shared entities are unshared (`isShared: false`) before the Series document is removed.

---

## 16. AI Failure Cascade & Error Handling

| Failure | Detection | User Impact | Recovery |
|---------|-----------|-------------|----------|
| Ollama server not running | Connection Watcher ping fails | AI buttons disabled with tooltip: "AI unavailable — Start Ollama." Auto-fallback to Gemini if key configured. | Start Ollama; next ping re-enables. Or switch to Gemini. |
| Ollama model not loaded | Ollama returns 404 | Toast: "Model [name] not found. Run `ollama pull [name]` or select a different model in Settings." | Pull model or change selection. |
| Request timeout (>60s) | AbortController timeout | Toast: "AI request timed out. The model may be loading. Try again." | Retry. |
| Malformed AI response | JSON parse failure | Toast: "AI returned an unexpected response. Try again." Logged to console. | Retry or switch models. |
| Context window exceeded | Provider returns context length error | Toast: "Your context is too large for this model. Try a model with a larger context window." | Switch model or reduce context. |
| Gemini rate limit (429) | HTTP 429 | Auto-retry: 2s, 4s, 8s. After 3 failures → toast: "Gemini rate limit reached. Wait or switch to Ollama." | Wait and retry, or switch provider. |
| Gemini API key invalid | HTTP 401/403 | Toast: "Gemini API key is invalid. Check your key in Settings." | Correct API key. |
| Network failure | Fetch error | Toast: "Network error during AI request. Check your connection." | Check connectivity and retry. |

### Global Error Boundary
A React error boundary wraps the entire application. Uncaught errors render a fallback UI: "Something went wrong. Reload the page." with a "Reload" button. Error details logged to console.

---

## 17. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Editor usable at 200 chapters, 900KB/chapter cap. 60fps animations. |
| Reliability | Autosave retries + IndexedDB offline fallback + version history. |
| Accessibility | WCAG AA compliance. All interactive elements keyboard-navigable. Min 44px touch targets. |
| Observability | Global error boundary + console logging. |
| Loading | Skeleton screens (not spinners) for all async data. |
| Animations | 200–300ms transitions. Max 8 staggered items. |
| SSR Safety | All `localStorage` reads guarded with `typeof window !== 'undefined'`. |

---

## 18. Key File Registry

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Design tokens + CSS custom properties + theme blocks |
| `src/app/layout.tsx` | Root layout with ThemeProvider + AuthProvider |
| `src/components/layout/GlobalNav.tsx` | Top navigation bar |
| `src/components/layout/AIChatbox.tsx` | AI assistant panel with persona system |
| `src/components/dashboard/ModuleCard.tsx` | Dashboard hero cards |
| `src/components/ui/NovelloLogo.tsx` | Brand logo (SVG, responsive) |
| `src/components/ui/ThemePicker.tsx` | Theme selection widget |
| `src/lib/firebase.ts` | Firebase client SDK initialization |
| `src/lib/firebase-admin.ts` | Server-side Firebase Admin SDK |
| `src/lib/hooks/useAuth.ts` | Authentication hook |
| `src/lib/hooks/useAutoSave.ts` | Autosave + version creation hook |
| `src/lib/hooks/useAI.ts` | AI provider abstraction hook |
| `src/lib/hooks/useContextEngine.ts` | Loom context assembly hook |
| `src/lib/hooks/useStyleProfile.ts` | Style fingerprint analysis hook |
| `src/lib/hooks/useContinuityChecker.ts` | Background continuity check hook |
| `src/lib/hooks/useAudiobook.ts` | Audiobook session management hook |
| `src/lib/hooks/useTheme.ts` | Theme management hook |

---

## 19. Asset Directory

| Path | Contents |
|------|----------|
| `/public/images/modules/` | Module hero images (write, brainstorm, data, audiobook, publish, settings) |
| `/public/images/personas/` | AI persona banner images (muse, novelist, archivist, narrator, publisher) |
| `/public/images/avatars/` | User/agent avatar images |

---

## 20. Monetization Architecture (Pricing-Ready Gate)

v27 ships without billing but includes a pricing-ready gate architecture:

| Tier | Projects | AI Calls/Day | Features |
|------|----------|--------------|----------|
| **Free** | 2 | Limited | Core editor, basic export |
| **Pro** | Unlimited | Unlimited | Import/export, continuity, audiobook, series |

Gate checks are enforced at the API route level and on Firestore write operations. Billing integration (Stripe or equivalent) is a future milestone.

---

## 21. Acceptance Criteria

| Criterion | Definition of Done |
|-----------|-------------------|
| ✅ Visual Excellence | Apple-grade "Cupertino Luxury Minimalism" aesthetic fully implemented across all routes. |
| ✅ Performance | 60fps animations, instant interactions, editor usable at 200 chapters. |
| ✅ Consistency | Unified design language across dashboard, navigation, editor, and chatbox. |
| ✅ Security | All API routes server-side authenticated. Firestore rules enforced. |
| ✅ Reliability | Autosave + IndexedDB fallback + version history. No lost work. |
| ✅ Usability | Intuitive, minimal learning curve. WCAG AA accessible. |
| ✅ Delight | Micro-interactions: hover scale, glass effects, persona transitions, streaming AI. |
| ✅ Writer Safety | Version history, restore, pin, manual snapshot, import with preview. |
| ✅ AI Quality | Style profile injection, continuity checking, persona-aware system prompts. |
| ✅ Export | EPUB 3.0, HTML, Markdown exports with sanitized project title filenames. |
