# Novello AI — Architecture Overview

**Version:** V33 | **Stack:** Next.js 16 + Firebase + Vercel AI SDK

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Browser (Next.js 15.1.0 App Router)                     │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  │
│  │ /app    │  │/project │  │/settings │  │ /publish │  │
│  │Dashboard│  │ Editor  │  │ Hub      │  │          │  │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  │
└───────┼────────────┼────────────┼───────────────┼────────┘
        │            │            │               │
┌───────▼────────────▼────────────▼───────────────▼────────┐
│  Next.js API Routes (/api/*)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ /ai/*    │ │/export/* │ │/voice/*  │ │/ollama/ping│  │
│  │generate  │ │epub, pdf │ │tts,train │ │            │  │
│  │audiobook │ └────┬─────┘ └────┬─────┘ └────────────┘  │
│  │continuity│      │            │                        │
│  │trace     │      │            │                        │
│  └────┬─────┘      │            │                        │
└───────┼────────────┼────────────┼───────────────────────-┘
        │            │            │
┌───────▼────────────▼────────────▼────────────────────────┐
│  Core Services (Local-First)                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐  │
│  │ AI Providers         │  │ Local Stubs (Firebase)    │  │
│  │ Ollama (local)       │  │ localStorage + Stubs      │  │
│  └──────────────────────┘  └──────────────────────────┘  │
│                                                          │
│                             │ Background Workers        │  │
│                             │ Node.js Scripts           │  │
│                             │ audiobookWorker           │  │
│                             │ voiceCloneWorker          │  │
│                             └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/ai.ts` | Multi-provider AI routing cascade |
| `src/lib/firebase-admin.ts` | Server-side Firebase local stub (replaces firebase-admin) |
| `src/lib/firebase.ts` | Client-side Firebase local stub (replaces firebase sdk) |
| `src/lib/loom-engine.ts` | Context assembly for AI prompts |
| `src/lib/firestore.ts` | Typed Firestore helpers |
| `firestore.rules` | Security rules (all collections owner-scoped) |
| `next.config.ts` | Security headers + image domains |
| `.env.local` | API keys (gitignored) |
| `docker-compose.uat.yml` | UAT stack (emulators + Redis + workers) |

---

## AI Provider Cascade

```
AI_PROVIDER=auto

Ollama → always available (local, offline-safe)
```

---

## Firestore Collections

| Collection | Access Control |
|------------|---------------|
| `users/{userId}/**` | Owner only (uid match) |
| `projects/{id}` | Owner only (userId field) |
| `chapters/{id}` | Owner only (userId field) |
| `entities/{id}` | Owner only (userId field) |
| `series/{id}` | Owner only (userId field) |
| `exports/{id}` | Owner only (userId field) |
| `voice_catalog/{id}` | Read: any auth user; Write: Admin SDK only |
