# Novello AI — PRD V34.1
**Status:** Production-Ready (Local-First Build Complete)  
**Supersedes:** V33  
**Last Updated:** 2026-03-23  
**Build Commit:** (Current)  

---

## 1. SYSTEM CONTEXT & CORE PHILOSOPHY

Novello AI is an AI-native manuscript development platform. The AI acts as a "World-Aware" co-author with direct read/write access to the manuscript and character database. The platform is designed around a **"Skeuomorphic Luxurious Fashionable Book Publisher"** aesthetic — featuring premium ivory/cream backgrounds, gold accents, and embossed components.

### 1.1 Definition of Done (All Criteria Met ✅)

| Criterion | Status |
|---|---|
| Sync Reliability: Offline support & word counts | ✅ Cloud Function & IDB Offline Sync |
| State Safety: AI/User cannot edit simultaneously | ✅ GENERATING state locks editor |
| Context Depth: AI has memory of full chapter | ✅ Loom context engine (50k word limit) |
| Responsive Integrity: Fully functional on mobile | ✅ Bottom tab nav on < 1024px |
| Theme System: 3 themes with live switching | ✅ 3 Premium Themes (Play, Global, Futuro) | 
| Canvas Mind Map & Whiteboard | ✅ Miro-style infinite canvas, AI nodes, stickies |
| Audiobooks & Voice Cloning | ✅ Full local TTS generation & cloning via BullMQ workers |
| Voice Library & Avatars | ✅ Advanced grid UI, sample uploading, real-time preview |
| Agentic AI Team | ✅ Customizable personas with DB chat memory & tool calling |
| All-Local LLM Engine (V33) | ✅ Ollama Llama 3 default; Cloud providers stripped |
| Skeuomorphic Redesign (V33) | ✅ Publisher theme, premium buttons, flush avatars |
| Write Node Stability (V33) | ✅ TipTap Editor crash (`localsInner`) resolved |

---

## 2. TECH STACK & ARCHITECTURE

### 2.1 Frontend
- **Framework:** Next.js 15.1.0 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + custom CSS design system (`globals.css`)
- **Editor:** TipTap (Headless ProseMirror) with custom Vercel AI SDK text stream decoders
- **Panels:** `react-resizable-panels` for desktop IDE layout
- **State:** React Hooks + Local Storage (Firebase decoupled)
- **Typography:** Premium system font stack (optimized for offline builds)

### 2.2 Backend & Infrastructure
- **Auth:** Local Guest Auth (Firebase auth stubbed)
- **Database:** Local-First Architecture (Firebase Firestore stubbed)
- **Storage:** Local Storage (Firebase Storage stubbed)
- **Functions:** Next.js API Routes (Firebase Admin decoupled)
- **Background Workers:** Node.js Scripts (Audio/Voice Cloning)
- **AI Core:** Ollama (Local/OSS)
- **Audio Processing:** Piper TTS + FFmpeg

---

## 3. ROUTE & SCREEN ARCHITECTURE (30+ Routes)

### 3.1 Public Routes
- `/` — Landing page with destination book covers and CTA
- `/login` — Firebase email/Google auth
- `/signup` — Account creation

### 3.2 Protected Application (`/app` & `/project/[id]`)
- `/app` — Global Dashboard (Recent projects, Project Cover display)
- `/project/[id]` — 3-pane editor IDE (Outline \| Editor \| AI Sidebar)
- `/project/[id]/brainstorm` — Outline, Whiteboard (Post-its), and Canvas Mind Map
- `/project/[id]/codex` — World-building database (Characters, Locations, Lore, Items)
- `/project/[id]/audiobook` — Audiobook Studio, Web Player, Export History
- `/publish` — Publishing dashboard

### 3.3 Settings Hub (`/settings/*`)
- `/settings` — Main hub with visual hero cards
- `/settings/profile` — User profile & preferences
- `/settings/ai` — Global AI Model config for local Ollama instances
- `/settings/ai-team` — Setup for **Agentic AI** personas (Names, Prompts, LLMs, Voices)
- `/settings/voice-library` — Master internal voice catalog & user **Voice Clones**

---

## 4. DATA SCHEMA (9 Firestore Collections)

