Novello AI — Build-Ready PRD (Greenfield) v1.0
Written to PRD Authoring Prompt V2 (Anti-empty-frontend, wiring, state machines, chunking)

1) Executive Overview
1.1 Product Vision Statement
Novello AI is a manuscript development workspace where authors create, revise, and publish long-form books with an integrated AI “writing room” that preserves voice, continuity, and structure. The product unifies outlining, drafting, world/knowledge management, revision workflows, version recovery, and deterministic export into a single project system that never loses work.
1.2 Problem Statement
Who: high-output fiction and non-fiction authors (indie and professional) who write 40k–150k word manuscripts and manage complex continuity.
What: authors lose time and quality due to fragmented tools (Docs/Scrivener + scattered AI chats), inconsistent AI tone, continuity errors across chapters, and unreliable export/publishing workflows.
When/where: during multi-week/month writing projects; especially when editing earlier chapters, integrating new ideas, or rewriting sections; when moving between outline → draft → revision → export.
Why it persists: writing tools lack a structured project/context engine; AI tools are chat-centric rather than manuscript-centric; export pipelines are often brittle; autosave/versioning is poorly specified.
Cost: wasted hours rewriting, continuity mistakes reaching publication, abandoned drafts, and significant emotional friction due to fear of losing work.
1.3 Proposed Solution Summary (press-release style)
Today we’re launching Novello AI: a project-based writing studio that combines a robust editor, a living “Codex” for characters/places/facts, automated continuity checks, and AI tools that draft and revise inside your manuscript—while keeping your voice and keeping every version recoverable. From first outline to clean EPUB export, everything stays wired and reliable.
1.4 Success Metrics & KPIs
Category
Metric
Target (MVP)
Target (6-Month)
Measurement Method
Acquisition
Visitor→Signup conversion
8%
12%
Web analytics event signup_success / unique visitors
Activation
Create project + first chapter within 10 min
60%
70%
Events project_created, chapter_createdtimestamps
Retention
D7 / D30
25% / 12%
35% / 18%
Cohort retention by active_day
Revenue
Pro conversion (trial→paid)
5%
8%
Billing system events
Engagement
Writing sessions/week (≥10 min)
2.5
3.5
Session tracking
Performance
Editor initial load
<2.5s
<2.0s
RUM metric ttfi_editor
Quality
Crash-free sessions
99.5%
99.8%
Error tracking + session logs
Reliability
Content loss incidents
0
0
Support + telemetry anomaly detection
1.5 Assumptions & Open Decisions
Assumption
Rationale
Impact if Wrong
Decision Owner
Web app first (desktop-centric)
Authors write on laptop/desktop primarily
Need native apps sooner
Product
Firebase (Auth+Firestore+Storage)
Speed + simplicity for MVP
May need Postgres later for heavy analytics
Engineering
TipTap for editor
Strong rich-text capabilities
If performance poor at scale, switch editor
Engineering
Local AI via Ollama is optional
Not all users can run local models
Must provide cloud-first experience
Product
EPUB export via HTML→EPUB pipeline
Deterministic exports
If quality insufficient, switch to dedicated EPUB renderer
Engineering

2) Feasibility Spikes
2.1 Spike Identification
SPIKE 1: TipTap autosave + versioning + recovery
	•	Risk: silent data loss, stale closures, race conditions between typing/autosave/version snapshots.
	•	Test (build): one page editor with chapter switching; autosave every 5s + on blur; version snapshot every 60s and on AI insert; local fallback (IndexedDB) if Firestore write fails; restore UI.
	•	Success criteria:
	◦	No data loss after 30 minutes of continuous typing + 50 chapter switches.
	◦	Force network offline for 2 minutes: edits persist locally and sync when online.
	◦	Version restore returns exact content (hash match).
	•	Failure response: reduce autosave frequency + debounced transactions; enforce single-writer per chapter with queue.
	•	Effort: 8–12 hours.
	•	Blocker: editor, revision, AI insert, continuity triggers.
