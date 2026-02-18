# Novello AI — PRD v26
## Salvage-First Rebuild Spec (Aligned to PRD Authoring Prompt V2)

### Document Purpose
This PRD supersedes PRD v25 by incorporating all completed build phases (1–11) and documenting the current production state of the application. It reflects the "Apple Minimalist" design system overhaul, security hardening, and AI integration milestones achieved during the rebuild.

---

## 0) Executive Summary

Novello is an AI-first manuscript development platform where the AI operates as an integrated co-author/editor/publisher, not a chat widget.

### 0.1 Salvage vs Restart — Resolved
**Decision: SALVAGE** — All five salvage gates passed during Phase 1 audit.

| Gate | Description | Status |
|------|-------------|--------|
| G1 | Project/Chapter CRUD works reliably | ✅ Passed |
| G2 | Editor never loses content (autosave + versioning + recovery) | ✅ Passed |
| G3 | AI features reachable through UI, provider switching works | ✅ Passed |
| G4 | Auth-protected routes cannot be accessed without auth | ✅ Passed |
| G5 | Export/Import flows complete end-to-end | ✅ Passed |

### 0.2 Build Status (as of v26)
All 11 phases of the rebuild have been completed:

| Phase | Name | Status |
|-------|------|--------|
| 1 | Gap Analysis & Salvage Gate Verification | ✅ Done |
| 2 | Structural Refactoring (Navigation & Routes) | ✅ Done |
| 3 | Security & Backend Hardening | ✅ Done |
| 4 | Functional Enhancements | ✅ Done |
| 5 | UI/UX Polish (Stitch Design System) | ✅ Done |
| 6 | Verification & Cleanup | ✅ Done |
| 7 | PRD Alignment & Layout Fixes | ✅ Done |
| 8 | Phase 2 PRD Enhancements | 🔄 In Progress |
| 9 | Apple Minimalist Layout Redesign | 🔄 In Progress |
| 10 | UI Refinement (Apple Principles) | ✅ Done |
| 11 | Logo Scale Refinement | ✅ Done |

---

## 1) Product Vision, Principles, Non-Negotiables

### 1.1 Vision
High-throughput authors produce books faster by combining a rich editor, a world bible, rolling context, voice consistency, continuity checks, import/export, and publishing surfaces.

### 1.2 Non-Negotiables
- **No lost work**: Autosave + versions + IndexedDB local fallback + restore.
- **Context integrity**: Rolling context + entity world bible always injected via Loom Context Engine.
- **Provider robustness**: Local-first Ollama, cloud fallback Gemini.
- **Security correctness**: Firestore rules + server-side Firebase Admin SDK verification for all API routes.

### 1.3 Out of Scope (v26)
- Marketplace, collaboration/real-time multi-user editing, payments, mobile native apps.
- Mega-menu navigation (deferred to Phase 8 Priority 2).

---

## 2) Build Constraints & Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 App Router, TypeScript strict |
| Backend | Firebase Auth + Firestore + Storage |
| Editor | TipTap |
| AI | Ollama (local) + Gemini (cloud fallback) |
| Styling | Vanilla CSS + Tailwind utility classes |
| Design System | "Cupertino Luxury Minimalism" |
| Fonts | Inter (sans), Georgia/Playfair (serif) |
| Icons | Lucide React |

---

## 3) Design System — Cupertino Luxury Minimalism

### 3.1 Principles
- **Whitespace**: Generous padding, breathing room.
- **Typography**: Inter (UI) + Georgia/Playfair Display (editorial).
- **Colors**: Neutral dark grays, subtle accents, high contrast. Gold/silver brand accents.
- **Shadows**: Soft, layered shadows for depth.
- **Borders**: Hairline (0.5px–1px) or none.
- **Glass effects**: `backdrop-filter: blur()` for nav, panels, overlays.

### 3.2 Navigation Design (Implemented)
- **Top bar**: Fixed 80px height, glassmorphism background, centered module tabs.
- **Active state**: Subtle `rgba(255,255,255,0.08)` glass + 3px top accent bar.
- **Hover state**: `rgba(255,255,255,0.04)` + slight icon scale (1.1x).
- **Logo**: NovelloLogo SVG component (responsive, 42px container height).
- **Tab layout**: Photorealistic 24x24 thumbnails + uppercase 11px labels.

### 3.3 Dashboard Design (Implemented)
- **Layout**: 2-column grid of hero module cards.
- **Cards**: Photorealistic background images at 50% opacity.
- **Gradient**: Multi-stop dark overlay for text legibility.
- **Hover**: `scale(1.02)` + shadow lift.
- **Hero images**: Write, Brainstorm, Data, Audiobook, Publish, Settings.

### 3.4 AI Chatbox Design (Implemented)
- **Position**: Fixed right panel, `top: var(--nav-height)`, z-index 99.
- **Header**: Full-width photorealistic persona banners (16:10 aspect ratio).
- **Overlay**: Gradient overlay + glass-blur label bar for agent name/role.
- **Thinking state**: Blue glow pulse animation.
- **Personas**: Route-aware persona switching (default, brainstorm, codex, editor, audiobook, publish).

