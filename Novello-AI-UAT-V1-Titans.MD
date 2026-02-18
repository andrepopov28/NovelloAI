# Novello AI — Full Frontend UAT V1
## "Titan Inc. — The Rise of the 100x Human"
**Test Type:** End-to-End User Acceptance Testing (UAT)
**Scope:** Every button, every function, every module — one complete book
**AI Provider:** Google Gemini 2.0 Flash (API key pre-configured in `.env.local`)
**Brief:** `Titans-Book-Brief.MD` — Nonfiction strategy, DREAM framework, 9 chapters
**Date:** 2026-02-18
**Tester:** Andre Popov

---

## Pre-Flight Checklist

Before starting, verify:

- [ ] Dev server running: `npm run dev` (port 3005)
- [ ] Gemini API key set in `.env.local` (`GEMINI_API_KEY=AIzaSyDFhZL71bEOt107RZMkcayWbSp6D5pKtq0`)
- [ ] `AI_PROVIDER=gemini` in `.env.local`
- [ ] Firebase Auth working (can log in)
- [ ] Browser: Chrome or Safari, desktop viewport ≥ 1280px

---

## UJ-000 — Global Navigation & Theme

**Goal:** Verify the global header, theme picker, and navigation work correctly.

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 000.1 | Open `http://localhost:3005` | Landing page loads, no console errors | | |
| 000.2 | Click **Log In** | Redirected to `/login` | | |
| 000.3 | Log in with valid credentials | Redirected to `/app` dashboard | | |
| 000.4 | Verify 6 module cards visible | Write, Brainstorm, Data (Codex), Audiobook, Publish, Settings | | |
| 000.5 | Click **Theme Picker** in header | Dropdown opens with 9 theme options | | |
| 000.6 | Select **Warm E-Ink** theme | UI switches to cream/serif aesthetic, module images change | | |
| 000.7 | Select **Dark** theme | UI reverts to dark mode | | |
| 000.8 | Refresh page | Theme persists (stored in localStorage) | | |
| 000.9 | Click each nav item in sidebar | Routes load without 404 | | |
| 000.10 | Click **Novello AI** logo | Returns to `/app` dashboard | | |

---

## UJ-001 — Settings: Configure Gemini as Default AI

**Goal:** Set Gemini as the active AI provider via the Settings UI.
**Route:** `/settings/ai`

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 001.1 | Navigate to **Settings → AI & Models** | Settings page loads, Ollama status scanning | | |
| 001.2 | Observe Ollama status badge | Shows "Offline" (Ollama not running) or "Connected" | | |
| 001.3 | Click **Gemini (Cloud)** provider button | Button highlights with gold accent border | | |
| 001.4 | In Gemini API Key field, enter: `AIzaSyDFhZL71bEOt107RZMkcayWbSp6D5pKtq0` | Key accepted (masked with `•••`) | | |
| 001.5 | Click **Test** button next to API key | Status badge changes to "Connected" with green indicator | | |
| 001.6 | Select **Gemini 2.0 Flash** model card | Card highlights with gold border + checkmark | | |
| 001.7 | Refresh page | Settings persist (stored in localStorage) | | |
| 001.8 | Navigate away and return | Provider still shows Gemini, API key still populated | | |

---

## UJ-002 — Settings: Profile & Appearance

**Goal:** Verify all settings sub-pages load and save correctly.

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 002.1 | Navigate to **Settings → Profile** | Profile page loads with display name and avatar | | |
| 002.2 | Edit display name to "Andre Popov" | Input accepts text | | |
| 002.3 | Click **Save Changes** | Toast: "Profile updated" | | |
| 002.4 | Navigate to **Settings → Security** | Security page loads (email, password change) | | |
| 002.5 | Navigate to **Settings → Themes** | Theme settings page loads | | |
| 002.6 | Navigate to **Settings → Storage** | Storage usage page loads | | |
| 002.7 | Click **Settings** module card on dashboard | Navigates to `/settings` hub | | |

---

## UJ-003 — Create New Project (Titans Book)