SPIKE 2: AI streaming (Ollama local ↔ Gemini cloud fallback) into editor
	•	Risk: streaming UI glitches, partial insert corruption, provider errors not surfaced.
	•	Test: /api/ai/stream endpoint (SSE) supporting both providers via adapter; editor insert at cursor with stop/cancel.
	•	Success criteria:
	◦	Token stream appears within 800ms for local model.
	◦	Stop button halts stream within 500ms.
	◦	Fallback triggers if Ollama not reachable in 2s; user sees banner “Using cloud model”.
	•	Failure response: switch from SSE to chunked fetch; or reduce streaming to paragraph-level.
	•	Effort: 6–10 hours.
	•	Blocker: all AI writing features.
SPIKE 3: Deterministic export (Project → HTML → EPUB/PDF)
	•	Risk: exports produce broken formatting; chapter ordering mismatch; missing images.
	•	Test: export one project with 10 chapters, images, headings, italics; produce EPUB + PDF.
	•	Success criteria:
	◦	EPUB validates (basic validation) and renders consistently in Apple Books/Calibre.
	◦	Chapter order matches Firestore order fields.
	◦	Export completes <10s for 100k words.
	•	Failure response: use a stricter intermediate (Markdown AST) + renderer; or use a library with stronger EPUB support.
	•	Effort: 8–12 hours.
	•	Blocker: publish module.
2.2 Spike Execution Order
	1	Autosave/versioning → 2) AI streaming → 3) Export.

3) Market & Commercial Strategy
3.1 Target Market Definition
	•	TAM: global writing software + AI writing assistants.
	•	SAM: English-speaking indie and professional authors who publish digitally.
	•	SOM (MVP): 2,000–10,000 early adopters from writing communities.
3.2 Competitive Landscape
Competitor
Type
Strengths
Weaknesses
Our Differentiation
Scrivener
Direct
Structure, project mgmt
No integrated AI, dated UX
AI-in-manuscript + continuity
Atticus
Direct
Web, formatting/export
Limited deep workflow
stronger Codex + AI + versioning
Google Docs + AI
Substitute
Ubiquitous
Not project-centric, weak continuity
project context engine
Sudowrite/NovelAI
Direct
AI strong
Not a full manuscript OS
full workflow + exports
3.3 Competitive Moat & Defensibility
	•	Switching costs via project history, versions, Codex, and series-level assets.
	•	Quality moat from continuity + voice profile tuned to user manuscripts.
3.4 Business Model & Monetization
	•	Freemium
	◦	Free: 2 projects, 200k AI tokens/month, export HTML only.
	◦	Pro: unlimited projects, 5M AI tokens/month, EPUB/PDF export, continuity automation, series management.
	•	Billing: Stripe subscription monthly/annual, 7-day trial.
	•	Upgrade triggers: token limit reached, export EPUB, continuity automation toggle.
3.5 Regulatory & Compliance Requirements
Regulation
Applicability
Key Requirements
Implementation Approach
GDPR
Likely
data access/delete, lawful basis
user data export + deletion; DPA-ready
COPPA
No
not targeting children
age gate in signup

4) User Personas & Journeys
4.1 Persona Definitions
P1 (PRIMARY): High-output indie novelist
	•	Literacy: 3/5
	•	Goals: draft faster, keep continuity, export clean EPUB.
	•	Frustrations: AI tone drift, lost edits, messy exports.
	•	Devices: laptop/desktop.
	•	Willingness to pay: $15–$30/mo.
P2: Non-fiction expert/consultant author
	•	Goals: structure chapters, cite notes, consistent tone.
	•	Needs: import outlines, revision, clean PDF.
4.2 Journey Map (P1)
Stage
Action
Touchpoint
Emotion
Pain Points
Opportunities
Onboard
Sign up
/signup
hopeful
setup confusion
guided “create first project”
Structure
create outline
Brainstorm
focused
blank canvas
templates + AI outline
Draft
write chapters
Editor
flow
AI chaos
style profile + constraints
Revise
fix continuity
Continuity
relief
noisy alerts
severity + resolve flow
Publish
export EPUB
Publish
satisfaction
broken formatting
deterministic export pipeline

