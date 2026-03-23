#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const os = require('os');

const VOICES_DIR = path.join(process.cwd(), 'voices');
const BIN_DIR = path.join(process.cwd(), 'bin');
const PIPER_VERSION = '2023.11.14-2';

const VOICES = [
    { family: "lessac", quality: "high", model: "en_US-lessac-high.onnx", lang: "en_US" },
    { family: "cori", quality: "high", model: "en_GB-cori-high.onnx", lang: "en_GB" },
    { family: "libritts_r", quality: "medium", model: "en_US-libritts_r-medium.onnx", lang: "en_US" },
    { family: "joe", quality: "medium", model: "en_US-joe-medium.onnx", lang: "en_US" },
    { family: "alan", quality: "medium", model: "en_GB-alan-medium.onnx", lang: "en_GB" },
    { family: "hfc_male", quality: "medium", model: "en_US-hfc_male-medium.onnx", lang: "en_US" },
    { family: "ryan", quality: "high", model: "en_US-ryan-high.onnx", lang: "en_US" },
    { family: "kusal", quality: "medium", model: "en_US-kusal-medium.onnx", lang: "en_US" },
    { family: "thorsten", quality: "high", model: "de_DE-thorsten-high.onnx", lang: "de_DE" },
    { family: "pavoque", quality: "low", model: "de_DE-pavoque-low.onnx", lang: "de_DE" },
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getPiperDownloadUrl() {
    const platform = os.platform();
    const arch = os.arch();

    const isAppleSilicon = platform === 'darwin' && os.cpus().some(cpu => cpu.model.includes('Apple'));
    const isArm = arch === 'arm64' || isAppleSilicon;

    if (platform === 'darwin' && isArm) {
        return `https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_macos_aarch64.tar.gz`;
    } else if (platform === 'darwin' && arch === 'x64') {
        return `https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_macos_x64.tar.gz`;
    } else if (platform === 'linux' && arch === 'x64') {
        return `https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_x86_64.tar.gz`;
    } else if (platform === 'linux' && arch === 'arm64') {
        return `https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_aarch64.tar.gz`;
    } else {
        throw new Error(`Unsupported OS setup for automated Piper download: ${platform} ${arch}`);
    }
}

async function downloadFile(url, dest) {
    if (fs.existsSync(dest)) {
        const stat = fs.statSync(dest);
        if (stat.size > 1000) {
            console.log(`[SKIP] Already exists: ${path.basename(dest)}`);
            return;
        }
    }
    console.log(`[DOWNLOADING] ${url} -> ${path.basename(dest)}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
        }

        const fileStream = fs.createWriteStream(dest, { flags: 'w' });
        // @ts-ignore
        for await (const chunk of response.body) {
            fileStream.write(chunk);
        }
        fileStream.end();

        // Wait for file to finish writing
        await new Promise(resolve => fileStream.on('finish', resolve));
    } catch (err) {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        throw err;
    }
}

async function installPiper() {
    ensureDir(BIN_DIR);
    const piperBinDir = path.join(BIN_DIR, 'piper');
    const piperExec = path.join(piperBinDir, 'piper');

    if (fs.existsSync(piperExec)) {
        console.log('[SKIP] Piper binary already exists.');
        return;
    }

    const platform = os.platform();
    const arch = os.arch();
    const isAppleSilicon = platform === 'darwin' && os.cpus().some(cpu => cpu.model.includes('Apple'));
    const isArm = arch === 'arm64' || isAppleSilicon;

    if (platform === 'darwin' && isArm) {
        console.log(`[INFO] Apple Silicon detected. The official piper binary is broken (x86_64 only). Installing via Python virtualenv...`);
        try {
            ensureDir(piperBinDir);
            const venvPath = path.join(BIN_DIR, 'piper_venv');
            console.log(`[INSTALLING] Setting up Python venv at ${venvPath}`);
            execSync(`python3 -m venv "${venvPath}"`, { stdio: 'inherit' });

            console.log(`[INSTALLING] Installing piper-tts package via pip...`);
            const pipExec = path.join(venvPath, 'bin', 'pip');
            execSync(`"${pipExec}" install piper-tts pathvalidate`, { stdio: 'inherit' });

            console.log(`[WRITING] Creating wrapper script at ${piperExec}...`);
            const wrapperScript = `#!/bin/bash\nDIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"\nsource "$DIR/../piper_venv/bin/activate"\nexec python3 -m piper "$@"\n`;
            fs.writeFileSync(piperExec, wrapperScript);
            fs.chmodSync(piperExec, 0o755);
            console.log('[OK] Piper installed via Python venv wrapper.');
        } catch (e) {
            console.error(`[ERROR] Failed to install Piper via Python venv:`, e);
        }
    } else {
        try {
            const piperUrl = getPiperDownloadUrl();
            const tarPath = path.join(BIN_DIR, 'piper.tar.gz');
            await downloadFile(piperUrl, tarPath);
            console.log(`[EXTRACTING] piper tarball...`);
            execSync(`tar -xzf "${tarPath}" -C "${BIN_DIR}"`);
            fs.unlinkSync(tarPath);
            console.log('[OK] Piper binary installed.');
        } catch (e) {
            console.error(`[ERROR] Failed to install Piper:`, e);
        }
    }
}

async function downloadVoices() {
    ensureDir(VOICES_DIR);
    for (const v of VOICES) {
        try {
            const baseUrl = `https://huggingface.co/rhasspy/piper-voices/resolve/main/${v.lang.split('_')[0]}/${v.lang}/${v.family}/${v.quality}`;
            const modelUrl = `${baseUrl}/${v.model}`;
            const jsonUrl = `${baseUrl}/${v.model}.json`;
            const modelDest = path.join(VOICES_DIR, v.model);
            const jsonDest = path.join(VOICES_DIR, `${v.model}.json`);

            await downloadFile(modelUrl, modelDest);
            await downloadFile(jsonUrl, jsonDest);
        } catch (e) {
            console.error(`[ERROR] Failed to download voice ${v.model}:`, e);
        }
    }
}

async function main() {
    console.log("=== Installing Piper ===");
    await installPiper();
    console.log("\n=== Downloading Voices ===");
    await downloadVoices();
    console.log("\n[DONE] Installation complete.");
}

main().catch(console.error);
