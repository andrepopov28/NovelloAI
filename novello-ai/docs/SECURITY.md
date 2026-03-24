# Novello AI — Security Policy & Audit Log

**Last Audit:** 2026-03-24 | **Auditor:** Antigravity AI (Red Team)

---

## Current Security Status

| Area | Status | Notes |
|------|--------|-------|
| **Shell Injection (Voice Preview)** | ✅ Fixed | `exec()` → `execFile()` + `.onnx` regex whitelist in `voices/preview/route.ts` |
| **Command Injection (TTS)** | ✅ Fixed | `execFile` + `SAFE_VOICE_ID` whitelist (pre-existing) |
| **Auth Bypass — Audiobook** | ✅ Fixed | `verifyIdToken(authHeader)` + `decoded.uid` replaces raw header parsing |
| **Auth Bypass — Voice Clone Create** | ✅ Fixed | `verifyIdToken(authHeader)` + `decoded.uid` |
| **Auth Bypass — Audiobook Cancel** | ✅ Fixed | `verifyIdToken(authHeader)` consistent call |
| **verifyIdToken Inconsistency** | ✅ Fixed | All routes pass full `authHeader`; no split/replace parsing |
| **Export Endpoints (EPUB/PDF)** | ✅ Fixed | Routes accept `{ project, chapters }` in body — no Firestore reads |
| **Entity Trace Endpoint** | ✅ Fixed | Route accepts `{ chapters, entities }` in body |
| **Playback Sync (Firebase calls)** | ✅ Fixed | Rewritten to use `localStorage` — no onSnapshot listeners |
| **Voice Clone [id] routes** | ✅ Fixed | Rewritten to use `local-db` IndexedDB |
| **ThemeProvider Missing** | ✅ Fixed | Protected layout now wraps in `<ThemeProvider>` |
| **SSR localStorage crash** | ✅ Fixed | `typeof window` guards in `saveVersion` & `subscribeToVersions` |
| **XSS in PDF Export** | ✅ Fixed | `escapeHtml()` applied to all user content |
| **Input Length Cap (prompts)** | ✅ Fixed | `z.string().max(10_000)` in voice preview; `max(50_000)` in generate route |
| **HTTP Security Headers** | ✅ Fixed | CSP, X-Frame-Options, nosniff, XSS-Protection in `next.config.ts` |
| Rate Limiting | 🔜 Planned | No multi-user abuse surface in local deployment |

---

## Authentication Model (Local-First)

This is a **single-user, local-only deployment**. All auth is handled by `firebase-admin.ts` which returns a static `MOCK_USER` (`uid: 'local-user'`). Every server route calls `verifyIdToken(authHeader)` for consistent behavior and easy future swap to real Firebase Auth if needed.

No real cryptographic token verification is required in single-user mode — but the code path is identical, meaning a production Firebase Auth integration requires only changing the stub.

---

## Data Model (Local-First, No Firestore)

All user data is stored in **IndexedDB** via `local-db.ts` (idb library):

| Store | Key | Description |
|-------|-----|-------------|
| `projects` | `id` | Project metadata |
| `chapters` | `id` | Chapter content (TipTap HTML) |
| `entities` | `id` | Codex world-building entries |
| `series` | `id` | Series groupings |
| `clones` | `id` | Voice clone metadata (added v2) |

Version history and playback positions are stored in `localStorage` (browser-only, SSR guarded).

---

## Environment Keys

Keys stored in `.env.local` (gitignored). No cloud keys required for local deployment.

| Key | Required | Scope |
|-----|----------|-------|
| `OLLAMA_MODEL` | Optional | Default AI model (falls back to `qwen2.5:7b`) |
| `OLLAMA_BASE_URL` | Optional | Ollama API URL (default: `http://localhost:11434`) |

---

## Not In Scope (Solo Local Deployment)

- Rate limiting (no multi-user abuse surface)
- Cross-user enumeration attacks
- Prompt injection from untrusted users
- Firestore security rules (not used)