5) Application Structure & Navigation Wiring
$1
5.1.1 Mega-Menu Specification (Top Bar)
Information Architecture
Top bar items open a mega panel (desktop) except where noted. Mega panels are content-rich navigation surfaces (not simple dropdown lists).
Top Bar Items:
	•	Dashboard (direct link, no mega panel)
	•	Projects (mega panel)
	•	Series (mega panel)
	•	Settings (mega panel)
	•	Search (global search modal)
	•	Theme Toggle (Light/Dark/System)
	•	Account (profile, logout)
Desktop Interaction Rules
	•	Open: hover opens after 150ms OR click/tap opens immediately.
	•	Close: mouse leave after 250ms OR ESC key OR click outside.
	•	Pin: user can click “Pin menu” to keep panel open until closed.
	•	Keyboard:
	◦	Tab focuses top items; Enter opens panel; Arrow keys move within panel sections.
	◦	ESC closes panel; focus returns to top item.
Mobile Interaction Rules
	•	Top bar collapses to hamburger.
	•	Hamburger opens a drawer with the same IA (no mega panels). Secondary routes expand as accordions.
Mega Panel Layout (Desktop)
Each mega panel uses a 3-column grid:
	1	Primary links (section list)
	2	Contextual content (recent/pinned)
	3	Quick actions (create/import/export/settings)
Projects Mega Panel (Desktop)
Sections:
	•	Recent Projects (last 8, with thumbnail + title + last edited)
	•	Pinned Projects (user-defined)
	•	Create: New Project, Import Manuscript
	•	Jump To: Last opened chapter (per project)
	•	Filters: Active / Archived
Quick Actions:
	•	“New Project”
	•	“Import Manuscript”
	•	“Create Board” (opens Brainstorm board creation modal with template chooser)
Series Mega Panel (Desktop)
Sections:
	•	Recent series (last 6)
	•	Create series
	•	Series assets shortcuts: Shared Codex, Style Profiles
Settings Mega Panel (Desktop)
Sections:
	•	Profile
	•	AI & Models
	•	Themes
	•	Storage
	•	Security
Quick Actions:
	•	Toggle Theme (Light/Dark/System)
	•	AI Provider quick switch (Local/Cloud)
Mega Menu Visual/UX Constraints
	•	Must render in <100ms after open (content pre-fetched on app load for recent/pinned lists).
	•	Must not shift layout (use portal overlay).
	•	Must support skeleton loading states if recent items not yet loaded.
$2
Screen ID
Screen Name
Route
Nav Location
Purpose
Auth
Roles
Owner
SCR-001
Login
/login
Auth
Sign in
No
—
Auth
SCR-002
Signup
/signup
Auth
Create account
No
—
Auth
SCR-003
Dashboard
/app
Top
Project overview
Yes
user
App
SCR-004
Projects List
/projects
Top→Projects
Manage projects
Yes
user
App
SCR-005
Project Home
/project/[projectId]
Projects
Overview
Yes
user
Projects
SCR-006
Editor
/project/[projectId]/editor
Project
Draft chapters
Yes
user
Editor
SCR-007
Brainstorm Home
/project/[projectId]/brainstorm
Project→Brainstorm
Boards + templates + inbox
Yes
user
Brainstorm
SCR-007A
Whiteboard Board
/project/[projectId]/brainstorm/whiteboard/[boardId]
Brainstorm
Canvas: mind map + stickies
Yes
user
Brainstorm
SCR-007B
Board Templates
/project/[projectId]/brainstorm/templates
Brainstorm
Create from template
Yes
user
Brainstorm
SCR-007C
Ideas Inbox
/project/[projectId]/brainstorm/inbox
Brainstorm
Quick capture + convert
Yes
user
Brainstorm
SCR-008
Codex
/project/[projectId]/codex
Project
Entities
Yes
user
Codex
SCR-009
Continuity
/project/[projectId]/continuity
Project
Alerts
Yes
user
Continuity
SCR-010
Audiobook
/project/[projectId]/audiobook
Project
TTS playback
Yes
user
Audio
SCR-011
Publish
/project/[projectId]/publish
Project
Export
Yes
user
Publish
SCR-012
Series List
/series
Top→Series
Manage series
Yes
user
Series
SCR-013
Series Detail
/series/[seriesId]
Series
Shared assets
Yes
user
Series
SCR-014
Settings AI
/settings/ai
Top→Settings
Providers/models
Yes
user
Settings
/settings/ai
Top→Settings
Providers/models
Yes
user
Settings


