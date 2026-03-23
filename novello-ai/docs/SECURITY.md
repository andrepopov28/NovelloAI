# Novello AI — Security Policy & Audit Log

**Last Audit:** 2026-03-12 | **Auditor:** Antigravity AI

---

## Current Security Status

| Area | Status | Notes |
|------|--------|-------|
| Command Injection (TTS) | ✅ Fixed | `execFile` + `SAFE_VOICE_ID` whitelist |
| XSS in PDF Export | ✅ Fixed | `escapeHtml()` now applied to `ch.content` |
| Auth Bypass (dev mode) | ✅ Fixed | Bypass removed from `firebase-admin.ts` |
| Project Ownership — EPUB | ✅ Fixed | `userId` check added |
| Project Ownership — PDF | ✅ Fixed | `userId` check added |
| Project Ownership — Continuity | ✅ Fixed | `userId` check via Admin SDK |
| Project Ownership — Trace | ✅ Fixed | `userId` check via Admin SDK |
| Firestore Rules (chapters) | ✅ Fixed | Owner-scoped via `userId` field |
| Firestore Rules (entities) | ✅ Fixed | Owner-scoped via `userId` field |
| Firestore Rules (series) | ✅ Fixed | Owner-scoped via `userId` field |
| HTTP Security Headers | ✅ Fixed | CSP, X-Frame-Options, nosniff, XSS-Protection |
| Input Length Cap (prompts) | ✅ Fixed | `z.string().max(50_000)` in generate route |
| Multi-provider AI cascade | ✅ Done | Ollama only |
| Rate Limiting | 🔜 V34 | Upstash planned |

---

## Environment Keys

Keys are stored in `.env.local` (gitignored). Never commit real keys.

| Key | Provider | Scope |
|-----|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase | Client-safe (domain-restricted) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin | Server-side only (optional, uses ADC by default) |

---

## Firestore Security Model

All collections enforce `resource.data.userId == request.auth.uid`.
The Admin SDK (server-side only) bypasses client rules for background workers.

---

## Not In Scope (Solo Local Deployment)

- Rate limiting (no multi-user abuse surface)
- Cross-user enumeration attacks
- Prompt injection from untrusted users
