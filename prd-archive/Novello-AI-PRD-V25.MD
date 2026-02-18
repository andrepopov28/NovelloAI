Novello AI ("Novello") — Rebuild PRD v25
Salvage-First Rebuild Spec (Aligned to PRD Authoring Prompt V2)
Document Purpose This PRD replaces prior deficient build inputs by providing a one-shot, build-ready specification that:
	1	starts from the current codebase as an asset,
	2	identifies/triages build gaps vs. required product behavior,
	3	defines the missing specs that typically cause “it sort-of works but breaks in real use,”
	4	yields an implementation plan that can either salvage or restart with minimal ambiguity.

0) Executive Summary
Novello is an AI-first manuscript development platform where the AI operates as an integrated co-author/editor/publisher, not a chat widget.
0.1 Salvage vs Restart Recommendation (Default)
Default stance: SALVAGE unless the current build fails any of the “Salvage Gate” checks below.
Salvage Gate Checks (must pass to salvage):
	•	G1: Project/Chapter CRUD works reliably (create, rename, reorder, delete) with no silent Firestore write failures.
	•	G2: Editor never loses content (autosave + versioning + recovery path verified).
	•	G3: AI features are reachable through UI, provider switching works, and failures are user-visible.
	•	G4: Auth-protected routes cannot be accessed without auth; no route causes SSR crash.
	•	G5: Export/Import flows complete end-to-end at least once.
If any 2 or more gates fail, restart is usually faster.

1) Product Vision, Principles, Non-Negotiables
1.1 Vision
High-throughput authors produce books faster by combining a rich editor, a world bible, rolling context, voice consistency, continuity checks, import/export, and publishing surfaces.
1.2 Non-Negotiables
	•	No lost work (autosave + versions + local fallback + restore).
	•	Context integrity (rolling context + entity world bible always injected).
	•	Provider robustness (local-first Ollama, cloud fallback Gemini).
	•	Security correctness (Firestore rules + server-side verification for API routes).
1.3 Out of Scope (v25)
	•	Marketplace, collaboration/real-time multi-user editing, payments (unless explicitly required), mobile native apps.

2) Build Constraints & Assumptions
	•	Frontend: Next.js App Router, TypeScript strict.
	•	Backend: Firebase Auth + Firestore + Storage.
	•	Editor: TipTap.
	•	AI: Ollama (local) + Gemini (cloud fallback).

3) Market & Commercial Strategy (Minimal but Complete)
3.1 Target Market
Primary: serious indie authors writing long-form fiction and non-fiction who want speed + continuity + voice control.
3.2 Competitive Landscape
	•	Scrivener, Atticus, Google Docs + AI, NovelAI/Sudowrite.
3.3 Monetization (placeholder spec)
v25 ships without billing but includes a pricing-ready gate architecture:
	•	Free: 2 projects, limited AI calls/day.
	•	Pro: unlimited projects, import/export, continuity.

4) Personas & Journeys
4.1 Personas
P1 (Primary): High-output novelist
	•	Goals: draft faster, maintain voice, reduce continuity errors.
	•	Frustrations: losing work, incoherent AI, fragmented tools.
4.2 Journey Map (P1)
Stage
Action
Touchpoint
Emotion
Pain Points
Opportunities
Onboard
Sign in, create first project
/login → /dashboard
hopeful
config confusion
guided setup wizard
Write
create chapters, draft
editor
flow
AI breaks tone
style profile + constraints
Revise
check continuity, edit
alerts panel
relief
false positives
severity + dismiss/resolve
Publish
export EPUB/PDF
publish studio
satisfaction
broken exports
deterministic pipelines

5) Application Structure & Navigation Wiring
5.1 Navigation Component Spec
	•	Navigation type: Top bar + contextual left rail (desktop), hamburger drawer (mobile).
	•	Active state: highlighted top node + sub-route pill.
	•	Breadcrumbs: shown in project-scoped views.