5.3 Screen Flow Wiring Diagram (Major Flows)
FLOW A: Signup → Create Project → Create Chapter → Write
	•	[SCR-002 Signup]
	◦	Button: “Create account”
	◦	API: Firebase Auth createUser
	◦	On success: redirect /app
	•	[SCR-003 Dashboard]
	◦	Button: “New Project”
	◦	API: POST /api/projects
	◦	Creates: projects doc + defaults
	◦	Redirect: /project/{projectId}
	•	[SCR-005 Project Home]
	◦	Button: “New Chapter”
	◦	API: POST /api/projects/{projectId}/chapters
	◦	Creates: chapters doc + initial versions doc
	◦	Redirect: /project/{projectId}/editor?chapter={chapterId}
	•	[SCR-006 Editor]
	◦	Autosave starts; status pill updates.
FLOW B: AI Draft → Insert → Version Snapshot
	•	[SCR-006 Editor]
	◦	Button: Toolbar “AI → Draft next paragraph”
	◦	API: POST /api/ai/stream (SSE)
	◦	On chunk: append to preview buffer
	◦	Button: “Insert” commits buffer into TipTap
	◦	Side effect: POST /api/projects/{projectId}/chapters/{chapterId}/versions with source=ai_insert
FLOW C: Continuity Check After Save
	•	[SCR-006 Editor]
	◦	Trigger: autosave success OR manual “Run Continuity”
	◦	API: POST /api/continuity/run
	◦	Creates: continuityRuns + alerts
	•	[SCR-009 Continuity]
	◦	Alerts table auto-refreshes
	◦	Button: “Open in Editor” navigates to editor with anchor.
FLOW D: Export EPUB
	•	[SCR-011 Publish]
	◦	Button: “Export EPUB”
	◦	API: POST /api/export/epub
	◦	Response: file URL (signed) + download trigger

6) Entity Lifecycle State Machines
6.1 ENTITY: Project
States: ACTIVE → ARCHIVED (terminal until unarchive)
From
To
Trigger
API
Side Effects
ACTIVE
ARCHIVED
User clicks “Archive Project”
POST /api/projects/{id}/archive
Sets archivedAt, hides from default lists
ARCHIVED
ACTIVE
User clicks “Restore”
POST /api/projects/{id}/restore
Clears archivedAt
UI impact: archived projects appear in “Archived” filter; editor read-only until restored.
6.2 ENTITY: Chapter
States: DRAFT → REVIEW → FINAL
From
To
Trigger
API
Side Effects
DRAFT
REVIEW
Set status dropdown
PATCH /api/chapters/{id}
Updates status
REVIEW
FINAL
Mark final
PATCH /api/chapters/{id}
Locks chapter unless “Unlock”
FINAL
REVIEW
Unlock
PATCH /api/chapters/{id}
Records unlockedAt
6.3 ENTITY: Brainstorm Board
States: ACTIVE → ARCHIVED
From
To
Trigger
API
Side Effects
ACTIVE
ARCHIVED
“Archive board”
POST /api/boards/{id}/archive
hides from default list
ARCHIVED
ACTIVE
“Restore”
POST /api/boards/{id}/restore
returns to list
Board has modes (not states): MIND_MAP and STICKIES as a UI toggle on the same board.
6.4 ENTITY: Continuity Alert
States: OPEN → DISMISSED OR RESOLVED
From
To
Trigger
API
Side Effects
OPEN
DISMISSED
“Dismiss” button
POST /api/alerts/{id}/dismiss
Saves reason
OPEN
RESOLVED
“Mark resolved”
POST /api/alerts/{id}/resolve
Saves note
---|---|---|---|---| | OPEN | DISMISSED | “Dismiss” button | POST /api/alerts/{id}/dismiss | Saves reason | | OPEN | RESOLVED | “Mark resolved” | POST /api/alerts/{id}/resolve | Saves note |

