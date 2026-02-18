# Novello AI — PRD V29
**Status:** Production-Ready (UAT Complete)
**Supersedes:** V28
**Last Updated:** 2026-02-18
**Build Commit:** 9ac63d8 (andrepopov28/NovelloAI, main)

---

## 1. SYSTEM CONTEXT & CORE PHILOSOPHY

Novello AI is an AI-native manuscript development platform. The AI acts as a "World-Aware" co-author with direct read/write access to the manuscript and character database. The platform is designed around a **Cupertino Luxury Minimalism** aesthetic — premium, photorealistic, and deeply responsive.

### 1.1 Definition of Done (All Criteria Met ✅)

| Criterion | Status |
|---|---|
| Sync Reliability: Word counts aggregate across chapters | ✅ Cloud Function onUpdate |
| State Safety: AI/User cannot edit simultaneously | ✅ GENERATING state locks editor |
| Context Depth: AI has memory of full chapter | ✅ Loom context engine (50k word limit) |
| Responsive Integrity: Fully functional on mobile | ✅ Bottom tab nav on < 1024px |
| Security: All routes auth-gated, Firestore ownership-enforced | ✅ UAT Phase 4 passed |
| Export Pipeline: PDF/EPUB export with auth headers | ✅ BUG-001 fixed |
| Theme System: 9 themes with live switching | ✅ V28 addition |
| Theme-Aware Images: 54 images (9 × 6) | ✅ V28 addition |
| Canvas Mind Map: Miro-style infinite canvas brainstorm | ✅ V29 addition |
| TTS Voice Picker: Multi-provider slide-up panel | ✅ V29 addition |
| Settings Redesign: Visual hero cards + Voice & TTS page | ✅ V29 addition |

---

## 2. TECH STACK & ARCHITECTURE

### 2.1 Frontend
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + custom CSS design system (`globals.css`)
- **Editor:** TipTap (Headless ProseMirror) with custom extensions
- **Panels:** `react-resizable-panels` for desktop IDE layout
- **State:** React hooks + Firebase real-time listeners
- **Fonts:** Inter (UI), Merriweather (serif), Playfair Display (E-Ink theme)

### 2.2 Backend & Infrastructure
- **Auth:** Firebase Authentication (Email/Password + Google Sign-In)
- **Database:** Cloud Firestore (7 collections, ownership-gated security rules)
- **Storage:** Firebase Storage (manuscript exports, cover images)
- **Functions:** Firebase Cloud Functions (word count aggregation)
- **AI:** Vercel AI SDK + Gemini 1.5 Pro/Flash (primary) + Ollama (local fallback)

### 2.3 AI Architecture — "Loom" Context Engine
- **Context Payload:** World Bible (synopsis + characters + tone) + full chapter text + last 5 conversation exchanges
- **Token Budget:** 2,000 tokens max (enforced in `loom.ts`)
- **Fallback Chain:** Ollama → Gemini 1.5 Flash → Gemini 1.5 Pro
- **Rate Limit Handling:** 429 retry with exponential backoff
- **Streaming:** Vercel AI SDK streaming into Preview Bubble
- **Security:** DOMPurify on all AI HTML output; `escapeHtml` on export

---

## 3. ROUTE & SCREEN ARCHITECTURE (27 Routes)

### 3.1 Public Routes (3)
| Route | Component | Description |
|---|---|---|
| `/` | `page.tsx` | Landing page with hero, features, CTA |
| `/login` | `LoginPage` | Firebase email/Google auth |
| `/signup` | `SignupPage` | Account creation |

### 3.2 Protected Routes (24)
All routes under `/(protected)/` verify Firebase ID token server-side.

| Route | Description |
|---|---|
| `/app` | Dashboard — 6 module cards, theme-aware images |
| `/app/write` | Project list for writing module |
| `/app/write/[id]` | 3-pane editor (Outline \| Editor \| AI Sidebar) |
| `/app/write/[id]/settings` | Project settings (title, genre, synopsis, tone) |
| `/app/write/[id]/chapters/[cid]` | Chapter editor with TipTap |
| `/app/brainstorm` | Brainstorm module — Outline, Whiteboard, Canvas Mind Map |
| `/app/data` | Codex — character/world entity database |
| `/app/data/[id]` | Entity detail view |
| `/app/audiobook` | Audiobook generation module with TTS Voice Picker |
| `/app/publish` | Publishing dashboard (metadata, cover, export) |
| `/app/settings` | Settings hub — visual hero card layout (5 sub-pages) |
| `/app/settings/profile` | Display name, avatar |
| `/app/settings/account` | Email, password change |
| `/app/settings/ai` | AI model preferences, Ollama config, Premium TTS APIs |
| `/app/settings/appearance` | Theme picker, font size |
| `/app/settings/voice` | Voice & TTS settings — provider, voice, speed, pitch |
| `/app/settings/billing` | Subscription management |
| `/app/continuity` | AI continuity checker |
| `/app/continuity/[id]` | Continuity report detail |