### 3.5 Theme System
Multi-theme support with theme picker component. Implemented themes include dark and light modes with CSS custom property architecture for easy extension.

---

## 4) Application Structure & Navigation

### 4.1 Route Hierarchy
```
├── /app                              — Dashboard (project grid + module cards)
├── /project/[projectId]              — Editor (write chapters)
│   ├── /brainstorm                   — Ideation + outlines
│   ├── /codex                        — Entities / world bible
│   ├── /audiobook                    — TTS generation + playback
│   ├── /publish                      — Export + metadata
│   └── /settings                     — Project settings
├── /series                           — Series list
│   └── /series/[seriesId]            — Series detail
├── /settings                         — User settings
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

### 4.2 Navigation Component
- **Component**: `GlobalNav.tsx` — Top bar with centered module tabs.
- **Context-aware**: Shows dashboard nav on `/app`, project-specific nav within `/project/[id]`.
- **Right controls**: User avatar menu (sign out) + ThemePicker.
- **Brand**: `NovelloLogo.tsx` SVG with gold/silver gradient isometric diamonds.

---

## 5) Functional Requirements by Module

### 5.1 Dashboard (`/app`)
- Project cards with create/import actions.
- Module hero cards (Write, Brainstorm, Data, Audiobook, Publish, Settings).
- Quick links to recent projects and series.

### 5.2 Editor (`/project/[id]`)
- TipTap rich-text editor, center-aligned (max-width 680px).
- Chapter list navigation (sidebar).
- Autosave indicator + version history panel.
- Chapter reorder, status (draft/review/final), per-chapter word count.
- **InlineAssist**: AI bubble menu for in-context generation.

### 5.3 AI System (Muse)
- Provider switching: Ollama (local, preferred) ↔ Gemini (cloud fallback).
- Project-level overrides + user defaults.
- Streaming SSE responses, stop generation, timeout handling.
- Safe insertion with HTML sanitization.
- Route-aware persona system with photorealistic banners.

### 5.4 Loom Context Engine
- Builds rolling context from `project.contextRollup` + relevant entities.
- Token budget enforcement.
- Automatic injection into AI prompts.

### 5.5 Codex (Entities) (`/project/[id]/codex`)
- CRUD entities with type classification.
- Relationships graph visualization.
- Appearances tracking across chapters.
- Series-shared entities with unshare cascade.

### 5.6 Continuity
- Background continuity checks after save.
- Alerts triage: open/dismiss/resolve.
- Severity levels + contextual display.

### 5.7 Import
- DOCX/MD/TXT parsing + chapter detection.
- Manual split UI for unstructured imports.
- Batch write chapters + initial versions.

### 5.8 Version History
- Auto versioning on autosave (60s) + AI insert + import + restore.
- IndexedDB offline fallback (Phase 8 enhancement).
- Retention policy with pinned versions.

### 5.9 Publish (`/project/[id]/publish`)
- Metadata management (blurb generation).
- AI-powered book cover generation.
- Export: EPUB, PDF/HTML.
- Filename determinism by project title.

### 5.10 Audiobook (`/project/[id]/audiobook`)
- Voice selection and configuration.
- Piper integration (local TTS).
- Session playback state management.

---

## 6) Security & Compliance

### 6.1 Firestore Rules
Owner-only access enforced; subcollections validate project ownership.

### 6.2 API Route Authentication
All Next.js API routes verify Firebase ID token server-side via Firebase Admin SDK (`firebase-admin`). Unauthenticated requests rejected with 401.

**Secured endpoints:**
- `/api/ai/chat` (SSE streaming)
- `/api/ai/continuity`
- `/api/export/epub`
- `/api/export/html`
- `/api/ollama/ping`
- `/api/voice/train`
- `/api/voice/tts`

---

## 7) Data Architecture (Firestore)

### Collections
- `users/{uid}` — Profile, preferences, AI config
- `projects/{projectId}` — Project metadata, context rollup
- `projects/{projectId}/chapters/{chapterId}` — Chapter content, order, status
- `projects/{projectId}/chapters/{chapterId}/versions/{versionId}` — Version snapshots
- `projects/{projectId}/entities/{entityId}` — Codex entries
- `projects/{projectId}/continuity/{alertId}` — Continuity alerts
- `series/{seriesId}` — Series metadata
- `series/{seriesId}/sharedEntities/{entityId}` — Cross-project entities

---

## 8) Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| Performance | Editor usable at 200 chapters, 900KB/chapter cap |
| Reliability | Retries + IndexedDB offline behavior |
| Accessibility | WCAG AA compliance |
| Observability | Error boundary + logging |
| Animations | 60fps, 200–300ms transitions |
| Loading | Skeleton screens (not spinners) |

---

## 9) Completed Build Phases (Detailed)

### Phase 1: Gap Analysis & Salvage Gate Verification
- Audited current routes vs V25 navigation hierarchy.
- Verified all 5 salvage gates → decision: SALVAGE.

### Phase 2: Structural Refactoring
- Refactored dashboard from `/dashboard` to `/app`.
- Implemented Settings sub-routes and Series routes.
- Updated GlobalNav with top-bar + contextual logic.

### Phase 3: Security & Backend Hardening
- Installed `firebase-admin` and initialized Admin SDK.
- Implemented server-side token verification middleware.
- Audited and enforced Firestore security rules.

### Phase 4: Functional Enhancements
- Loom Context Engine refinement (token budget, entity injection).
- Background Continuity Checks (context injection, severity UI).
- Fixed Ollama detection, AI response streaming, avatar rendering.
- Generated photorealistic dashboard assets via Stitch.

### Phase 5: UI/UX Polish
- Applied glassmorphism & premium textures across all surfaces.
- Refined typography hierarchy (Inter + serif fallbacks).
- AIChatbox glass-bubble refinement.
- Global dark mode compliance.

### Phase 6: Verification & Cleanup
- Fixed lint errors and optimized hook dependencies.
- Full verification of secured API flows.

### Phase 7: PRD Alignment & Layout Fixes
- Fixed navigation overlap (layout padding 64px → 80px).
- Chatbox z-index below nav (99 < 100).
- Browser-verified layout fixes.

### Phase 8: Phase 2 Enhancements (Partially Complete)
- ✅ IndexedDB offline fallback for autosave.
- ✅ Automatic version snapshots (60s + AI insert).
- 🔄 AI Summarize to Codex (in progress).
- ⏳ Mega-Menu navigation (deferred).

### Phase 9: Apple Minimalist Redesign (Partially Complete)
- ✅ Dashboard mockup + design tokens.
- ✅ ModuleCard component with photorealistic images.
- ⏳ Editor/module view mockups (deferred).

### Phase 10: UI Refinement (Apple Principles)
- Refined GlobalNav active/hover states (glass effects, no color flip).
- ModuleCard image opacity at 50% with enhanced gradient overlay.
- AIChatbox persona banners: full-width photorealistic with glass labels.
- Generated 12 photorealistic assets (6 module heroes, 6 persona banners).

### Phase 11: Logo Scale Refinement
- Reduced logo container from 60px → 42px (30% reduction).
- Made NovelloLogo SVG responsive (`width/height: 100%`).

---

## 10) Remaining Work (Backlog)

### Priority 1 — In Progress
- [ ] AI Summarize to Codex flow completion
- [ ] Editor view mockups (Stitch)
- [ ] Module-specific view mockups (Brainstorm, Data, Audiobook, Publish)

### Priority 2 — Deferred
- [ ] Mega-menu navigation (hover logic, keyboard nav)
- [ ] FloatingToolbar component
- [ ] InlineAssist styling update
- [ ] Responsive check (tablet, mobile)
- [ ] Browser dark mode compatibility audit

### Priority 3 — Future
- [ ] Billing/payments integration (pricing-ready gate exists)
- [ ] Collaboration / real-time multi-user editing
- [ ] Native mobile apps
- [ ] Advanced analytics / Postgres migration
- [ ] Marketplace

---

## 11) Success Criteria

✅ **Visual Excellence**: Apple-grade "Cupertino Luxury Minimalism" aesthetic fully implemented.  
✅ **Performance**: 60fps animations, instant interactions.  
✅ **Consistency**: Unified design language across dashboard, navigation, and chatbox.  
✅ **Security**: All API routes server-side authenticated.  
✅ **Reliability**: Autosave + IndexedDB fallback + version history.  
✅ **Usability**: Intuitive, minimal learning curve.  
✅ **Delight**: Micro-interactions (hover scale, glass effects, persona transitions).

---

## Appendix A — Key File Registry

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Design tokens + CSS custom properties |
| `src/components/layout/GlobalNav.tsx` | Top navigation bar |
| `src/components/layout/AIChatbox.tsx` | AI assistant panel with persona system |
| `src/components/dashboard/ModuleCard.tsx` | Dashboard hero cards |
| `src/components/ui/NovelloLogo.tsx` | Brand logo (SVG) |
| `src/components/ui/ThemePicker.tsx` | Theme selection widget |
| `src/lib/firebase-admin.ts` | Server-side Firebase Admin SDK |
| `src/lib/hooks/useAuth.ts` | Authentication hook |
| `src/lib/hooks/useChat.ts` | AI chat interaction hook |
| `src/lib/hooks/useProjects.ts` | Project CRUD hook |

## Appendix B — Asset Directory

| Path | Contents |
|------|----------|
| `/images/refined/` | Module hero images (write, brainstorm, data, publish, settings) |
| `/images/kinetic/` | Animated/kinetic module images (home, audiobook) |
| `/images/personas/` | AI persona banner images |
| `/images/avatars/` | User/agent avatar images |
