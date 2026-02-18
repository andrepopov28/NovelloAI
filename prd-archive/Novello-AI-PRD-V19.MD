Product Requirements Document (PRD) v19.1
Project: Novello AI (The Autonomous Publisher)
Version: 19.1 (The "Ironclad" Clean Rebuild)
Status: APPROVED FOR EXECUTION
Architect: Google Antigravity
Design System: Google Stitch (Cupertino Glass)
1. Executive Summary & Philosophy
The Pivot: We are executing a "Clean Slate" rebuild. The previous codebase (v18) is deprecated and will serve only as a visual reference. We are building the "Iron Foundation" from init.
Core Philosophy: "The Resilient Creator"
	1	Security is Non-Negotiable: No database read/write occurs without strict ownership validation (request.auth.uid).
	2	No Silent Failures: Every async operation (save, generate, sync) has a user-facing state (Loading, Success, Error).
	3	Atomic Design (Stitch): UI components are built in isolation (Atoms) and composed into logic-aware structures (Organisms) that strictly adhere to the backend data model.
	4	Shippable Milestones: We do not build Phase 2 until Phase 1 is bulletproof.
2. Technical Architecture (The Iron Foundation)
A. The Stack
	•	Core: Next.js 16 (App Router), React 19.
	•	Styling: Tailwind CSS v4 (configured with "Stitch" Design Tokens).
	•	Database: Firebase Firestore (Production Mode).
	•	Auth: Firebase Authentication (Strict Session Management).
	•	State: React Context + nuqs (URL-based state) for deep-linking.
	•	AI Orchestration: Vercel AI SDK (Standardized streaming) wrapping Ollama & Gemini.
B. The Resilience Layer (Mandatory)
Every major feature must integrate these three safety nets:
	1	Global Error Boundary: A wrapper around the main Layout that catches React crashes and offers a "Reload Project" button.
	2	The "Toast" System: A unified notification bus (sonner or react-hot-toast).
	◦	Success: "Chapter saved." (Small, Green)
	◦	Info: "Generating prose..." (Pulsing, Blue)
	◦	Error: "Sync failed. Retrying..." (Persistent, Red)
	3	Optimistic UI with Rollback: The UI updates immediately. If the backend fails, the UI reverts and alerts the user.
3. The "Google Stitch" Design System
Objective: Replace ad-hoc styling with a rigid, token-based system.
A. Design Tokens (The "Glass" Theme)
	•	Surface: bg-white/10 backdrop-blur-xl border-white/20 (The fundamental "Glass" atom).
	•	Typography: Inter (Sans) for UI, Merriweather (Serif) for Manuscript.
	•	Accent: cyan-500 (Novello Blue) for primary actions; rose-500 for destructive.
B. Component Hierarchy
	1	Atoms: Buttons, Inputs, Avatars, Badges (Pure visual, no logic).
	2	Molecules: SearchBar (Input + Icon), UserCard (Avatar + Name), StatusPill (Badge + Color Logic).
	3	Organisms: ProjectCard (Data-aware), EditorToolbar (State-aware), ChatWindow (Streaming-aware).
	4	Templates: The "Node" Layout (Sidebar + Content Area + Context Panel).
4. Phased Roadmap (The Build Sequence)
🔴 Phase 1: The "Iron Core" (MVP)
Goal: A secure, manual writing tool. No AI yet. Just reliable words.
1.1. Security & Auth (The Gatekeeper)
	•	Requirement: Implement Firebase Auth with Google & Email providers.
	•	Deliverable: Protected Routes (/dashboard, /project/[id]). Unauth users bounce to /login.
	•	Firestore Rules: Strict ownership checks on ALL collections.
1.2. The Dashboard (Home Node)
	•	Features: Create Project, List Projects, Delete Project.
	•	Resilience: Skeleton loaders while fetching Firestore data.
1.3. The Editor (Write Node)
	•	Features: Rich Text input (Tiptap or Slate), Chapter segmentation.
	•	Data Sync: useAutoSave hook that triggers 2 seconds after typing stops.
	◦	Visual: Gold dot appears in nav bar -> Turns Green on success -> Red on fail.
	•	Export: Basic PDF export (client-side jspdf).