### 3.3 API Routes (11)
| Route | Method | Description |
|---|---|---|
| `/api/ai/generate` | POST | Loom context engine, streaming |
| `/api/ai/inline` | POST | Inline assist (rewrite/expand/fix) |
| `/api/ai/continuity` | POST | Continuity analysis |
| `/api/ai/brainstorm` | POST | Brainstorm idea generation |
| `/api/ai/audiobook` | POST | TTS script generation |
| `/api/ai/cover` | POST | Book cover prompt generation |
| `/api/ai/health` | GET | AI service health check |
| `/api/ai/trace` | POST | AI trace logging |
| `/api/ai/ollama/ping` | GET | Ollama local LLM health |
| `/api/export/pdf` | POST | PDF export (auth header fixed BUG-001) |
| `/api/export/epub` | POST | EPUB export |

---

## 4. DATA SCHEMA (7 Firestore Collections)

```
users/{uid}
  displayName: string
  email: string
  photoURL: string
  createdAt: Timestamp
  settings: { theme, font, aiModel, ollamaUrl, ttsProvider, ttsVoice, ttsSpeed, ttsPitch }

projects/{pid}
  uid: string (owner)
  title: string
  genre: string
  synopsis: string
  tone: string
  wordCount: number (aggregated by Cloud Function)
  totalChapters: number
  createdAt: Timestamp
  updatedAt: Timestamp

chapters/{cid}
  projectId: string
  uid: string
  title: string
  content: string (TipTap JSON)
  wordCount: number (calculated server-side)
  order: number
  createdAt: Timestamp
  updatedAt: Timestamp

entities/{eid}          ← Codex
  projectId: string
  uid: string
  type: 'character' | 'location' | 'item' | 'concept'
  name: string
  description: string
  attributes: Record<string, string>

conversations/{cid}
  uid: string
  projectId: string
  chapterId: string
  messages: Message[]   ← last 5 kept in context
  updatedAt: Timestamp

exports/{eid}
  uid: string
  projectId: string
  format: 'pdf' | 'epub'
  url: string
  createdAt: Timestamp

continuityReports/{rid}
  uid: string
  projectId: string
  issues: ContinuityIssue[]
  createdAt: Timestamp
```

### 4.1 Firestore Security Rules
- **Catch-all deny:** All collections default to `allow read, write: if false`
- **Per-collection:** `allow read, write: if request.auth.uid == resource.data.uid`
- **Word count aggregation:** Cloud Function `onUpdate` on `chapters` collection

---

## 5. UI/UX SPECIFICATIONS

### 5.1 Design System — "Cupertino Luxury Minimalism"
- **Primary font:** Inter (UI elements)
- **Accent:** Gemini-gold (`#d4af37`) on dark themes, theme-specific on others
- **Border radius:** 8px (cards), 12px (modals)
- **Shadows:** Layered, warm-tinted on dark; crisp on light
- **Animations:** 200ms ease-out transitions; reduced motion respected

### 5.2 Theme System (9 Themes)

All themes are implemented as `data-theme` attributes on `<html>`, with CSS custom properties defined in `globals.css`. The `ThemeProvider` persists selection to `localStorage` and Firestore `users/{uid}/settings.theme`.

| Theme Key | Display Name | Aesthetic |
|---|---|---|
| `dark` | Dark | Cinematic noir, neon-cyan, deep shadows |
| `light` | Light | Apple minimalist, bright studio, white |
| `swiss` | Swiss International | Bauhaus geometric, bold primary colors |
| `eink` | Warm E-Ink | Paper grain, cream stock, serif fonts |
| `cupertino` | Cupertino Glass | Frosted glass, soft bokeh, premium |
| `academia` | Dark Academia | Candlelight, leather, aged wood |
| `brutalist` | Neo-Brutalist | Raw concrete, stark black outlines |
| `terminal` | Cyber-Terminal | Green phosphor glow, circuit boards |
| `editorial` | High-Fashion Editorial | Stark white studio, editorial photography |

### 5.3 Theme-Aware Module Images

**Registry:** `src/lib/theme-images.ts` — maps `theme × module → image path`

**Image paths:** `/images/themes/{theme}/{module}.webp` (54 images, 1600×1000px)

