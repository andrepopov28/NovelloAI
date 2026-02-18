# Product Requirements Document (PRD) v20.0
## Project: Novello AI — The Autonomous Publisher
**Version:** 20.0 (The "Deep-Link" Comprehensive Specification)  
**Status:** DRAFT FOR ANALYTICAL REVIEW  
**Architect:** Antigravity (Google DeepMind)

---

## 1. Executive Summary & Philosophy
Novello AI is a premium, AI-first manuscript development platform designed for high-throughput authors. Unlike traditional text editors, Novello is a **context-aware ecosystem** where the AI acts as a collaborative agent rather than a passive tool.

### Core Philosophy: "The Integrated Mind"
1.  **Context is King**: The AI never generates in a vacuum. It is fed a "Rolling Context" (summaries of previous chapters) and a "World Bible" (Entity data).
2.  **Visual Excellence**: The interface must feel premium, using glassmorphism and modern dark mode aesthetics to reduce cognitive strain during long writing sessions.
3.  **Local-First Hybrid**: Integration with local LLMs (Ollama) ensures privacy and speed, with cloud fallbacks (Gemini) for high-reasoning tasks.
4.  **Atomic Consistency**: Data models, UI components, and state logic are strictly mapped to ensure no drift between the database and the rendered view.

---

## 2. Visual Blueprint ("Stitch" Design System)
The UI follows a "Luxury Apple Dark" aesthetic, prioritizing depth, translucency, and vibrant but controlled accents.

### A. Design Tokens
-   **Surfaces**:
    -   `--surface-primary`: `#09090b` (The deep stage)
    -   `--surface-secondary`: `#121215` (Cards and sidebars)
    -   `--glass-bg`: `rgba(18, 18, 21, 0.8)` with `blur(20px)`
-   **Typography**:
    -   **UI**: `Inter` (Sans-serif) for high legibility in menus and controls.
    -   **Manuscript**: `Merriweather` (Serif) for a classic, immersive writing feel.
-   **Color Palette (HSL Tailored)**:
    -   **Accent (Primary)**: `cyan-500` (Novello Blue) — Used for active states and "The Muse".
    -   **Accent (Warm)**: `golden-bronze` (`#b8860b`) — Used for "The Journalist/Novelist" and premium navigation.
    -   **Destructive**: `rose-500` — Used for deletions and errors.
