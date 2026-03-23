# UAT CATALOG

## A) UAT Test Harness
- [x] Create /uat/headless and /uat/headed folders.
- [x] Add a seed system that generates stable test fixtures and stores IDs in uat/.seed.json.
- [x] Add a single command interface in package.json (uat:up, uat:seed, uat:headless, uat:headed, uat:all, uat:down).

## B) Docker UAT Stack
- [x] Create docker-compose.uat.yml (firebase emulator, redis, workers, app).
- [x] Provide .env.uat with all emulator endpoints and UAT flags.

## C) Headless UAT Coverage
- [x] 1) Security rules: unauth denied, owner CRUD, cross-tenant denied, all relevant collections and subcollections.
- [x] 2) API contract tests: Validate status codes and strict zod schemas, deny unknown keys for routes (/audiobook, /cancel, /voices/preview).
- [x] 3) Agentic AI tool-calling: Validate JSON tool-call extraction matching strict Schema via LLM Judge (phi3.5) and verify simulated logic.
- [x] 4) Worker pipelines: Simulate voice clone status transitions and Audiobook processing states.
- [x] 5) Token/cost monitor integrity: Token events written correctly; Local API calls permitted while global rules deny external fetches.

## D) Headed UAT (Playwright)
- [x] Auth (login/logout, guards)
- [x] Dashboard (/app) 
- [x] Write/Editor (/project/[id]) including typing auto-save
- [x] Brainstorm (outline generator layout, whiteboard visibility, mind map nodes)
- [x] Codex entity UI CRUD visibility
- [x] Audiobook generation panel visibility
- [x] Settings (AI Token usage, Voice Library creation wizards, Agentic Teams)
- [x] Global QA gates: fail on console.error, intercept and fail external network requests (No-Egress limit).

## E) LLM INTEGRATION DETAILS
- [x] Implement a small "LLM Judge" helper module used ONLY for structured checks (`uat/scripts/llmJudge.ts`) using phi3.5 via Ollama.
- [x] Use the judge only to validate JSON correctness.
- [x] Do NOT rely on the LLM for core test assertion correctness; always assert by simulated data/state logic.

## F) IMPLEMENTATION REQUIREMENTS
- [x] Use zod for strict schemas in core routes.
- [x] Create "no-egress" node guard patching global fetch.
- [x] Create Playwright route interception guard.
- [x] Traces and screenshots to /uat/artifacts.