**Goal:** Create the Titans book project with correct metadata.
**Route:** `/app/write` → New Project

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 003.1 | Click **Write** module card on dashboard | Navigates to `/app/write` (project list) | | |
| 003.2 | Click **New Project** or **+** button | New project modal/form opens | | |
| 003.3 | Enter Title: `Titan Inc. – The Rise of the 100x Human` | Title accepted | | |
| 003.4 | Select Genre: `Nonfiction / Strategy` | Genre set | | |
| 003.5 | Enter Synopsis: *"In an age where intelligence is automated, human leverage shifts from technical skill to timeless principles. The future belongs to individuals who architect themselves as scalable systems."* | Synopsis accepted | | |
| 003.6 | Click **Create Project** | Project created, redirected to project page `/project/[id]` | | |
| 003.7 | Verify project appears in project list | Project card visible with title and word count = 0 | | |

---

## UJ-004 — Project Settings

**Goal:** Configure project-level AI settings.
**Route:** `/project/[id]/settings`

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 004.1 | Navigate to project **Settings** tab | Settings page loads | | |
| 004.2 | Verify AI Provider shows **Gemini** | Inherited from global settings | | |
| 004.3 | Set Temperature to **0.8** | Slider/input accepts value | | |
| 004.4 | Set Author Name: `Andre Popov` | Field accepts text | | |
| 004.5 | Set Language: `English` | Field accepts value | | |
| 004.6 | Click **Save Settings** | Toast: "Settings saved" | | |

---

## UJ-005 — Brainstorm Module: Mind Map & Post-It Notes

**Goal:** Use the Brainstorm module to generate ideas for the Titans book.
**Route:** `/project/[id]/brainstorm`

### 5A — Mind Map

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 005.1 | Click **Brainstorm** tab in project nav | Brainstorm page loads | | |
| 005.2 | Click **New Mind Map** or **+** button | Mind map canvas opens | | |
| 005.3 | Set central node: `100x Human OS` | Central node created | | |
| 005.4 | Click **AI Generate** / **Expand** button | Gemini generates 5 child nodes based on DREAM framework | | |
| 005.5 | Verify nodes: Direction, Relevance, Emotional Control, Agency, Meaning | All 5 DREAM pillars appear as branches | | |
| 005.6 | Click on **Direction** node | Node selected/expanded | | |
| 005.7 | Click **Add Child** or **Expand** on Direction | Gemini generates sub-nodes: "Clarity of purpose", "Strategic vision", "Anti-drift" | | |
| 005.8 | Drag a node to reposition | Node moves on canvas | | |
| 005.9 | Click **Save Mind Map** | Mind map saved, toast confirmation | | |
| 005.10 | Zoom in/out on canvas | Canvas zooms smoothly | | |

### 5B — Post-It Notes

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 005.11 | Click **Post-It Notes** tab or **+** button | Post-it board opens | | |
| 005.12 | Click **Add Note** | New blank post-it appears | | |
| 005.13 | Type: `"Smart used to be scarce. Now it's rented by the API."` | Text entered in note | | |
| 005.14 | Change note color to yellow | Color picker works | | |
| 005.15 | Add second note: `"Judgment is the premium asset in an age of information abundance."` | Second note created | | |
| 005.16 | Add third note: `"The 100x Human uses AI as leverage, not as a replacement."` | Third note created | | |
| 005.17 | Click **AI Generate Ideas** | Gemini generates 3-5 additional insight notes from the Titans brief | | |
| 005.18 | Drag notes to rearrange | Notes move freely on board | | |
| 005.19 | Click **Save** | Notes saved | | |

---

## UJ-006 — Codex (Data Module): Characters & Entities