Standard NoSQL structure utilizing:
- `users`
- `projects`
- `chapters` (subcollection of projects)
- `entities` (subcollection of projects - Codex)
- `chat_history` (project-level AI memory persistence)
- `exports` (subcollection of projects - Audiobook/PDF)
- `continuityReports`
- `voice_clones` (user's custom voice models)
- `persona_settings` (user's custom Agentic AI team models)

Secured by per-collection UID ownership matching `allow read, write: if request.auth.uid == resource.data.uid`.

---

## 5. UI/UX SPECIFICATIONS (V33 Skeuomorphic Redesign)

- **Design System — "Premium Themes"**: The default aesthetic is now deeply textured and dynamic, featuring 3 premium themes: Play (Gal Yossef dim amber), Global (Apple light glass), and Futuro (Matrix dark). Features highly curated agentic avatars and bespoke module graphics.
- **Global Navigation**: A mega-menu sidebar allowing immediate deep-linking across the application.

---

## 6. CORE MODULES COMPLETE BREAKDOWN

### 6.1 IDE & Editor (V33 Stability Updates)
Rich-text tip-tap editor with real-time `isGenerating` blocks preventing collisions. Features inline passive voice tools, rewriting, and continuity scanning via the Loom context engine. V33 patched the stream decoding protocol, preventing `localsInner` tree crashes during text chunk injection.

### 6.2 Brainstorm Module
Features three distinct sub-tabs: Outline Generator, Whiteboard (Draggable Sticky Notes), and Canvas Mind Map (Nodes, Edges, AI Node Expansion).

### 6.3 Codex (World Bible)
Tracks all physical and metaphysical elements of the novel. Intercepts character/location generation commands from the AI Team directly using explicit `tool-calling`.

### 6.4 Voice & Audiobook Module
- **Voice Library**: Premium grid interface merging static built-in Voices and custom cloned voices. Supports real-time MP3 previews.
- **Voice Cloning Pipeline**: Async BullMQ/Redis `voiceCloneWorker`. Records users via WebM, simulates multi-epoch Piper training.
- **Audiobook Exports**: `audiobookWorker` cleans text via local LLM, synthesizes audio chunks, generates `ffmetadata` chapters, and concatenates `.m4b` container files.
- **In-App Web Player**: Native audiobook player with 15s skip, playback speed sliders, and cross-session resume powered by `usePlaybackSync`.

### 6.5 Agentic AI Creative Team
- **Multi-Persona Config**: Customize up to 5 agents (e.g., The Architect, The Stylist) with individual names, system prompts, voices, and target models (Ollama).
- **Persistent Memory**: The chatbox hooks into a Firebase database allowing conversations to persist across browser reloads.
- **Tool Calling Orchestration**: Parses JSON function triggers to perform autonomous actions like `create_codex_entity` and `generate_audiobook` entirely through chat.

---

## 7. EXPORT PIPELINE
- Print to PDF (HTML): Handles physical standard paginations.
- `.m4b` Audiobook Export: Apple-Book compliant metadata indexing, cover art attaching, and audio compilation.

---

## 8. GITHUB COMMIT HISTORY & VERSIONS

| Version | Description |
|---|---|
| **V34.1 (CURRENT)**| ADDED: Local-First Architecture (Firebase decoupled/stubbed), Theme-Aware Photorealistic Avatars, Offline-optimized premium system font stack, Performance tuning (removed recharts, wavesurfer). Resolved `InvariantError` with stable Next.js 15.1.0 downgrade. |
| **V33** | ADDED: Skeuomorphic Publisher UI Redesign, Agent Avatar specific cropping, "All-Ollama" local inference logic (deprecating cloud LLMs), and a patched Write Node Stream Decoder to resolve TipTap prose crashes. |
| **V32** | REFINED: PRD update to reflect production-ready status and latest build features. |
| **V31** | ADDED: Audiobook Generation (BullMQ, FFmpeg, Piper), Voice Library, Voice Cloning Uploads, Agentic AI Persona Settings, Persistent DB Memory, Tool Calling `(create_codex_entity)`. |
| **V30** | Removed local storage external AI hooks to enforce security; Fixed DB Offline sync. |
| **V29** | Canvas mind map, TTS voice picker UI, settings visual redesign. |
| **V28** | Theme-image registry and module reactive UI refactors. |
