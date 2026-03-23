# Novello AI — Startup Checklist

Every frontend and backend run must review this index before starting work.

---

## Required Reading by Role

### Frontend Dev
| Doc | Why |
|-----|-----|
| [PRD-V33.md](./PRD-V33.md) | Current feature scope and UI specifications |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Route structure and component hierarchy |
| [ROADMAP.md](./ROADMAP.md) | What's done, what's next |
| [SMOKE-TEST.md](./SMOKE-TEST.md) | Quick manual test checklist before commits |

### Backend / API Dev
| Doc | Why |
|-----|-----|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | API routes, Firestore model, AI cascade |
| [SECURITY.md](./SECURITY.md) | All resolved issues + open items — read before touching any API route |
| [UAT-CATALOG.md](./UAT-CATALOG.md) | Test coverage expectations per endpoint |
| [VOICE-AUDIT.md](./VOICE-AUDIT.md) | Voice API audit results |

---

## Environment Setup

```bash
# 1. Copy env (if fresh clone)
cp .env.example .env.local  # then fill in keys

# 2. Install dependencies
npm install

# 3. Start dev server (port 3005)
npm run dev

# 4. Start background workers (separate terminal)
node src/workers/audiobookWorker.js
```

---

## AI Provider Priority

The app auto-selects the highest-priority configured provider:

```
OpenRouter (free OSS) → Groq (free fast) → Gemini (free Flash) → Ollama (local)
```

Set `AI_PROVIDER=auto` in `.env.local` (default). Override to force a provider: `AI_PROVIDER=ollama`.

---

## Pre-Commit Checklist

- [ ] `npx tsc --noEmit` passes with no new errors
- [ ] Manual smoke test on write node, AI generation, and export
- [ ] No API keys hardcoded in source files
- [ ] Firestore rules not weakened

---

## Key URLs (Local)

| Service | URL |
|---------|-----|
| App | http://localhost:3005 |
| Ollama | http://localhost:11434 |
| Voice Bridge | http://localhost:5002 |
| Firebase Emulator UI | http://localhost:4000 (UAT only) |