**ModuleCard adaptation:**
- Light themes (eink, swiss, cupertino, light, editorial, brutalist): white gradient overlay + dark charcoal text
- Dark themes (dark, academia, terminal): transparent overlay + white text

**Fallback:** If theme-specific image not found, falls back to dark theme image

**Modules:** `write`, `brainstorm`, `data`, `audiobook`, `publish`, `settings`

### 5.4 Editor State Machine
| State | Behavior |
|---|---|
| `IDLE` | Standard editing, all controls active |
| `SAVING` | Small indicator top-right, input still enabled |
| `GENERATING` | `editable={false}`, wait cursor, AI sidebar streams |
| `OFFLINE` | Firestore disconnected, localStorage fallback active |

### 5.5 Responsive Layout
- **Desktop (≥ 1024px):** 3-pane layout (Nav | Editor | AI Sidebar) via `react-resizable-panels`
- **Mobile (< 1024px):** Single-pane, Bottom Tab Bar (Outline / Write / AI)

### 5.6 Settings Hub — Visual Hero Card Layout (V29)

The Settings hub (`/app/settings`) was redesigned from a plain list to a **visual card grid**. Each of the 5 sub-pages is represented by a full-bleed hero card with:
- A photorealistic background image (theme-aware)
- A gradient overlay for legibility
- Icon + title + description
- Hover lift animation

**Sub-pages:**
| Card | Route | Description |
|---|---|---|
| Profile | `/settings/profile` | Display name, avatar |
| Account | `/settings/account` | Email, password |
| AI & Models | `/settings/ai` | AI provider, Ollama URL, Premium TTS API keys |
| Voice & TTS | `/settings/voice` | TTS provider, voice selection, speed, pitch |
| Appearance | `/settings/appearance` | Theme picker, font size |

### 5.7 Voice & TTS Settings Page (V29)

New dedicated settings page at `/app/settings/voice`:
- **Provider selector:** Browser (Web Speech API) / ElevenLabs / OpenAI TTS
- **Voice list:** Dynamically filtered by provider
- **Speed slider:** 0.5× – 2.0×
- **Pitch slider:** 0.5 – 2.0 (Browser only)
- **Preview button:** Reads a sample sentence with current settings
- Settings persisted to `users/{uid}/settings.ttsProvider` and `ttsVoice`

### 5.8 AI Settings — Premium TTS APIs (V29)

The AI Settings page (`/settings/ai`) now includes a **Premium TTS APIs** section:
- **ElevenLabs API Key** field (masked, with link to ElevenLabs dashboard)
- **OpenAI API Key** field (masked, with link to OpenAI platform)
- Keys stored in `localStorage` (client-side only, never sent to Firestore)

---

## 6. BRAINSTORM MODULE (V29 — Full Implementation)

### 6.1 Tab Structure
The Brainstorm page (`/project/[id]/brainstorm`) has three tabs:

| Tab | Description |
|---|---|
| **Outline** | AI-powered story outline generator → apply chapters to project |
| **Whiteboard** | Freeform post-it note canvas (drag, color, resize) |
| **Mind Map** | Miro-style canvas mind map (default tab) |

### 6.2 Canvas Mind Map — Feature Specification

**Data Model:**
```typescript
interface MMNode {
  id: string;
  label: string;
  x: number;       // canvas coordinate
  y: number;       // canvas coordinate
  color: string;   // hex color
  parentId: string | null;
}
```

**Default Map (6 nodes):**
- Root: `Story Premise` (gold)
- Children: `Characters` (purple), `Plot Points` (cyan), `Settings` (green), `Themes` (amber), `Conflicts` (red)

**Canvas Interactions:**
| Interaction | Behavior |
|---|---|
| Scroll wheel | Zoom in/out (0.2× – 3×) |
| Space + drag | Pan the infinite canvas |
| Node drag | Drag node to reposition; bezier edges follow in real-time |
| Double-click node | Inline edit label |
| Click canvas | Deselect all, dismiss color picker |

**Node Controls (visible on hover/select):**
| Button | Action |
|---|---|
| `+` | Add child node (positioned to the right) |
| ✨ | AI Expand — calls `useAI` hook, appends 4 child idea nodes |
| 🎨 (color dot) | Opens 8-color palette popover |
| `×` | Delete node and all descendants (subtree delete) |

**Toolbar (top-right):**
- Zoom `−` / `%` display / `+`
- Fit to Screen (calculates bounds of all nodes, adjusts zoom + pan)
- Reset (restores default 6-node map)
- Hint text: `Space+drag to pan · Scroll to zoom · Drag nodes`