7) Feature Specification (Button-Level for MVP Core)
7.1 Feature Inventory & Priority Matrix
ID
Feature
Phase
Priority
Persona
Complexity
Dependencies
F-001
Auth (email/password)
MVP
Must
P1/P2
M
Firebase
F-002
Projects CRUD
MVP
Must
P1/P2
M
Firestore
F-003
Chapters CRUD + ordering
MVP
Must
P1/P2
L
Firestore
F-004
TipTap Editor + autosave + versions
MVP
Must
P1/P2
XL
Spike 1
F-005
AI draft/rewrite/instructions
MVP
Must
P1/P2
L
Spike 2
F-006
Codex entities CRUD
MVP
Must
P1
L
Firestore
F-007
Continuity run + alert triage
MVP
Should
P1
XL
Spike 2
F-008
Import (docx/md/txt)
MVP
Should
P2
L
Parser
F-009
Export HTML/EPUB/PDF
MVP
Must
P1/P2
XL
Spike 3
F-010
Series (shared Codex)
P2
Could
P1
L
Firestore
F-011
Audiobook TTS (basic)
P2
Could
P1
L
TTS
7.2 Detailed Feature Spec — F-004 Editor + Autosave + Versions
Purpose & User Value: provide a stable writing environment with guaranteed recovery.
User Stories
	•	US-004-01: Draft and autosave
	◦	GIVEN user is in Editor WHEN they type THEN autosave occurs every 5s and status shows “Saved just now”.
	◦	GIVEN network fails WHEN autosave fails THEN status shows “Offline — saving locally” and edits persist.
	◦	GIVEN network restores WHEN sync runs THEN status shows “Synced”.
SCREEN: Editor (SCR-006) ROUTE: /project/[projectId]/editor?chapter=[chapterId]
LAYOUT (simplified)
	•	Left: Chapter list (reorder drag handle, status badge)
	•	Center: TipTap editor
	•	Right: Panels (tabs): AI / Versions / Codex Quick Insert
	•	Top of editor: Save status pill + word count + Chapter status dropdown
DATA SOURCES
UI Element
API Call
Backend Process
Firestore Source
Update
Chapter list
GET /api/projects/{id}/chapters
query chapters
projects/{id}/chapters
on load + on reorder
Chapter content
GET /api/chapters/{id}
get chapter
chapters/{id} + latest version
on switch
Versions list
GET /api/chapters/{id}/versions
list versions
chapters/{id}/versions
on open
BUTTONS & INTERACTIONS
Element
Label
Action
API
Backend
Result
New chapter
“+ Chapter”
create
POST /api/projects/{id}/chapters
create docs
chapter appears + navigate
Reorder
drag handle
reorder
POST /api/chapters/reorder
batch update order
list updates
Save
implicit
autosave
PATCH /api/chapters/{id}
validate + write + create version if needed
status pill updates
Versions
“Restore”
restore version
POST /api/chapters/{id}/restore
set content to version
editor updates
FOUR STATES
	•	EMPTY: no chapters → message “Create your first chapter” + CTA.
	•	LOADING: skeleton editor + disabled toolbar.
	•	LOADED: full UI.
	•	ERROR: banner “Couldn’t load chapter. Retry” + safe navigation back.
API (key endpoints)
	•	PATCH /api/chapters/{id}
	◦	Request: { title?, contentJSON, contentText, wordCount, status?, updatedAtClient }
	◦	Response: { ok: true, serverUpdatedAt, versionCreated: boolean }
	◦	Errors: 401/403/404/409 conflict.

7.2 Detailed Feature Spec — F-005 AI Draft/Rewrite
User Stories
	•	US-005-01: Draft next paragraph at cursor.
	•	US-005-02: Rewrite selection with instruction.
	•	US-005-03: Summarize chapter into Codex notes.
SCREEN: Editor (AI panel) BUTTONS
	•	“Draft next” → SSE stream, preview, Insert / Cancel
	•	“Rewrite selection” → requires selected text, instruction field
Provider policy
	•	Default: user setting (Settings AI)
	•	If local selected but unreachable → auto fallback to Gemini with visible banner.

7.3 Cross-Feature Wiring Matrix
Feature A
Feature B
Handoff
Trigger
Boundary API
Data
Editor
Continuity
Run check
autosave success
POST /api/continuity/run
chapterId + context
Codex
Editor
Quick insert
click entity
GET /api/codex/entities/{id}
entity snippet
Editor
Publish
Export
button click
POST /api/export/epub
projectId
7.4 Shared Components
	•	Global Search (projects, chapters, codex entities)
	•	Toast system + error banner standard
	•	Confirm dialogs (delete/archive)
