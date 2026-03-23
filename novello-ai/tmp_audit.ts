import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { NEURAL_VOICES } from './src/lib/voices-config';

const TMP_DIR = path.join(process.cwd(), 'tmp', 'voice_audit');
const PIPER_DIR = path.join(TMP_DIR, 'piper');
const PIPER_BIN = path.join(PIPER_DIR, 'piper');

async function downloadFile(url: string, dest: string) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${url}`);
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
}

async function main() {
    fs.mkdirSync(TMP_DIR, { recursive: true });

    // 1. Check which models exist on HuggingFace
    console.log("Checking model availability on HuggingFace rhasspy/piper-voices...");
    const modelInventory: any[] = [];

    for (const voice of NEURAL_VOICES) {
        const langCode = voice.model.split('-')[0]; // e.g. en_US
        const modelName = voice.model.replace('.onnx', '');
        const onnxUrl = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${langCode.split('_')[0]}/${langCode}/${modelName}/${modelName}.onnx`;

        let exists = false;
        try {
            const res = await fetch(onnxUrl, { method: 'HEAD' });
            exists = res.ok;
        } catch (e) {
            exists = false;
        }

        console.log(`- ${voice.model}: ${exists ? 'FOUND' : 'MISSING'}`);
        modelInventory.push({ ...voice, exists, onnxUrl });
    }

    fs.writeFileSync(path.join(TMP_DIR, 'inventory.json'), JSON.stringify(modelInventory, null, 2));
    console.log("Inventory saved to tmp/voice_audit/inventory.json");
}

main().catch(console.error);