**Goal:** Build the world bible for the Titans book.
**Route:** `/project/[id]/codex`

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 006.1 | Click **Data** / **Codex** tab | Codex page loads with entity list | | |
| 006.2 | Click **New Entity** or **+** button | Entity creation form opens | | |
| 006.3 | Create Character: Name = `The Engineer`, Type = `Character` | Entity form accepts input | | |
| 006.4 | Description: *"A brilliant engineer who loses leverage overnight when her skill becomes automated. Opens the Introduction chapter."* | Description saved | | |
| 006.5 | Click **AI Expand** or **Generate Description** | Gemini expands the character profile with motivations, appearance, arc | | |
| 006.6 | Click **Save Entity** | Entity saved, appears in list | | |
| 006.7 | Create second entity: Name = `The Founder`, Type = `Character` | Second entity created | | |
| 006.8 | Description: *"A founder who pivots from tactical AI use to long-term vision. Case study in Chapter 2."* | Saved | | |
| 006.9 | Create entity: Name = `The Investor`, Type = `Character` | Third entity created | | |
| 006.10 | Create entity: Name = `The Operator`, Type = `Character` | Fourth entity created | | |
| 006.11 | Create entity: Name = `DREAM Framework`, Type = `Lore` | Lore entity created | | |
| 006.12 | Description: *"Direction, Relevance, Emotional Control, Agency, Meaning — the 5-pillar OS for the 100x Human."* | Saved | | |
| 006.13 | Click on an entity to view detail | Entity detail page loads | | |
| 006.14 | Edit entity description | Inline edit works | | |
| 006.15 | Click **Save** | Changes saved, toast confirmation | | |
| 006.16 | Use **Search** to find "Engineer" | Entity appears in filtered results | | |
| 006.17 | Filter by Type = **Character** | Only character entities shown | | |

---

## UJ-007 — Write Module: Chapter Outline Generation

**Goal:** Generate AI chapter outlines for all 9 chapters.
**Route:** `/project/[id]` → Write tab

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 007.1 | Navigate to project **Write** view | Chapter list visible (empty) | | |
| 007.2 | Click **Generate Outline** or **AI Outline** button | Gemini generates 9 chapter outlines based on project synopsis | | |
| 007.3 | Verify chapters generated: | | | |
| | — Introduction: The Day Intelligence Became Cheap | Chapter card appears | | |
| | — Chapter 1: The Death of Smart | Chapter card appears | | |
| | — Chapter 2: Direction in an Age of Infinite Options | Chapter card appears | | |
| | — Chapter 3: Relevance Is Power | Chapter card appears | | |
| | — Chapter 4: Emotional Control as Alpha | Chapter card appears | | |
| | — Chapter 5: Agency Over Automation | Chapter card appears | | |
| | — Chapter 6: Meaning as the Ultimate Moat | Chapter card appears | | |
| | — Chapter 7: Building Your Personal Flywheel | Chapter card appears | | |
| | — Chapter 8: The Human Premium | Chapter card appears | | |
| 007.4 | Click **Accept Outline** or **Save** | All 9 chapters saved to Firestore | | |
| 007.5 | Verify chapter count shows **9** in project header | Count correct | | |

---

## UJ-008 — Write Module: AI Chapter Writing (~1,000 words each)

**Goal:** Use Gemini to write each chapter. Test every editor control.
**Route:** `/project/[id]/chapters/[cid]`

### 8A — Introduction Chapter (Full Editor Test)

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 008.1 | Click **Introduction** chapter | Chapter editor opens (TipTap) | | |
| 008.2 | Click **Write Chapter** / **AI Generate** button | Gemini generates ~1,000 words for Introduction | | |
| 008.3 | Verify streaming: text appears word-by-word | Streaming works, no timeout | | |
| 008.4 | Verify editor locked during generation | Editor shows `editable={false}`, wait cursor | | |
| 008.5 | After generation: editor unlocks | Editor returns to IDLE state | | |
| 008.6 | Verify word count ≈ 900–1,100 words | Word count displayed in header | | |
| 008.7 | Highlight a paragraph | Selection highlighted | | |
| 008.8 | Click **Rewrite** in inline toolbar | Gemini rewrites selection, Preview Bubble appears | | |
| 008.9 | Click **Apply** in Preview Bubble | Rewritten text replaces selection | | |
| 008.10 | Highlight another sentence | Selection highlighted | | |
| 008.11 | Click **Expand** | Gemini expands the sentence | | |
| 008.12 | Click **Discard** | Original text restored | | |
| 008.13 | Highlight a sentence | Selection highlighted | | |
| 008.14 | Click **Fix Grammar** | Grammar corrected | | |
| 008.15 | Type manually in editor | Text input works | | |
| 008.16 | Wait 3 seconds (autosave debounce) | SAVING indicator appears, then SAVED | | |
| 008.17 | Click **Bold** (B) in toolbar | Selected text becomes bold | | |
| 008.18 | Click **Italic** (I) | Selected text becomes italic | | |
| 008.19 | Click **Heading 1** | Paragraph becomes H1 | | |
| 008.20 | Click **Heading 2** | Paragraph becomes H2 | | |
| 008.21 | Click **Bullet List** | List created | | |
| 008.22 | Click **Numbered List** | Numbered list created | | |
| 008.23 | Click **Undo** (Cmd+Z) | Last action undone | | |
| 008.24 | Click **Redo** (Cmd+Shift+Z) | Action redone | | |
| 008.25 | Click **Change Status** → **Review** | Chapter status changes to "Review" | | |
| 008.26 | Navigate back to chapter list | Introduction shows word count | | |

