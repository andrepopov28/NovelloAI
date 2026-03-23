# Voice System Audit and Replacement Report

**Date:** February 20, 2026
**Target:** Novello AI TTS Subsystem 
**Status:** ✅ Completed

## 1. Executive Summary
An audit of the Novello AI TTS subsystem revealed multiple critical implementation flaws. The application's "Neural Voices" feature was completely broken because the necessary local neural synthesizers and models were missing from the codebase. The frontend was falling back to legacy browser APIs (`window.speechSynthesis`), resulting in robotic, poor-quality playback that did not reflect the intended premium experience. Furthermore, the backend relied on an undefined `PIPER_TTS_URL`, breaking all audiobook exports.

We have entirely replaced the mock TTS architecture with a robust, commercially-safe, local Piper TTS integration that operates deterministically across all environments (including macOS Apple Silicon).

## 2. Inventory and Quality Audit (Before)

| Voice ID | Intended Engine | Model Path | Status | Subjective Quality | Root Cause of Failure |
|---|---|---|---|---|---|
| piper-lessac | Piper | `en_US-lessac-medium.onnx` | **Broken** | Robotic Browser Fallback | Binary & Models missing |
| piper-libritts | Piper | `en_US-libritts-high.onnx` | **Broken** | Robotic Browser Fallback | Binary & Models missing |
| piper-architect| Piper | `en_US-architect-medium.onnx` | **404 error** | Unusable | Model doesn't exist upstream |
| piper-curator | Piper | `en_US-curator-medium.onnx` | **404 error** | Unusable | Model doesn't exist upstream |
| piper-overseer | Piper | `en_US-overseer-high.onnx` | **404 error** | Unusable | Model doesn't exist upstream |

### Audit Findings:
1. **Frontend Disconnect**: The settings page (`/settings/voice`) lacked UI bindings to display Neural Voices, only supporting system Web Speech API voices.
2. **Missing Dependencies**: The `piper` binary was missing from the repository, and `.onnx` model files were never downloaded.
3. **Invalid Config**: Several configured models (e.g., `architect`, `curator`) did not exist in the official [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices) repository.
4. **Backend Failure**: `src/app/api/voice/tts/route.ts` expected an external URL (`PIPER_TTS_URL`) that was not provisioned, resulting in a persistent HTTP 501.

## 3. Replacement Voice Set (V2)

A new set of 10 high-quality, commercially-safe voices was selected and configured:

- **English (US & GB):**
  - **The Director** (`en_US-lessac-high`, Female, US) - Public Domain
  - **The Narrator** (`en_GB-cori-high`, Female, GB) - Public Domain
  - **The Bard** (`en_US-libritts_r-medium`, Neutral, US) - CC BY 4.0
  - **The Architect** (`en_US-joe-medium`, Male, US) - Public Domain
  - **The Storyteller** (`en_US-ryan-high`, Male, US) - Public Domain
  - **The Journalist** (`en_US-hfc_male-medium`, Male, US) - Public Domain
  - **The Anchor** (`en_GB-alan-medium`, Male, GB) - Public Domain
  - **The Protagonist** (`en_US-kusal-medium`, Male, US) - CC BY 4.0
- **German:**
  - **The Scholar** (`de_DE-thorsten-high`, Male, DE) - Creative Commons Zero
  - **The Author** (`de_DE-pavoque-low`, Male, DE) - CC BY-ND 4.0

*Note: All voices include full `commercialOk` and provenance tracking directly in `voices-config.ts`.*

## 4. Implementation Details

1. **Deterministic Downloads (`scripts/downloadVoices.js`)**: 
   A robust setup script was created to automatically download the selected `.onnx` models from HuggingFace. Crucially, the script detects Apple Silicon (arm64) and provisions a Python Virtual Environment (`piper-tts`) to natively bypass the broken x86_64 upstream macOS release, ensuring seamless local development.
2. **API Refactor (`src/app/api/voice/tts/route.ts`)**:
   The legacy HTTP forwarding was replaced with direct, secure `child_process` execution of the local Piper binary. A temporary `.wav` artifact pipeline was implemented for instant frontend previews.
3. **Frontend Wiring (`VoiceSettingsPage`)**:
   The `/settings/voice` page was completely rewritten to support a "Neural" tab vs "Browser" tab. The UI now fully lists the newly curated Neural Voices, their commercial licensing badges, and enables live real-time audio previews.
4. **License Enforcement (`src/workers/audiobookWorker.ts`)**:
   A license gating mechanism was added to the audiobook export worker to preemptively block rendering if an audio model is not flagged as `commercialOk: true`.

## 5. Verification

The new architecture was validated against the `npm run voice:smoke` automated CLI test suite:
- 10/10 models synthesized successfully.
- Execution speed verified for local environments.
