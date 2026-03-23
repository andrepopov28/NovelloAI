# PR: Replace legacy TTS system with Commercial Piper V2

## 📝 Overview
Resolves the broken state of the Novello AI TTS (text-to-speech) subsystem. This PR replaces the non-functional neural voice routing (which previously fell back to low-quality browser synthesis) with a robust, locally-executing Piper engine bundled with 10 carefully curated, high-quality, and commercially-safe voices.

## 🚀 Key Changes

1. **New Commercial Voice Pack**: 
   - Overhauled `voices-config.ts` with 10 real, validated `.onnx` models from the `rhasspy/piper-voices` repository.
   - Added rigorous provenance metadata (`commercialOk`, `licenseName`, `licenseUrl`) to the `VoiceCatalog` schema.

2. **Automated Setup Script (`npm run download-voices`)**:
   - Added `scripts/downloadVoices.js` to deterministically pull `.onnx` models and setup the Piper binary.
   - Includes automatic Apple Silicon support by provisioning a Python `piper-tts` venv wrapper, bypassing upstream x86_64 binary compatibility issues.

3. **Backend Synthesizer Integrations**:
   - Refactored `src/app/api/voice/tts/route.ts` to execute Piper locally instead of returning 501 errors looking for an undefined `PIPER_TTS_URL`.
   - Added `commercialOk` license checks to `audiobookWorker.ts` to prevent accidental non-commercial audiobook exports.

4. **Frontend UI Upgrade (`/settings/voice`)**:
   - Completely redesigned Voice Library UI to natively support and preview backend Piper models.
   - Added commercial safety badges and live playback toggling.

## 🧪 Verification
- `npm run voice:smoke`: Successfully synthesized test `.wav` files using all 10 local `.onnx` models.
- Manual verification: Previews successfully playback Neural audio on the frontend settings page.