### 8B — Chapters 1–8 (AI Write, Verify)

For each remaining chapter, perform the following abbreviated test:

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 008.27 | Open **Chapter 1: The Death of Smart** | Editor opens | | |
| 008.28 | Click **Write Chapter** | Gemini writes ~1,000 words on IQ commoditization, judgment premium | | |
| 008.29 | Verify autosave triggers | SAVED indicator appears | | |
| 008.30 | Open **Chapter 2: Direction** | Editor opens | | |
| 008.31 | Click **Write Chapter** | Gemini writes ~1,000 words on strategic clarity, founder case study | | |
| 008.32 | Open **Chapter 3: Relevance** | Editor opens | | |
| 008.33 | Click **Write Chapter** | Gemini writes ~1,000 words on leverage, incentive structures | | |
| 008.34 | Open **Chapter 4: Emotional Control** | Editor opens | | |
| 008.35 | Click **Write Chapter** | Gemini writes ~1,000 words on ego, panic cycles, psychological stability | | |
| 008.36 | Open **Chapter 5: Agency** | Editor opens | | |
| 008.37 | Click **Write Chapter** | Gemini writes ~1,000 words on delegation vs abdication, initiative | | |
| 008.38 | Open **Chapter 6: Meaning** | Editor opens | | |
| 008.39 | Click **Write Chapter** | Gemini writes ~1,000 words on burnout, long-term narrative | | |
| 008.40 | Open **Chapter 7: Personal Flywheel** | Editor opens | | |
| 008.41 | Click **Write Chapter** | Gemini writes ~1,000 words on leverage audit, human-AI workflow | | |
| 008.42 | Open **Chapter 8: The Human Premium** | Editor opens | | |
| 008.43 | Click **Write Chapter** | Gemini writes ~1,000 words on leadership, trust, reputation compounding | | |
| 008.44 | Return to project view | Total word count ≈ 9,000 words | | |

---

## UJ-009 — Continuity Checker

**Goal:** Run the AI continuity checker on the completed manuscript.
**Route:** `/project/[id]/continuity`

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 009.1 | Navigate to **Continuity** tab | Continuity page loads | | |
| 009.2 | Click **Run Continuity Check** | Gemini analyzes all 9 chapters for inconsistencies | | |
| 009.3 | Verify loading state | Spinner/progress indicator shown | | |
| 009.4 | Verify report generated | List of continuity alerts (if any) or "No issues found" | | |
| 009.5 | If alerts exist: click on an alert | Alert detail shows source excerpt and flagged excerpt | | |
| 009.6 | Click **Dismiss** on an alert | Alert marked as dismissed | | |
| 009.7 | Click **Resolve** on an alert | Alert marked as resolved | | |
| 009.8 | Click **Run Again** | New continuity check runs | | |

---

## UJ-010 — Audiobook Module: Record Chapter 1

**Goal:** Generate audiobook for Introduction chapter using "The Bard" voice.
**Route:** `/project/[id]/audiobook`

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 010.1 | Navigate to **Audiobook** tab | Audiobook page loads with chapter list | | |
| 010.2 | Verify all 9 chapters listed | Chapter list matches project chapters | | |
| 010.3 | Click **Voice Selection** or voice picker | Voice picker opens with 10 Piper voices | | |
| 010.4 | Select **"The Bard"** (en_US-libritts-high, Male, High quality) | Voice selected, highlighted | | |
| 010.5 | Click **Preview** on "The Bard" | Short audio preview plays | | |
| 010.6 | Select **Introduction** chapter only | Chapter checkbox checked | | |
| 010.7 | Click **Generate Audio** or **Record** | TTS generation starts for Introduction | | |
| 010.8 | Verify progress indicator | "Generating..." status shown | | |
| 010.9 | After generation: click **Play** | Audio plays in browser player | | |
| 010.10 | Verify playback controls: Play/Pause | Controls work | | |
| 010.11 | Verify playback controls: Seek bar | Seek works | | |
| 010.12 | Verify playback controls: Volume | Volume control works | | |
| 010.13 | Click **Download** audio | Audio file downloads | | |
| 010.14 | Verify other chapters show "Pending" status | Only Introduction is generated | | |