-   **Animations**:
    -   `--transition-spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy, premium-feeling UI transitions.
    -   `stagger-children`: 50ms interval fades for list loading.

---

## 3. Technology Stack & Language
-   **Frontend**: Next.js 15 (App Router), React 19.
-   **Language**: TypeScript (Strict Mode) — Essential for data model integrity.
-   **Styling**: Vanilla CSS (Global Tokens) — Modular and flexible without the overhead of heavy utility frameworks.
-   **Editor Core**: Tiptap (ProseMirror-based) for a headless, highly customizable rich-text experience.
-   **Backend**: 
    -   **Firebase Firestore**: NoSQL document store for real-time collaboration.
    -   **Firebase Storage**: For cover images and audio assets.
-   **AI Engine**: Custom `useAI` hook wrapping local Ollama API (`v1/chat/completions`) and Google Gemini Pro.

---

## 4. Data Architecture
### Firestore Structures
All documents include `userId` for strict security rule validation (`request.auth.uid == resource.data.userId`).

#### A. Projects (`/projects/{projectId}`)
```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  genre: string;
  synopsis: string; // The "North Star" premise
  settings: {
    aiProvider: 'ollama' | 'gemini';
    modelName: string; // Dynamic based on scan
  };
  wordCount: number;
  createdAt: Timestamp;
}
```

#### B. Chapters (`/projects/{projectId}/chapters/{chapterId}`)
```typescript
interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string; // HTML format from TipTap
  synopsis: string; // AI-generated during Brainstorm phase
  order: number;
  status: 'draft' | 'review' | 'final';
  lastSummary: string; // Cached for "The Loom" context engine
}
```

#### C. Entities (`/projects/{projectId}/entities/{entityId}`)
```typescript
interface Entity {
  id: string;
  name: string;
  type: 'Character' | 'Location' | 'Item' | 'Lore';
  description: string;
  appearances: string[]; // Tracked chapter IDs
}
```

---

## 5. State Management & Synchronicity
Novello uses a **Decentralized Multi-Hook Architecture** to manage complexity.

1.  **`useAutoSave`**: Debounced sync (2000ms delay) that manages the "Dirty State" and Firestore updates. Shows a "SyncIndicator" (Gold/Green/Red).
2.  **`useAI`**: Resolves LLM configuration hierarchically: `Project Settings` -> `LocalStorage Defaults` -> `Hardcoded Fallbacks`.
3.  **`useContextEngine` (The Loom)**: Scans all `Chapter.lastSummary` fields and compiles a prioritized context string for the prompt injector.
4.  **URL-Driven State**: Next.js `params` and `searchParams` drive the current active chapter and node focus, allowing for shared deep-links.

---

## 6. Tool & Agent Delegation (Persona Matrix)
AI capabilities are divided into five distinct "Personas" to provide specialized assistance based on the user's current route.

| Persona | Role | Location | Focus |
| :--- | :--- | :--- | :--- |
| **The Muse** | Brainstormer | `/brainstorm` | Outlines, plot twists, world-building ideas. |
| **The Novelist** | Writer | `/project/[id]` | Prose generation, dialogue, sensory expansion. |
| **The Archivist** | Librarian | `/codex` | Continuity, entity tracking, lore consistency. |
| **The Narrator** | Performer | `/audiobook` | Voice cloning, narration pacing, audio prep. |
| **The Publisher** | Launchpad | `/publish` | Blurbs, metadata, export formatting (PDF/EPUB). |

---

## 7. Detailed User Flows & Screen Specs

### A. Dashboard (Home Node)
-   **Visuals**: Premium-glass navigation tiles, project cards with hover-glow effects, activity feed with staggered animations.
-   **Features**:
    -   **Project Creation**: 3-step wizard (Title & Genre -> Premise -> Initial Goal).
    -   **Analytics**: Cumulative word count chart (recharts/chart.js), daily streak counter.
    -   **Project List**: Card grid with search and genre filtering.

### B. Brainstorm (Blueprint Area)
-   **Visuals**: Clean, focused workspace with three tabs: **Outline (Standard)**, **Whiteboard (Infinite canvas style)**, **Mind Map (Visual nodes)**.
-   -   **Outline Flow**:
    1.  User enters **Premise** and **Genre** in a high-contrast textarea.
    2.  AI (**The Muse**) generates a structured Chapter List with `title` and `synopsis`.
    3.  User can drag-and-drop to reorder chapters before applying.
    4.  **Confirm & Apply**: Triggers a batch-write to Firestore, creating all chapter documents instantly.

### C. Editor (Write Area)
-   **Visuals**: Focused distraction-free environment. Sidebar (Left: Navigator, Right: Context/AI).
-   **Interaction Flow**:
    -   **Chapter Switching**: Instant navigation via sidebar. Content is fetched from Firestore and hydrated into TipTap.
    -   **Auto-Write (Initial)**: If the editor `isEmpty`, a holographic "Write with AI" button appears in the center. Clicking it sends the chapter `synopsis` to **The Novelist**.
    -   **Inline Assist (Prose Surgeon)**:
        -   Selection -> Context Menu -> "Polish", "Shorten", "Professional".
        -   **Trace Mode**: AI analyzes the selection for passive voice or repetitive sentence starts.
    -   **Manual Export**: Floating action button (FAB) for PDF/EPUB export with status spinner.

### D. Codex (Library Area)
-   **Visuals**: Masonry grid of Entity cards. Filterable by Type (Character, Location, etc.).
-   **Data Spec**:
    -   **Rich Profiles**: Entities have markdown fields for "Appearance", "Motivations", "Lore".
    -   **Relationship Mapping**: Future-state spec where Entities can be linked (e.g., Character A "Sibling of" Character B).

### E. Audiobook (Studio Area)
-   **Visuals**: Professional waveforms, dark grey player bar with glassmorphism.
-   **Specs**:
    -   **Piper Integration**: High-fidelity local TTS.
    -   **Progress Sync**: Audio playback position is saved to the user's session state.
    -   **Voice Cloning**: Spectrogram visualization during sampling.

### F. Settings
-   **Model Discovery**: "Scan Models" button pings `/api/ai/health` to list available local LLMs.
-   **Credential Management**: Secure field for Gemini API key (persisted to environment variables or encrypted state).

---

## 8. Resilience & Stability Layer
1.  **Global Error Boundary**: Wraps the Entire App. Prevents white-screens of death by offering an "Emergency Repair" button (clears cache).
2.  **Optimistic UI (OUI)**: Chapter reordering is reflected instantly in UI; sync happens in background. Rollback on failure.
3.  **Connection Watcher**: Real-time monitor for Ollama's local server (pinging every 60s).
