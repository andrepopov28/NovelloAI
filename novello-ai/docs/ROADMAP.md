# Novello AI — Roadmap

**Last Updated:** 2026-03-12 | **Current Version:** V34.1 (Premium Themes)

---

## ✅ Completed (V33 — Current Build)

| Feature | Status |
|---------|--------|
| Multi-provider AI cascade (OpenRouter → Groq → Gemini → Ollama) | ✅ |
| TipTap rich text editor with AI streaming | ✅ |
| BullMQ audiobook generation worker | ✅ |
| Voice Library + Voice Cloning (Piper TTS) | ✅ |
| Agentic AI Team with tool calling | ✅ |
| Codex world-building database | ✅ |
| Canvas Mind Map (Miro-style) | ✅ |
| Firebase Auth (Email + Google) | ✅ |
| Offline-sync via IndexedDB | ✅ |
| EPUB + HTML/PDF export | ✅ |
| Premium Theme Overhaul (Play, Global, Futuro) | ✅ |
| Legacy Theme Archival (9 themes archived) | ✅ |
| Security hardening (all audit findings resolved) | ✅ |

---

## 🔜 Next — V34

| Feature | Priority | Notes |
|---------|----------|-------|
| Rate limiting middleware (Upstash) | High | Free tier — 10 req/10s per user |
| OpenRouter model picker in Settings/AI | High | Surface top free models in UI |
| Groq model picker | Medium | |
| Stripe payment integration | Medium | `STRIPE_SECRET_KEY` already in env.ts |
| Real Piper TTS training pipeline | Medium | Currently simulated with BullMQ |
| Publisher marketplace (share/discover books) | Low | Multi-user Firestore rules needed first |
| iOS PWA packaging | Low | |

---

## 🗓️ Version History

| Version | Date | Highlights |
|---------|------|-----------|
| V34.1 | 2026-03 | Theme Overhaul: 3 Premium Themes (Play, Global, Futuro) |
| V33 | 2026-02 | Skeuomorphic UI, Ollama-first, TipTap stream fix |
| V32 | 2026-01 | PRD consolidation |
| V31 | 2025-12 | Audiobook BullMQ, Voice Cloning, Agentic AI, Tool Calling |
| V30 | 2025-11 | DB offline sync, security cleanup |
| V29 | 2025-10 | Canvas mind map, TTS picker, settings redesign |
| V28 | 2025-09 | Theme image registry |