7.5 Out-of-Scope
	•	Multi-user collaboration, comments, track-changes, marketplace.

8) Design System & UI Specification
8.1 Design Language
“Cupertino Luxury Minimalism” — clean, spacious, translucent surfaces, subtle shadows, premium typography.
8.2 Typography Scale
Level
Font
Weight
Size
Line Height
Usage
H1
Inter/SF
600
28
34
Page titles
H2
Inter/SF
600
20
28
Section headers
Body
Inter/SF
400
15
22
Main text
UI
Inter/SF
500
13
18
Buttons/labels
$1
8.3.1 Theme Support (Light/Dark/System)
Requirement: app supports Light, Dark, and System themes.
	•	Selection UI:
	◦	Top bar: theme toggle button (sun/moon + dropdown for System)
	◦	Settings → Themes: radio selection + preview
	•	Persistence: users/{uid}.preferences.theme = light|dark|system
	•	System mode: follows OS changes live.
8.3.2 Multiple UI/UX Style Families
v1.0 ships with exactly one style family: Cupertino Luxury Minimalism.
	•	Light/Dark are themes within that family.
	•	Additional style families are explicitly out of scope for v1.0.
8.6 Responsive
Breakpoints: 420 / 920 / 1360. Editor collapses right panel into drawer on <920.
8.9 Onboarding & First-Run
	•	After signup: “Create your first project” wizard (title, genre, tone, target length, AI preference).

9) Technical Architecture
9.1 Architecture Overview
Next.js web app + Next.js API routes (server) + Firebase Auth/Firestore/Storage. AI adapter layer supports Ollama and Gemini. Export runs server-side and returns signed download URLs.
9.2 Technology Stack
Layer
Tech
Version
Justification
Frontend
Next.js App Router + TS
latest stable
SSR + routing
UI
shadcn/ui + Tailwind
current
speed + consistency
Editor
TipTap
current
rich editing
Auth/DB
Firebase Auth + Firestore
current
rapid MVP
Storage
Firebase Storage
current
assets/export
AI Cloud
Gemini API
current
quality + scale
AI Local
Ollama
current
privacy/offline
Testing
Playwright + Vitest
current
E2E + unit
CI/CD
GitHub Actions
current
automation
Container
Docker
current
local dev
9.3 Toolchain Integration
	•	Antigravity: generates baseline app structure from this PRD; build chunk-by-chunk.
	•	Stitch: generate standard settings/forms and dashboard tables; NOT editor and NOT whiteboard canvas.
	•	Gemini CLI: generate tests, refactors, endpoint docs; human review gates.
	•	Jules: limited to mechanical tasks (lint/test scaffolding, formatting), never auth/security rules.
9.3.0 Tooling & Model Ecosystem Specification (Mandatory)
A) Build-Time Tools (What they are allowed to do)
	•	Antigravity (Primary Builder):
	◦	Generate screens/routes/components per Screen Registry.
	◦	Implement endpoint registry and Firestore schemas.
	◦	Implement chunk plan sequentially with validation checkpoints.
	◦	Must not invent new routes/collections.
	•	Stitch (UI Accelerator):
	◦	Only: Settings screens, tables, basic dashboards, form layouts.
	◦	Not allowed: editor logic, autosave/versioning, AI streaming, export engines, Firestore rules.
	•	Gemini CLI (Engineering Copilot):
	◦	Allowed: write unit/e2e tests, refactor for performance, generate API docs, create Zod schemas.
	◦	Not allowed: change auth logic without explicit ticket.
	•	Jules (Mechanical Assistant):
	◦	Allowed: lint fixes, type tightening, code formatting, boilerplate, dependency updates.
	◦	Not allowed: auth/rules, AI prompts, data migrations.
B) Runtime AI Models & Providers
Providers:
	•	Local: Ollama (user machine) for privacy/offline.
	•	Cloud: Gemini for reliability and scale.