---

## UJ-011 — Publish Module: Metadata & EPUB Export

**Goal:** Fill in all publishing metadata and export as EPUB.
**Route:** `/project/[id]/publish`

### 11A — Metadata

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 011.1 | Navigate to **Publish** tab | Publish dashboard loads | | |
| 011.2 | Verify Title pre-filled: `Titan Inc. – The Rise of the 100x Human` | Title correct | | |
| 011.3 | Set Author: `Andre Popov` | Field accepts input | | |
| 011.4 | Set Genre: `Nonfiction / Strategy` | Field accepts input | | |
| 011.5 | Set Language: `English` | Field set | | |
| 011.6 | Set Keywords: `AI, human performance, strategy, DREAM framework, 100x` | Keywords entered | | |
| 011.7 | Click **Generate Blurb** (AI) | Gemini generates a marketing blurb for the book | | |
| 011.8 | Verify blurb appears in text area | Blurb generated, editable | | |
| 011.9 | Edit blurb if needed | Inline editing works | | |
| 011.10 | Click **Generate Cover** (AI) | Cover image generation triggered (or placeholder shown) | | |
| 011.11 | Click **Save Metadata** | Toast: "Metadata saved" | | |

### 11B — EPUB Export

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 011.12 | Click **Export as EPUB** button | Export starts | | |
| 011.13 | Verify loading state | "Generating EPUB..." indicator | | |
| 011.14 | After export: download prompt appears | Browser download dialog opens | | |
| 011.15 | Download the EPUB file | File saved locally | | |
| 011.16 | Open EPUB in reader (e.g., Apple Books) | All 9 chapters present, metadata correct | | |
| 011.17 | Verify author name = "Andre Popov" | Not "Author" (BUG-002 regression check) | | |
| 011.18 | Click **Export as PDF** button | PDF export starts | | |
| 011.19 | Download PDF | File saves | | |
| 011.20 | Open PDF | All chapters present, correct formatting | | |

---

## UJ-012 — AI Sidebar & Agent Chat

**Goal:** Test the AI sidebar chatbox (AgentChatbox) in the editor.

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 012.1 | Open any chapter in editor | AI Sidebar visible on right | | |
| 012.2 | Type in AI chat: `"What is the central thesis of this book?"` | Gemini responds with thesis from context | | |
| 012.3 | Type: `"Suggest a stronger opening line for this chapter"` | Gemini suggests an opening line | | |
| 012.4 | Type: `"What characters have appeared in this chapter?"` | Gemini references Codex entities | | |
| 012.5 | Click **Clear Chat** | Chat history cleared | | |
| 012.6 | Verify chat persists across chapter navigation | History maintained per session | | |

---

## UJ-013 — Series Management (Optional)

**Goal:** Test series creation if applicable.
**Route:** `/series`

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 013.1 | Navigate to **Series** page | Series list loads | | |
| 013.2 | Click **New Series** | Series creation form opens | | |
| 013.3 | Enter name: `Titan Series` | Field accepts input | | |
| 013.4 | Add Titans book to series | Project linked to series | | |
| 013.5 | Save series | Series saved | | |

---

## UJ-014 — Mobile Responsiveness

**Goal:** Verify the app works on mobile viewport.

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 014.1 | Resize browser to 375px width (iPhone) | Layout switches to mobile | | |
| 014.2 | Verify Bottom Tab Bar appears | Outline / Write / AI tabs visible | | |
| 014.3 | Tap **Write** tab | Editor pane shown | | |
| 014.4 | Tap **AI** tab | AI sidebar shown | | |
| 014.5 | Tap **Outline** tab | Chapter outline shown | | |
| 014.6 | Verify no horizontal scroll | Content fits viewport | | |

