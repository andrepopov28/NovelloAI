# Novello AI — PRD V30
**Status:** Production-Ready (UAT Complete)
**Supersedes:** V29
**Last Updated:** 2026-02-20
**Build Commit:** TBD

---

## 1. SYSTEM CONTEXT & CORE PHILOSOPHY

Novello AI is an AI-native manuscript development platform. The AI acts as a "World-Aware" co-author with direct read/write access to the manuscript and character database. The platform is designed around a **Cupertino Luxury Minimalism** aesthetic — premium, photorealistic, and deeply responsive.

### 1.1 Definition of Done (All Criteria Met ✅)

| Criterion | Status |
|---|---|
| Sync Reliability: Offline support & word counts | ✅ Cloud Function & IDB Offline Sync (V30) |
| State Safety: AI/User cannot edit simultaneously | ✅ GENERATING state locks editor |
| Context Depth: AI has memory of full chapter | ✅ Loom context engine (50k word limit) |
| Responsive Integrity: Fully functional on mobile | ✅ Bottom tab nav on < 1024px |
| Security: Premium TTS UI limits & Auth-gated | ✅ Strict TTS Provider Constraints (V30) |
| Export Pipeline: PDF/EPUB export with auth headers | ✅ Print to PDF (HTML) label fixed (V30) |
| Theme System: 9 themes with live switching | ✅ V28 addition |
| Theme-Aware Images: 54 images (9 × 6) | ✅ V28 addition |
| Canvas Mind Map: Miro-style infinite canvas brainstorm | ✅ V29 addition |
| Settings Redesign: Visual hero cards | ✅ V29 addition |

---

## 2. TECH STACK & ARCHITECTURE

### 2.1 Frontend
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + custom CSS design system (`globals.css`)
- **Editor:** TipTap (Headless ProseMirror) with custom extensions
- **Panels:** `react-resizable-panels` for desktop IDE layout
- **State:** React hooks + Firebase real-time listeners

### 2.2 Backend & Infrastructure
- **Auth:** Firebase Authentication (Email/Password + Google Sign-In)
- **Database:** Cloud Firestore
- **Storage:** Firebase Storage
- **Functions:** Firebase Cloud Functions
- **AI:** Vercel AI SDK + Gemini 1.5 Pro/Flash (primary) + Ollama (local fallback)

---

## 3. ROUTE & SCREEN ARCHITECTURE (27 Routes)

### 3.1 Public Routes (3)
| Route | Component | Description |
|---|---|---|
| `/` | `page.tsx` | Landing page with hero, features, CTA |
| `/login` | `LoginPage` | Firebase email/Google auth |
| `/signup` | `SignupPage` | Account creation |

### 3.2 Protected Routes (24)
Protected routes under `/(protected)/` verify Firebase ID token server-side.
Key modules:
- `/app/write/[id]` — 3-pane editor (Outline \| Editor \| AI Sidebar)
- `/app/brainstorm` — Brainstorm module (Outline, Whiteboard, Canvas Mind Map)
- `/app/audiobook` — Audiobook generation with Piper/Browser TTS picker
- `/app/publish` — Publishing dashboard
- `/app/settings` — Visual hero card hub (Profile, Account, AI, Appearance, Voice)

### 3.3 API Routes (11)
Core backend logic endpoints mapped for export, AI (Generations, Continuity, Tracing), health.

---

## 4. DATA SCHEMA (7 Firestore Collections)

Standard NoSQL structure utilizing `users`, `projects`, `chapters`, `entities`, `conversations`, `exports`, and `continuityReports`. Secured by per-collection UID ownership matching `allow read, write: if request.auth.uid == resource.data.uid`.

---

## 5. UI/UX SPECIFICATIONS

### 5.1 Design System — "Cupertino Luxury Minimalism"
- High contrast, ambient glows, dynamic animations, and luxury layout aesthetics.

### 5.2 Settings Hub & Voice Specs (V30 Updates)
- The Settings hub provides sub-pages for configuration.
- To enforce financial restrictions and security constraints, unproxied browser API calls utilizing external client secrets (e.g. ElevenLabs and OpenAI TTS) have been **completely removed**.
- **Voice / TTS Generation:** Restricted exclusively to local browser APIs (`SpeechSynthesis`) and backend Piper microservices. The UI reflects only Browser Voices internally.

---

## 6. BRAINSTORM MODULE (V29)

Features three distinct views (Outline, Whiteboard, and Canvas Mind Map). Infinite pan/zoom, node interaction, direct connection paths, and inline AI expansion capabilities integrated perfectly.

---

## 7. AUDIOBOOK MODULE — TTS VOICE PICKER (V30 Refactor)

### 7.1 Voice Picker Slide-Up Panel
- Triggered by "Choose Voice" button in the Audiobook tab.
- Contains only the `Browser` tab to conform to external budget and security constraints.
- Maps directly to `window.speechSynthesis` natively.

---

## 8. AI INTEGRATION — LOOM CONTEXT ENGINE

Aggregates project synopsis, 20k word lookback threshold, and recent conversation payload per prompt effectively supporting "World-Aware" co-authorship.

---

## 9. SECURITY ARCHITECTURE

### 9.1 Authentication & DB Safety
- Enforces strict Backend Route Header validations and frontend layout verification hooks.
- Firestore rules secure read/writes natively.
- DOMPurify implementation on untrusted prompt logic strings preventing payload XSS.

### 9.2 API & Cost Limitations (V30 Update)
- Previously, direct `localStorage` access was given to third-party endpoints. In V30, these have been stripped from the configuration panes to prevent malicious data misuse.

---

## 10. EXPORT PIPELINE

### 10.1 Print to PDF (HTML)
- **Route:** `POST /api/export/pdf`
- Generates HTML payloads explicitly meant for direct browser "Print to PDF" dialog handling to bypass costly rendering farm setups seamlessly.

---

## 11. RECENT BUG REGISTRY

| ID | Severity | Description | Fix | Version |
|---|---|---|---|---|
| BUG-005 | S1 (Critical) | `offline-storage.ts` synced to a deprecated fetch route | Migrated to native Firestore `updateChapter` call | V30 |
| BUG-006 | S2 (High) | PDF export output mismatched UI label expectations | Renamed to "Print to PDF (HTML)" in UI bindings | V30 |
| BUG-007 | S1 (Critical) | Security rule violations permitting open client calls | Swept UI to remove ElevenLabs/OpenAI components | V30 |

---

## 12. GITHUB COMMIT HISTORY (Key Milestones)

| Version | Description |
|---|---|
| **V30** | Removed local storage external AI hooks to enforce security; Fixed DB Offline sync. |
| **V29** | Canvas mind map, TTS voice picker UI, settings visual redesign. |
| **V28** | Theme-image registry and module reactive UI refactors. |
| **V27** | Export authorization headers patched. |