Models (examples; concrete names set in Settings):
	•	Local drafting: a fast instruction model
	•	Local summarization: small model
	•	Cloud drafting/rewrite: higher quality model
	•	Cloud continuity: reasoning-capable model
C) Deterministic Model Router (Policy)
All AI calls go through a single router function routeTask(taskType, policy).
Task Types:
	•	DRAFT_PARAGRAPH
	•	REWRITE_SELECTION
	•	OUTLINE_FROM_NOTES
	•	SUMMARIZE_CHAPTER
	•	CONTINUITY_CHECK
	•	BLURB_GENERATION
	•	TITLE_IDEAS
Routing Rules:
	•	If user preference = LOCAL_ONLY:
	◦	Use Ollama; if unavailable → show blocking error with “Start Ollama” help (no silent cloud).
	•	If user preference = AUTO (default):
	◦	Try local for drafting/rewrite if reachable within 2s; else fallback to cloud.
	◦	Continuity che | Build Area | Primary Tool | Secondary | Justification | |---|---|---|---| | UI scaffolding | Stitch | manual | fastest for standard screens | | App coding | Antigravity | human edits | PRD-driven generation | | Code acceleration | Gemini CLI | Jules | speed + QA | | Local AI | Ollama | Gemini fallback | privacy/offline | | Backend | Next.js API routes | Cloud Functions (later) | simplicity | | Auth | Firebase Auth | — | robust | | DB | Firestore | Postgres (later) | MVP speed |
9.4 Data Architecture (Firestore)
Collections:
	•	users/{uid}: profile, preferences
	•	projects/{projectId}: ownerId, title, genre, toneProfileId, createdAt, archivedAt, seriesId?
	•	projects/{projectId}/chapters/{chapterId}: title, order, status, latestVersionId, wordCount, updatedAt
	•	projects/{projectId}/chapters/{chapterId}/versions/{versionId}: contentJSON, contentText, createdAt, source, hash
	•	projects/{projectId}/codexEntities/{entityId}: type, name, description, tags, relationships[], appearances[]
	•	projects/{projectId}/boards/{boardId}: title, modeDefault(MIND_MAP|STICKIES), createdAt, updatedAt, archivedAt?
	•	projects/{projectId}/boards/{boardId}/nodes/{nodeId} (mind map): text, position{x,y}, parentId?, color?, collapsed?, createdAt
	•	projects/{projectId}/boards/{boardId}/edges/{edgeId} (mind map): fromNodeId, toNodeId, label?
	•	projects/{projectId}/boards/{boardId}/stickies/{stickyId}: text, color, position{x,y}, size{w,h}, tags[], createdAt
	•	projects/{projectId}/brainstormInbox/{itemId}: text, tags[], createdAt, convertedTo? (nodeId/stickyId/outlineItem/codex)
	•	projects/{projectId}/continuityRuns/{runId}: status, startedAt, completedAt, model, tokenUsage
	•	projects/{projectId}/alerts/{alertId}: runId, severity, type, message, chapterRefs[], status, createdAt
	•	exports/{exportId}: ownerId, projectId, type(epub/pdf/html), status, storagePath, createdAt
