# Novello AI UAT Environment

This directory houses the comprehensive User Acceptance Testing (UAT) suite for Novello AI. It guarantees the application functions correctly **offline** without relying on ANY external paid LLMs or egress network requests.

## Test Philosophy
1. **Headless Validations**: Tests data layer, Firestore security rules, Token logging, and strict API Contracts using Vitest.
2. **LLM Judge**: Employs `phi3.5:3.8b-mini-instruct-q5_K_M` running locally via Ollama to systematically evaluate JSON outputs and tool-calling boundaries.
3. **No-Egress Guard**: Deeply monkey-patches `fetch` in both Node processes and the Playwright browser to aggressively intercept and strictly abort any network request leaving `localhost` or Docker.
4. **Headed Validations**: Full end-to-end component interaction tests mapped to every screen using Playwright.

## Prerequisites
- Node `v20+`
- `pnpm`
- Docker Desktop (for Redis, emulators, etc.)
- Ollama local daemon installed with the following models pulled:
  - `ollama pull phi3.5:3.8b-mini-instruct-q5_K_M`

## Commands

### `pnpm uat:all`
Spins up the entire UAT infrastructure (Firebase Emulators, Redis, Next.js, Workers), seeds the database, executes the Headless suite, executes the Headed suite, and then cleanly tears down the Docker stack. **(Run this before every PR).**

### Single Commands
*   **`pnpm uat:up`**: Boots up `docker-compose.uat.yml`.
*   **`pnpm uat:down`**: Stops and clears UAT volumes.
*   **`pnpm uat:seed`**: Rebuilds `uat/.seed.json` mappings and wipes/inserts known fixtures into the local Firebase emulator.
*   **`pnpm uat:headless`**: Runs just the Vitest backend API validations.
*   **`pnpm uat:headed`**: Runs the Playwright graphical validations.

## Traceability & Artifacts
Playwright creates visual step-by-step traces, while Vitest logs jUnit results. These are outputted into `/uat/artifacts/`.
