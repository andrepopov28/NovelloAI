# NovelloAI — Incident Response Playbook

**Status:** Active  
**Version:** 1.0 (Post-V33 Hardening)  
**Scope:** Single-User Local Deployment (Next.js + IDB + Local Ollama)  

This playbook outlines recovery procedures for the NovelloAI local-first, single-user environment. Since the application relies on local IndexedDB and local inference, incident scope is restricted to the local machine environment.

---

## 1. DATA LOSS OR INDEXEDDB CORRUPTION

### Description
The user's chapters or project data does not load, or the browser has cleared the IndexedDB cache unexpectedly.

### Mitigation & Recovery
1. **Restore from Manual Backup:** 
   - Ask the user to navigate to `/settings/data`.
   - Use the **Restore Database** button to upload the latest `.json` backup file.
2. **Local Fallback Extraction:**
   - If no backup exists, check if any PDF or EPUB exports exist in the user's `Downloads` folder to manually copy-paste the manuscript back into a new project.
3. **Prevention:** 
   - The application now includes a recurring prompt (UI) to download full system backups natively as JSON.

---

## 2. OLLAMA INFERENCE TIMEOUT OR FAILURE

### Description
Write Nodes, Outline Generation, or AI Chat hangs in a `GENERATING` state or throws a 500 Network Error.

### Remediation Steps
1. **Verify Ollama is Running:**
   - Command: `curl http://localhost:11434/api/tags`
   - If unreachable, start Ollama via the macOS application or `ollama serve`.
2. **Verify Correct Model is Pulled:**
   - Command: `ollama list`
   - Ensure the configured model (e.g., `llama3` or `qwen2.5`) exists. If not, run `ollama run <model-name>`.
3. **Reset Editor State:**
   - Refresh the browser window. The local IDB state will reload the last auto-saved chunk. The tip-tap `isGenerating` block is memory-bound and will release upon refresh.

---

## 3. AUDIOBOOK TTS (PIPER/FFMPEG) FAILURE

### Description
Audiobook export or voice cloning gets stuck or returns a `500 Server Error` indicating binary missing.

### Remediation Steps
1. **Check FFmpeg Installation:**
   - Command: `which ffmpeg`
   - If missing, run `brew install ffmpeg`.
2. **Check Piper Binary:**
   - Ensure `bin/piper/piper` is present and executable (`chmod +x bin/piper/piper`).
3. **Verify Voice Models:**
   - Ensure `.onnx` and `.onnx.json` files exist in the `/voices` directory for the active narrator.

---

## 4. UI CRASH / BLANK WHITE SCREEN (REACT ERROR BOUNDARY TRIPPED)

### Description
A React render invariant violation completely crashes the view structure (often tied to corrupt Draft-js/TipTap JSON structures in IDB).

### Remediation Steps
1. **Clear Local Storage & Soft Reset:**
   - Open Developer Tools -> Application -> Local Storage. Clear it.
2. **Hard State Clear (If stuck on specific project):**
   - Access IndexedDB in Dev Tools. Delete the specific corrupt chapter row.
3. **Report Bug:**
   - If the crash happens during streaming generation, it is likely a stream chunk parser failing to resolve HTML entities. Pull the latest `main` branch, as V33 included a patch for `localsInner` structure crashes.

---

## 5. REPOSITORY SYNC & DEPLOYMENT ISSUES

### Description
`npm run dev` fails to start, or `npm run build` throws typing lint errors.

### Remediation Steps
1. **Clean Next.js Cache:**
   - Run `rm -rf .next` and restart `npm run dev`.
2. **Re-install Dependencies:**
   - Run `rm -rf node_modules package-lock.json && npm install`.
3. **Bypass Strict Linting (If Critical):**
   - In a solo app context, if a build is blocked by TS `any` errors but runs fine in dev, verify `ignoreDuringBuilds: true` is set in `next.config.ts`.