9.5 API Contract (Endpoint Registry)
#
Method
Path
Description
Auth
Request
Response
1
GET
/api/health
health
No
—
{status,version}
2
POST
/api/projects
create project
Yes
{title,genre?}
{projectId}
3
GET
/api/projects
list projects
Yes
{includeArchived?}
{projects[]}
4
POST
/api/projects/{id}/chapters
create chapter
Yes
{title}
{chapterId}
5
GET
/api/projects/{id}/chapters
list chapters
Yes
—
{chapters[]}
6
GET
/api/chapters/{id}
get chapter content
Yes
—
{chapter, latestVersion}
7
PATCH
/api/chapters/{id}
save chapter
Yes
{contentJSON,...}
{ok,serverUpdatedAt}
8
GET
/api/chapters/{id}/versions
list versions
Yes
—
{versions[]}
9
POST
/api/chapters/{id}/restore
restore version
Yes
{versionId}
{ok}
10
POST
/api/ai/stream
AI stream
Yes
{provider,mode,input,context}
SSE tokens
11
POST
/api/continuity/run
run continuity
Yes
{projectId,chapterId?}
{runId}
12
GET
/api/alerts
list alerts
Yes
{projectId,filters}
{alerts[]}
13
POST
/api/alerts/{id}/dismiss
dismiss
Yes
{reason?}
{ok}
14
POST
/api/export/epub
export epub
Yes
{projectId}
{exportId,downloadUrl}
15
POST
/api/export/pdf
export pdf
Yes
{projectId}
{exportId,downloadUrl}
16
POST
/api/projects/{projectId}/boards
create board
Yes
{title,modeDefault}
{boardId}
17
GET
/api/projects/{projectId}/boards
list boards
Yes
{includeArchived?}
{boards[]}
18
GET
/api/boards/{boardId}
get board meta
Yes
—
{board}
19
PATCH
/api/boards/{boardId}
update board meta
Yes
{title,modeDefault?}
{ok}
20
POST
/api/boards/{boardId}/archive
archive board
Yes
—
{ok}
21
POST
/api/boards/{boardId}/restore
restore board
Yes
—
{ok}
22
POST
/api/boards/{boardId}/nodes
create mindmap node
Yes
{text,position,parentId?}
{nodeId}
23
PATCH
/api/boards/{boardId}/nodes/{nodeId}
update node
Yes
{text?,position?,collapsed?}
{ok}
24
DELETE
/api/boards/{boardId}/nodes/{nodeId}
delete node
Yes
—
{ok}
25
POST
/api/boards/{boardId}/edges
create edge
Yes
{fromNodeId,toNodeId,label?}
{edgeId}
26
DELETE
/api/boards/{boardId}/edges/{edgeId}
delete edge
Yes
—
{ok}
27
POST
/api/boards/{boardId}/stickies
create sticky
Yes
{text,color,position,size}
{stickyId}
28
PATCH
/api/boards/{boardId}/stickies/{stickyId}
update sticky
Yes
{text?,color?,position?,size?,tags?}
{ok}
29
DELETE
/api/boards/{boardId}/stickies/{stickyId}
delete sticky
Yes
—
{ok}
30
POST
/api/projects/{projectId}/brainstormInbox
create inbox item
Yes
{text,tags?}
{itemId}
31
POST
/api/projects/{projectId}/brainstormInbox/{itemId}/convert
convert inbox item
Yes
{to: node
sticky
9.8 Security Architecture
	•	All API routes verify Firebase ID token server-side (Admin SDK) and enforce ownerId checks.
	•	Firestore rules: owner-only read/write under projects.
	•	Storage rules: exports readable only by owner.
	•	Input validation: Zod schemas on all endpoints.
9.9 Observability
	•	Error boundary logs (client) + server logs per request with requestId.
	•	Metrics: autosave failures, export failures, AI latency, continuity run duration.

10) Build Chunking & Incremental Validation
Chunk
Scope
Screens
Features
Validation
1
Routing + nav + auth shells
all
auth gate, nav, empty states
every route renders, no 404
2
Projects + chapters CRUD
dashboard/projects/project
F-002/F-003
full CRUD verified
3
Editor + autosave + versions
editor
F-004
Spike 1 pass
4
AI streaming + insert
editor/settings AI
F-005
Spike 2 pass
5
Codex CRUD + quick insert
codex/editor
F-006
wiring matrix pass
6
Continuity run + alerts
continuity
F-007
alerts triage works
7
Import + exports
publish
F-008/F-009
Spike 3 pass
8
Hardening
all
errors/perf/a11y
KPI targets met
Validation protocol per chunk:
	1	structural render, 2) data populated, 3) CRUD complete, 4) wiring correct, 5) empty/loading/error states, 6) auth enforced.

11) Testing & QA
	•	Unit: adapters, validators, export builder.
	•	Integration: Firestore rules emulator + API endpoints.
	•	E2E: Playwright flows A–D.
	•	Security: rules review + API auth tests.

12) Deployment & Operations
	•	Environments: local (emulators) / staging / prod.
	•	CI: lint, typecheck, unit, e2e smoke.
	•	DR: daily Firestore export; export retention 30 days.

13) Glossary
	•	Codex: structured entities (characters/places/facts)
	•	Continuity: automated consistency checks across manuscript
	•	Version: immutable chapter snapshot