**SVG Bezier Connections:**
- Each edge is a cubic bezier path rendered in an SVG overlay
- Edge color matches the child node's color
- Stroke width: 2px, opacity: 0.7
- Control points: horizontal tangents from parent right-edge to child left-edge

**AI Expand:**
- Prompt: `"Give me 4 short brainstorm ideas branching from: {label}. Return a JSON array of strings."`
- Parses JSON array from AI response
- Appends each idea as a child node, fanned out vertically

**Implementation:** Self-contained in `brainstorm/page.tsx` — no new npm packages.

---

## 7. AUDIOBOOK MODULE — TTS VOICE PICKER (V29)

### 7.1 Voice Picker Slide-Up Panel

Replaces the plain `<select>` voice dropdown with a **slide-up panel** triggered by a "Choose Voice" button.

**Panel Structure:**
- Three tabs: **Browser** / **ElevenLabs** / **OpenAI**
- Each tab lists available voices for that provider
- Selected voice highlighted with gold border
- Closes on overlay click or `×` button

**TTS Routing Logic:**
| Provider | Implementation |
|---|---|
| Browser | `window.speechSynthesis` Web Speech API |
| ElevenLabs | `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}` with API key from localStorage |
| OpenAI | `POST https://api.openai.com/v1/audio/speech` with API key from localStorage |

**Voice Definitions:** `src/lib/voices-config.ts`
- Browser: system voices (loaded via `speechSynthesis.getVoices()`)
- ElevenLabs: 6 curated voices (Rachel, Domi, Bella, Antoni, Elli, Josh)
- OpenAI: 6 voices (alloy, echo, fable, onyx, nova, shimmer)

---

## 8. AI INTEGRATION — LOOM CONTEXT ENGINE

### 8.1 Context Payload (per generation request)
1. **World Bible:** `synopsis + characters + tone settings` from project
2. **Full Chapter:** Entire current chapter text (truncated at 50,000 words → last 20,000)
3. **Conversation History:** Last 5 exchanges from `conversations/{cid}`

### 8.2 Inline Assist (TipTap Extension)
- **Trigger:** User highlights text → floating toolbar appears
- **Actions:** Rewrite / Expand / Fix Grammar / Change Tone
- **Flow:** Selection → API call → Preview Bubble → Apply or Discard
- **Lock:** Editor set to `editable={false}` during generation

### 8.3 Continuity Checker
- Analyzes full manuscript for character/plot inconsistencies
- Returns structured `ContinuityIssue[]` with location and severity
- Stored in `continuityReports/{rid}` for historical review

---

## 9. SECURITY ARCHITECTURE

### 9.1 Authentication
- All protected routes verify Firebase ID token (server-side in layout)
- Dev bypass (`NODE_ENV === 'development'`) guarded and documented

### 9.2 Authorization
- Firestore rules enforce `uid` ownership on all 7 collections
- Catch-all deny rule prevents unauthorized access to new collections

### 9.3 Input Security
- `DOMPurify` sanitizes all AI HTML output before rendering
- `escapeHtml` applied to all user content in PDF/EPUB export
- No direct SQL/NoSQL injection surface (Firestore SDK)

### 9.4 API Security
- All `/api/*` routes validate `Authorization: Bearer {idToken}` header
- BUG-001 (missing auth header in `usePublish`) — **Fixed in V27 UAT**

### 9.5 TTS API Key Security
- ElevenLabs and OpenAI API keys stored in `localStorage` only
- Keys are never sent to Firestore or any Novello backend
- Keys are sent directly from the browser to the respective TTS provider

### 9.6 Known Gaps (Acceptable for MVP)
- No rate limiting on AI endpoints (deferred post-MVP)
- No Sentry error monitoring (deferred post-MVP)
- No analytics (deferred post-MVP)

---

## 10. EXPORT PIPELINE

### 10.1 PDF Export
- **Route:** `POST /api/export/pdf`
- **Auth:** Bearer token in Authorization header (fixed BUG-001)
- **Content:** Full manuscript with chapter headings, author name from `users/{uid}.displayName`
- **Author name fix:** Reads from Firestore, not hardcoded (fixed BUG-002)

### 10.2 EPUB Export
- **Route:** `POST /api/export/epub`
- **Format:** EPUB 3.0 compliant
- **Metadata:** Title, author, genre, synopsis from project document

---

## 11. BUG REGISTRY (All Resolved)