1.4. The Bookshelf (Data Node - Lite)
	•	Features: Create strict "Entities" (Characters/Locations).
	•	Logic: CRUD only. No AI tracing yet.
🟠 Phase 2: The "Silicon Mind" (AI Layer)
Goal: Inject intelligence into the secure core.
2.1. The Bridge (Local/Cloud Switch)
	•	Settings: A toggle in User Preferences: "AI Provider" (Ollama vs. Gemini).
	•	Validation: If "Ollama" is selected, ping localhost:11434 to verify connectivity. If fail, force fallback to Gemini (with user consent).
2.2. The Architect (Brainstorm Node)
	•	Input: "Premise" text area.
	•	Action: "Generate Outline" button.
	•	Output: Structured JSON (Chapters list) saved directly to Firestore.
2.3. The Director (Inline Assist)
	•	Feature: Highlight text -> "Rewrite" / "Expand".
	•	UI: A floating "Stitch" menu (Glass morphism) appearing near the cursor.
🟢 Phase 3: The "Living World" (Advanced Features)
Goal: Context awareness and deep polish.
3.1. The Loom (Context Engine)
	•	Logic: A background process that summarizes the last 3 chapters into a "Rolling Context" string (~2k tokens).
	•	Usage: Injected into every prompt to maintain continuity.
3.2. World Bible Integration
	•	Feature: "Mention Detection". When user types @CharacterName, show a hover card with details from the Data Node.
	•	Entity Tracing: Background scan to tag which chapters a character appears in.
3.3. Advanced Publishing
	•	Feature: True EPUB export (using epub-gen server-side or robust client library).
	•	Compliance: "Passive Voice" highlighter toggle.
5. Detailed Specifications
A. Data Models (TypeScript)
CRITICAL: All models must include userId to simplify Firestore Rules.
Project
interface Project {
  id: string;
  userId: string; // OWNER
  title: string;
  genre: string;
  synopsis: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  wordCount: number;
  coverImage?: string; // URL
  settings: {
    aiProvider: 'ollama' | 'gemini';
    modelName: string; // e.g., 'llama3', 'gemini-1.5-pro'
  };
}

Chapter
interface Chapter {
  id: string;
  projectId: string; // Parent Link
  userId: string; // OWNER (Redundant but vital for Security Rules)
  title: string;
  content: string; // HTML or Markdown
  order: number; // Sorting index (0, 1, 2...)
  status: 'draft' | 'review' | 'final';
  lastSummary?: string; // For The Loom context
}

Entity (Codex)
interface Entity {
  id: string;
  projectId: string; // Parent Link
  userId: string; // OWNER (Redundant but vital for Security Rules)
  name: string;
  type: 'Character' | 'Location' | 'Item' | 'Lore';
  description: string;
  // Dynamic fields for "The Loom" to update
  appearances: string[]; // Array of Chapter IDs
}

B. Environment Variables (Strict Validation)
Implementation: Use t3-env or a simple env.ts validation script on build.
	•	NEXT_PUBLIC_FIREBASE_API_KEY
	•	NEXT_PUBLIC_FIREBASE_PROJECT_ID
	•	GEMINI_API_KEY (Server-side only)
	•	STRIPE_SECRET_KEY (Server-side only)
6. Migration Strategy: "Clean Slate"
We are NOT migrating code. We are migrating assets.
Reference Only:
	•	Old Component Library (for visual reference only).
	•	Old Prompts (copy text to new lib/prompts.ts).
Do Not Copy:
	•	Old Authentication Hooks.
	•	Old useAutoSave.
	•	Old Firestore service calls.
7. Success Criteria
	1	Security: A penetration test on Firestore reveals NO unauthorized reads.
	2	Reliability: Disconnecting Wi-Fi while writing triggers a "Offline - Changes queued" notification, not a crash.
	3	Utility: A user can write, save, and export a 5-chapter EPUB without touching the code.
