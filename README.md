# NovelloAI

Institutional-grade R&D infrastructure for AI-native storytelling and audiobook generation.

## Project Structure

This repository uses a structured root layout to manage core infrastructure and application code:

- **[.github/](.github/)**: Root-level CI/CD workflows and repository automation.
- **[novello-ai/](novello-ai/)**: Core Next.js application, AI engine, and UAT suite.

## Quick Start (Local Development)

```bash
cd novello-ai
npm install
npm run dev
```

## Stability & UAT

NovelloAI maintains a "Headless First" research protocol. Automated UAT is triggered on every push to `main` via GitHub Actions.

To run UAT locally:
```bash
cd novello-ai
npm run uat:up        # Start Firestore emulators & mocks
npm run uat:headless  # Run contract & tool-calling tests
npm run uat:down      # Cleanup
```

## System Standards
- **Core Stacks**: Next.js 15, TypeScript (Strict), TailwindCSS, Firebase Admin.
- **AI Engines**: Ollama (Local), Gemini (Cloud), undici (Hardened).
- **Design**: Stitch Prototyping, Glassmorphism, Premium Motion.

---
© 2026 NovelloAI Research Lab. All rights reserved.