| ID | Severity | Description | Fix | Version |
|---|---|---|---|---|
| BUG-001 | S1 (Critical) | `usePublish` missing `Authorization` header on export API calls | Added `getIdToken()` call before fetch in `usePublish.ts` | V27 |
| BUG-002 | S2 (High) | PDF export used hardcoded "Author" instead of user's display name | Read `displayName` from Firestore `users/{uid}` | V27 |
| BUG-003 | S2 (High) | Debug `console.log` artifacts in production build | Removed all debug statements from editor and AI routes | V27 |
| BUG-004 | S3 (Medium) | `JSX` namespace not found in `brainstorm/page.tsx` | Added `import React` and replaced `JSX.Element[]` with `React.ReactElement[]` | V29 |

---

## 12. PERFORMANCE PROFILE

| Metric | Value | Notes |
|---|---|---|
| Static routes | 14 | Pre-rendered at build time |
| Dynamic routes | 13 | SSR with Firebase auth |
| AI token budget | 2,000 max | Enforced in Loom |
| Firestore listeners | 1 active per session | `subscribeToChapters` unsubscribes on cleanup |
| Image assets | 54 theme images | 1600×1000px WebP, ~100KB each |
| Build output | 0 TypeScript errors | Verified post all changes |
| Mind map nodes | Unlimited | Flat array, no tree traversal overhead |

---

## 13. OUTSTANDING ITEMS (Post-MVP Backlog)

| Item | Priority | Notes |
|---|---|---|
| AI-generated photorealistic theme images | High | Service at capacity; curated Unsplash images in place as fallback. Re-run `scripts/generate-theme-images.sh` when service recovers. |
| Mind map persistence | High | Save/load MMNode[] to Firestore or localStorage |
| Rate limiting on AI endpoints | Medium | Deferred post-MVP |
| Sentry error monitoring | Medium | Deferred post-MVP |
| Analytics (Posthog or GA4) | Low | Deferred post-MVP |
| ElevenLabs/OpenAI TTS live preview in Voice Picker | Medium | UI built, streaming audio playback pending |
| Mind map export (PNG/SVG) | Low | Canvas-to-image export |

---

## 14. REPOSITORY STRUCTURE

```
NovelloAI/
├── novello-ai/                    ← Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (protected)/       ← 24 auth-gated routes
│   │   │   │   ├── project/[id]/brainstorm/page.tsx  ← Canvas mind map (V29)
│   │   │   │   ├── project/[id]/audiobook/page.tsx   ← TTS voice picker (V29)
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx   ← Visual hero card hub (V29)
│   │   │   │       ├── ai/page.tsx ← Premium TTS API keys (V29)
│   │   │   │       └── voice/page.tsx ← Voice & TTS settings (V29)
│   │   │   ├── api/               ← 11 API routes
│   │   │   ├── globals.css        ← Design system + 9 theme CSS vars
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── dashboard/         ← ModuleCard (theme-aware)
│   │   │   ├── editor/            ← TipTap, InlineAssist, MentionList
│   │   │   ├── ui/                ← Button, Input, Modal, Toast
│   │   │   └── layout/            ← GlobalHeader, ThemePicker, AgentChatbox
│   │   ├── lib/
│   │   │   ├── loom.ts            ← AI context engine
│   │   │   ├── theme-images.ts    ← 9×6 image registry
│   │   │   ├── voices-config.ts   ← TTS voice definitions (Browser/ElevenLabs/OpenAI)
│   │   │   └── firebase.ts        ← Firebase SDK init
│   │   └── hooks/
│   │       ├── useTheme.ts        ← Theme switching + persistence
│   │       ├── useAutosave.ts     ← Debounced Firestore save
│   │       └── usePublish.ts      ← Export pipeline (BUG-001 fixed)
│   ├── public/
│   │   └── images/
│   │       ├── modules/           ← Legacy module images
│   │       ├── kinetic/           ← Legacy kinetic images
│   │       └── themes/            ← 54 theme-aware images (9×6)
│   └── scripts/
│       └── download-theme-images.sh  ← Re-download all 54 images
├── prd-archive/                   ← All previous PRD versions
│   ├── Novello-AI-PRD-V1-REBUILD.MD
│   ├── Novello-AI-PRD-V19.MD through V28.MD
└── Novello-AI-PRD-V29.MD         ← This document
```

---

## 15. GITHUB COMMIT HISTORY (Key Milestones)

| Commit | Description |
|---|---|
| `b0f55b1` | UAT hardening complete — BUG-001/002/003 fixed, security audit passed |
| `5e00d08` | E-Ink CSS enhancements (paper grain, serif fonts, warm scrollbars, sepia filter) |
| `7127c29` | Theme-image registry + ModuleCard light/dark adaptation + dashboard reactive images |
| `372efca` | 54 curated module images for all 9 themes (5.60 MiB) |
| TBD | V29: Canvas mind map, TTS voice picker, settings visual redesign |
