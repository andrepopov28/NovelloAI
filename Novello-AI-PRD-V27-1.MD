Novello AI — PRD v27.1 (Build-Ready)
The "Adversarial-Hardened" Specification
Status: Build-Ready (Red Team Patched)
Supersedes: v27
1. SYSTEM CONTEXT & CORE PHILOSOPHY
Novello is an AI-native manuscript development platform. The AI acts as a "World-Aware" co-author with direct read/write access to the manuscript and character database.
1.1 Success Criteria (The "Definition of Done")
	1	Sync Reliability: Word counts must aggregate across chapters.
	2	State Safety: AI and User cannot edit the same paragraph simultaneously.
	3	Context Depth: The AI must have "Memory" of the entire current chapter.
	4	Responsive Integrity: The app must be fully functional on mobile devices via tabbed navigation.
2. USER STORY MAPPING (The Happy Paths)
Flow 1: The "Zero-to-Hero" Project Creation
	•	Standard Path: Create Project → Define Genre/Synopsis → Automated First Chapter Creation.
Flow 2: The Co-Authoring Loop (Updated for v27.1)
	•	Trigger: User highlights text and triggers "AI Rewrite."
	•	Logic: 1. Locking: The Editor enters GENERATING state. Input is disabled. 2. Context: System sends Project Metadata + Full Chapter Text + Selection to LLM. 3. Streaming: AI response streams into a "Preview Bubble." 4. Resolution: User clicks "Apply" or "Discard." 5. Unlock: Editor returns to IDLE state and triggers debounced Autosave.
3. TECH STACK & ARCHITECTURE
	•	Frontend: Next.js 14+ (App Router), Tailwind CSS.
	•	Panels: react-resizable-panels for the desktop IDE feel.
	•	Editor: TipTap (Headless ProseMirror).
	•	Backend: Firebase (Auth, Firestore, Cloud Functions).
	•	AI: Vercel AI SDK (Streaming) + Gemini 1.5 Pro/Flash.
4. DATA STRATEGY & SCHEMA
4.1 Aggregation Strategy (Fix for S0-3)
Requirement: The wordCount in the Project document must remain in sync with the sum of all chapter word counts.
	•	Implementation: A Firebase Cloud Function onUpdate listener on the chapters collection.
	•	Logic: Whenever a chapter's content changes, the function recalculates the sum of wordCount for that projectId and updates the parent Project document.
4.2 Core Models (Updated)
	•	Project: Added totalChapters: number.
	•	Chapter: Added wordCount: number (calculated on server-side save).
5. UI/UX SPECIFICATIONS (The Four States)
5.1 Responsive Layout (Fix for S1-2)
	•	Desktop (>= 1024px): 3-pane layout (Nav | Editor | AI Sidebar) using react-resizable-panels.
	•	Mobile (< 1024px): Single-pane view with a Bottom Navigation Tab Bar:
	1	Outline (Nav)
	2	Write (Editor)
	3	AI (Chat)
	•	State: The "Active Tab" is stored in local component state.
5.2 The Editor State Machine (Fix for S0-4)
	1	IDLE: Standard editing mode.
	2	SAVING: Small indicator in top-right. Input still enabled.
	3	GENERATING: AI is processing.
	◦	Editor is set to editable={false}.
	◦	Cursor shows "Wait" icon.
	◦	AI Sidebar shows streaming text.
	4	OFFLINE: Firestore connection lost. Local storage fallback active.
6. AI & CONTEXT INJECTION (Fix for S0-6)
6.1 Context Payload
The AI prompt must include:
	1	World Bible: Synopsis + Characters + Tone settings.
	2	The Whole Chapter: Send the entirety of the current chapter's text to the LLM.
	◦	Constraint: If chapter > 50,000 words (rare), truncate to last 20,000 words.
	3	Conversation History: Last 5 exchanges in the current session.
7. IMPLEMENTATION CHECKLIST
Phase 1: Foundation
	•	[ ] Firestore RLS Rules (User isolation).
	•	[ ] Next.js Project Scaffolding.
Phase 2: The Core Sync (Critical)
	•	[ ] Implement onUpdate Cloud Function for word count aggregation.
	•	[ ] Verify Dashboard reflects chapter changes in < 2 seconds.
Phase 3: The Editor & AI
	•	[ ] TipTap integration with editable toggle state.
	•	[ ] Vercel AI SDK integration with Gemini 1.5.
	•	[ ] Context Injection logic (Project metadata + full chapter text).
Phase 4: Mobile Optimization
	•	[ ] Implement Tabbed View for mobile.
	•	[ ] Ensure resizable panels only render on Desktop.
8. ERROR HANDLING & EDGE CASES
	•	Logout during Save: useAutosave hook must check auth.currentUser before every fire.
	•	Generation Error: If the AI API fails, the Editor must immediately switch back to editable={true} and show a Toast error.
	•	Empty Project: Dashboard must show a "Start your story" CTA with a "Quick Start" template.
