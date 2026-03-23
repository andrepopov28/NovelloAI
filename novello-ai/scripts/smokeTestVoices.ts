import { NEURAL_VOICES } from '../src/lib/voices-config';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const execPromise = promisify(exec);

async function runSmokeTests() {
    console.log("=== Voice Smoke Test ===");

    const piperBin = path.join(process.cwd(), 'bin', 'piper', 'piper');

    // Check if binary exists
    try {
        await fs.access(piperBin);
    } catch {
        console.error(`❌ Piper binary not found at ${piperBin}. Run 'npm run download-voices' first.`);
        process.exit(1);
    }

    const testText = "This is a smoke test to ensure my voice model is installed and functioning correctly.";
    const tmpDir = path.join(process.cwd(), 'tmp_smoke');

    await fs.mkdir(tmpDir, { recursive: true });

    let passed = 0;
    let failed = 0;

    for (const voice of NEURAL_VOICES) {
        process.stdout.write(`Testing [${voice.id}] (${voice.model})... `);

        const modelPath = path.join(process.cwd(), 'voices', voice.model);

        try {
            await fs.access(modelPath);
        } catch {
            console.log(`❌ FAILED (Model file missing)`);
            failed++;
            continue;
        }

        const runId = crypto.randomUUID();
        const txtPath = path.join(tmpDir, `${runId}.txt`);
        const wavPath = path.join(tmpDir, `${runId}.wav`);

        try {
            await fs.writeFile(txtPath, testText);
            const cmd = `"${piperBin}" --model "${modelPath}" --output_file "${wavPath}" < "${txtPath}"`;
            await execPromise(cmd);

            // Check if wav was generated and size > 0
            const stat = await fs.stat(wavPath);
            if (stat.size > 1000) {
                console.log(`✅ OK (${(stat.size / 1024).toFixed(1)} KB)`);
                passed++;
            } else {
                console.log(`❌ FAILED (WAV file too small)`);
                failed++;
            }
        } catch (err: any) {
            console.log(`❌ FAILED (Execution Error)`);
            console.error(err.message);
            failed++;
        } finally {
            await fs.unlink(txtPath).catch(() => { });
            await fs.unlink(wavPath).catch(() => { });
        }
    }

    console.log("\n=== Summary ===");
    console.log(`Total: ${NEURAL_VOICES.length}, Passed: ${passed}, Failed: ${failed}`);

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runSmokeTests().catch(e => {
    console.error("Fatal error:", e);
    process.exit(1);
});