5.2 Navigation Hierarchy (FULL)
MEGA-MENU / TOP BAR: ├── Dashboard — /app — project grid + quick actions ├── Projects │ ├── Project Home — /project/[projectId] — overview + shortcuts │ ├── Editor — /project/[projectId]?chapter=[chapterId] — write chapters │ ├── Brainstorm — /project/[projectId]/brainstorm — ideation + outlines │ ├── Codex — /project/[projectId]/codex — entities/world bible │ ├── Continuity — /project/[projectId]/continuity — alerts triage │ ├── Audiobook — /project/[projectId]/audiobook — TTS generation + playback │ └── Publish — /project/[projectId]/publish — export + metadata ├── Series │ ├── Series List — /series — manage series │ └── Series Detail — /series/[seriesId] — projects + shared entities ├── Settings │ ├── Profile — /settings/profile │ ├── AI & Models — /settings/ai │ ├── Themes — /settings/themes │ ├── Storage — /settings/storage │ └── Security — /settings/security └── Auth Flows ├── /login ├── /signup └── /forgot-password
5.3 Screen Registry (Master Table)
(Provide as a table during implementation; all screens above must appear.)
5.4 Screen Flow Wiring (Critical Flows)
FLOW: Create Project → Write Chapter
	•	Dashboard (/app)
	◦	Button: “New Project” → modal
	◦	API: Firestore createProject
	◦	On success: redirect /project/[projectId]
	•	Project Home
	◦	Button: “New Chapter”
	◦	Creates: chapter doc + initial version
	◦	Redirect: /project/[projectId]?chapter=[chapterId]
FLOW: AI Generate in Editor
	•	Editor
	◦	Button: “Write with AI” (empty state) OR toolbar “AI”
	◦	Calls: POST /api/ai/chat
	◦	Streams: SSE tokens into editor
	◦	On stop: finalize version (source=ai-generation)
FLOW: Import Manuscript
	•	Dashboard / Project Home
	◦	Button: “Import Manuscript”
	◦	Client parse: docx/md/txt
	◦	Preview: chapter list
	◦	Commit: batch write chapters + versions
FLOW: Publish Export
	•	Publish
	◦	Buttons: “Export EPUB”, “Export PDF/HTML”
	◦	Calls: /api/export/epub, /api/export/html
	◦	Downloads: named by project title

6) Functional Requirements by Module
6.1 Dashboard
	•	Project cards, create/import, series quick links.
6.2 Project Home
	•	Stats, last edited chapter, shortcuts.
6.3 Editor
	•	TipTap editor, chapter list navigation, autosave indicator, history panel.
	•	Must support: reorder chapters, status (draft/review/final), per-chapter word count.
6.4 AI System (Muse)
	•	Provider switching: project-level overrides + user defaults.
	•	Streaming, stop generation, timeout handling, safe insertion (sanitization).
6.5 Loom Context Engine
	•	Builds rolling context from project.contextRollup + relevant entities.
	•	Token budget enforcement.
6.6 Codex (Entities)
	•	CRUD entities, relationships graph, appearances tracking.
	•	Series-shared entities with unshare cascade on series deletion.
6.7 Continuity
	•	Background continuity checks after save.
	•	Alerts triage: open/dismiss/resolve.
6.8 Import
	•	docx/md/txt parsing + chapter detection + manual split UI.
6.9 Version History
	•	Auto versioning on autosave + AI + import + restore.
	•	Retention policy with pinned versions.
6.10 Publish
	•	Metadata generation (blurb), exports, cover image, filename determinism.
6.11 Audiobook
	•	Voice clone samples, Piper integration (local), session playback state.

7) Data Architecture (Firestore)
Define all collections + fields + defaults + limits. Must match implementation 1:1.

8) Security & Compliance
8.1 Firestore Rules
Owner-only access; subcollections validate project ownership.
8.2 API Route Authentication (MISSING IN CURRENT BUILD — MUST ADD)
All Next.js API routes must verify Firebase ID token server-side (Admin SDK). Reject unauthenticated requests with 401.

9) API Contract (Complete Endpoint Registry)
	•	/api/ai/chat (SSE)
	•	/api/ai/continuity
	•	/api/export/epub
	•	/api/export/html
	•	/api/ollama/ping
	•	/api/voice/train
	•	/api/voice/tts (Expand to full registry during build.)

10) Non-Functional Requirements
	•	Performance: editor usable at 200 chapters, 900KB/chapter cap.
	•	Reliability: retries + offline behavior.
	•	Accessibility: WCAG AA.
	•	Observability: error boundary + logging.

11) Test Plan & Acceptance Criteria
	•	UAT script per flow; automated smoke tests for auth + CRUD + autosave.

12) Migration & Salvage Plan
	•	Inventory existing code modules; map to this PRD.
	•	Fix deltas in priority order (P0 safety, then P1 flows).

Appendix A — Build Gap Audit Checklist
(Used to evaluate salvage gates.)
Appendix B — Implementation Tickets
(Generate a ticket list aligned to modules and screens.)