---

## UJ-015 — Error Handling & Edge Cases

**Goal:** Verify graceful error handling.

| # | Action | Expected Result | Pass/Fail | Notes |
|---|---|---|---|---|
| 015.1 | Disconnect internet mid-generation | Editor shows OFFLINE state, localStorage fallback | | |
| 015.2 | Reconnect internet | Editor resumes, sync resumes | | |
| 015.3 | Enter invalid Gemini API key in Settings | Test button shows "Error" badge | | |
| 015.4 | Click **Write Chapter** with empty synopsis | Graceful error or fallback prompt used | | |
| 015.5 | Navigate to non-existent project URL | 404 or redirect to project list | | |
| 015.6 | Log out during autosave | No crash, auth check prevents orphaned save | | |
| 015.7 | Click **Log Out** in header | Redirected to `/login`, session cleared | | |

---

## UAT Sign-Off

| Module | Status | Issues Found | Tester |
|---|---|---|---|
| UJ-000 Global Navigation | | | |
| UJ-001 AI Settings (Gemini) | | | |
| UJ-002 Profile & Appearance | | | |
| UJ-003 Project Creation | | | |
| UJ-004 Project Settings | | | |
| UJ-005 Brainstorm (Mind Map + Post-Its) | | | |
| UJ-006 Codex (Entities) | | | |
| UJ-007 Chapter Outline Generation | | | |
| UJ-008 Chapter Writing (9 chapters) | | | |
| UJ-009 Continuity Checker | | | |
| UJ-010 Audiobook (Chapter 1, The Bard) | | | |
| UJ-011 Publish (Metadata + EPUB + PDF) | | | |
| UJ-012 AI Sidebar Chat | | | |
| UJ-013 Series Management | | | |
| UJ-014 Mobile Responsiveness | | | |
| UJ-015 Error Handling | | | |

**Overall Status:** ☐ PASS  ☐ FAIL  ☐ PARTIAL

**Sign-off:** _________________________ Date: _____________

---

## Appendix A — Gemini Configuration Reference

| Setting | Value |
|---|---|
| API Key | `AIzaSyDFhZL71bEOt107RZMkcayWbSp6D5pKtq0` |
| Default Model | `gemini-2.0-flash` |
| Set in | `.env.local` (server) + Settings → AI & Models (client localStorage) |
| Provider key | `gemini` |
| Fallback | Ollama (if configured) |

**To set Gemini in the UI:**
1. Go to Settings → AI & Models
2. Click **Gemini (Cloud)** provider button
3. Paste API key → click **Test**
4. Select **Gemini 2.0 Flash** model

---

## Appendix B — Titans Book Chapter Summary

| Chapter | Title | DREAM Pillar | Target Words |
|---|---|---|---|
| Intro | The Day Intelligence Became Cheap | — | 1,000 |
| 1 | The Death of Smart | — | 1,000 |
| 2 | Direction in an Age of Infinite Options | D | 1,000 |
| 3 | Relevance Is Power | R | 1,000 |
| 4 | Emotional Control as Alpha | E | 1,000 |
| 5 | Agency Over Automation | A | 1,000 |
| 6 | Meaning as the Ultimate Moat | M | 1,000 |
| 7 | Building Your Personal Flywheel | All | 1,000 |
| 8 | The Human Premium | All | 1,000 |
| **Total** | | | **~9,000 words** |

---

## Appendix C — Voices Available for Audiobook

| Voice ID | Name | Gender | Quality | Best For |
|---|---|---|---|---|
| piper-lessac | The Director | Male | Medium | Narration |
| **piper-libritts** | **The Bard** ⭐ | **Male** | **High** | **Titans book** |
| piper-architect | The Architect | Male | Medium | Structure |
| piper-curator | The Curator | Female | Medium | Data |
| piper-overseer | The Overseer | Female | High | Authority |
| piper-amy | Soft Storyteller | Female | Medium | Emotional |
| piper-southern-female | The Gentlewoman | Female | Low | British |
| piper-vctk-neutral | Neutral Reporter | Neutral | Medium | Formal |
| piper-librispeech-high | Epic Narrator | Male | High | Drama |
| piper-publisher | The Publisher | Male | High | Final review |
