/**
 * lib/audiobook-generator.ts
 *
 * Local-first audiobook generation engine.
 * Runs Piper TTS + FFmpeg in-process — no BullMQ / Redis required.
 *
 * Architecture:
 * 1. For each chapter: strip HTML, call Piper CLI → WAV file
 * 2. Concatenate all WAVs with FFmpeg silence gaps
 * 3. Convert to M4B (AAC) with chapter metadata embedded
 * 4. Write to public/audiobooks/<exportId>/ for browser download
 */

import path from 'path';
import fs from 'fs/promises';
import { createWriteStream, createReadStream } from 'fs';
import { execFile, execSync, spawn } from 'child_process';
import { promisify } from 'util';
import { NEURAL_VOICES } from './voices-config';

const execFileAsync = promisify(execFile);

// ─── Paths ────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd();
const PIPER_BIN = path.join(PROJECT_ROOT, 'bin', 'piper', 'piper');
const VOICES_DIR = path.join(PROJECT_ROOT, 'voices');
const FFMPEG_BIN = process.env.FFMPEG_PATH || (() => { try { return execSync('which ffmpeg').toString().trim(); } catch { return '/opt/homebrew/bin/ffmpeg'; } })();
const OUTPUT_BASE = path.join(PROJECT_ROOT, 'public', 'audiobooks');

// ─── Cancel registry ──────────────────────────────────────────────────────────

const cancelledJobs = new Set<string>();

export function cancelAudiobookJob(exportId: string): void {
    cancelledJobs.add(exportId);
}

export function isJobCancelled(exportId: string): boolean {
    return cancelledJobs.has(exportId);
}

export function cleanupJobCancel(exportId: string): void {
    cancelledJobs.delete(exportId);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AudiobookChapter {
    id: string;
    title: string;
    content: string; // TipTap HTML
    order: number;
}

export interface AudiobookSettings {
    voiceId: string;
    dialogueVoiceId?: string;
    speed: number;
    pauseDurationMs: number;
    bitrateKbps?: number;
    language: string;
}

export interface TextChunk {
    type: 'narration' | 'dialogue';
    text: string;
}

function extractDialogueChunks(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const regex = /(['"“‘])(.*?)\1/g;
    
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const narration = text.substring(lastIndex, match.index).trim();
            if (narration) chunks.push({ type: 'narration', text: narration });
        }
        const dialogue = match[2].trim();
        // Keep quotes for TTS inflection parsing
        if (dialogue) chunks.push({ type: 'dialogue', text: match[0] });
        lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
        const remaining = text.substring(lastIndex).trim();
        if (remaining) chunks.push({ type: 'narration', text: remaining });
    }
    
    return chunks.length > 0 ? chunks : [{ type: 'narration', text }];
}

export interface ProgressEvent {
    type: 'progress' | 'complete' | 'error';
    stage: 'cleaning' | 'tts' | 'concatenating' | 'done';
    currentChapter: number;
    totalChapters: number;
    percentComplete: number;
    message?: string;
    downloadUrl?: string;
    durationSeconds?: number;
}

// ─── HTML → Plain Text ────────────────────────────────────────────────────────

function stripHtml(html: string): string {
    // Remove tags, decode basic entities, collapse whitespace
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// ─── Piper TTS ────────────────────────────────────────────────────────────────

async function synthesiseChapter(
    text: string,
    voiceModelFilename: string,
    outputWav: string,
    speed: number,
): Promise<void> {
    const modelPath = path.join(VOICES_DIR, voiceModelFilename);
    const modelJsonPath = `${modelPath}.json`;

    // Verify files exist
    await fs.access(modelPath);
    await fs.access(modelJsonPath);

    const piperArgs = [
        '--model', modelPath,
        '--config', modelJsonPath,
        '--output_file', outputWav,
        '--length_scale', String(1 / speed), // Piper uses length_scale: >1 = slower, <1 = faster
    ];

    // Write text to a temp file and pipe it in to avoid argv shell-injection
    const tmpTxt = `${outputWav}.txt`;
    await fs.writeFile(tmpTxt, text, 'utf-8');

    // More reliable: spawn with stdin pipe
    await new Promise<void>((resolve, reject) => {
        const txt = createReadStream(tmpTxt);
        const proc = spawn(PIPER_BIN, piperArgs, {
            stdio: ['pipe', 'ignore', 'pipe'],
        });
        txt.pipe(proc.stdin);
        const errBuf: Buffer[] = [];
        proc.stderr.on('data', (d: Buffer) => errBuf.push(d));
        proc.on('close', (code: number) => {
            if (code !== 0) {
                reject(new Error(`Piper exited ${code}: ${Buffer.concat(errBuf).toString().slice(0, 200)}`));
            } else {
                resolve();
            }
        });
        proc.on('error', reject);
    });

    await fs.unlink(tmpTxt).catch(() => {});
}

// ─── FFmpeg concatenation ─────────────────────────────────────────────────────

async function concatenateToM4B(
    wavFiles: string[],
    pauseMs: number,
    chapterTitles: string[],
    bookTitle: string,
    exportDir: string,
    exportId: string,
    bitrateKbps: number,
): Promise<{ outputPath: string; durationSeconds: number }> {
    // Write ffmpeg concat list file  
    const concatListPath = path.join(exportDir, 'concat.txt');
    const silenceWav = path.join(exportDir, 'silence.wav');

    // Generate a short silence file for chapter gaps
    await execFileAsync(FFMPEG_BIN, [
        '-f', 'lavfi',
        '-i', `anullsrc=r=22050:cl=mono`,
        '-t', String(pauseMs / 1000),
        '-y',
        silenceWav,
    ]);

    // Build concat list: chapter1.wav, silence.wav, chapter2.wav …
    const lines: string[] = [];
    for (let i = 0; i < wavFiles.length; i++) {
        lines.push(`file '${wavFiles[i]}'`);
        if (i < wavFiles.length - 1) {
            lines.push(`file '${silenceWav}'`);
        }
    }
    await fs.writeFile(concatListPath, lines.join('\n'), 'utf-8');

    // First pass: concatenate to a single WAV
    const mergedWav = path.join(exportDir, 'merged.wav');
    await execFileAsync(FFMPEG_BIN, [
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        '-y',
        mergedWav,
    ]);

    // Second pass: encode to M4B (AAC in MP4 container)
    const outputM4B = path.join(exportDir, `${exportId}.m4b`);

    // Build chapter metadata for ffmpeg
    const metadataPath = path.join(exportDir, 'chapters.ffmeta');
    const safeBookTitle = bookTitle.replace(/[\r\n]/g, ' ');
    const metaLines = [';FFMETADATA1', `title=${safeBookTitle}`, ''];

    // Get durations of each wav for chapter timestamps
    let cursor = 0;
    const chapterTimestamps: number[] = [];

    for (const wav of wavFiles) {
        const { stdout } = await execFileAsync(FFMPEG_BIN, [
            '-i', wav,
            '-f', 'null', '-',
        ]).catch(async () => {
            // ffprobe alternative
            const result = await execFileAsync('ffprobe', [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                wav,
            ]);
            return { stdout: result.stdout };
        });

        // Try to extract duration
        const durationMatch = stdout.match(/Duration: (\d+):(\d+):(\d+\.\d+)/) ||
            JSON.stringify(stdout).match(/"duration":"([\d.]+)"/);
        
        if (durationMatch && durationMatch.length >= 4) {
            const h = parseInt(durationMatch[1]);
            const m = parseInt(durationMatch[2]);
            const s = parseFloat(durationMatch[3]);
            const durMs = ((h * 3600) + (m * 60) + s) * 1000;
            chapterTimestamps.push(cursor);
            cursor += durMs + pauseMs;
        } else {
            chapterTimestamps.push(cursor);
            cursor += 60000; // fallback: 1 min per chapter
        }
    }

    for (let i = 0; i < chapterTitles.length; i++) {
        const start = Math.round(chapterTimestamps[i]);
        const end = i < chapterTimestamps.length - 1
            ? Math.round(chapterTimestamps[i + 1])
            : Math.round(cursor);
        metaLines.push('[CHAPTER]');
        metaLines.push('TIMEBASE=1/1000');
        metaLines.push(`START=${start}`);
        metaLines.push(`END=${end}`);
        metaLines.push(`title=${chapterTitles[i]}`);
        metaLines.push('');
    }

    await fs.writeFile(metadataPath, metaLines.join('\n'), 'utf-8');

    // Encode merged WAV → M4B with chapter metadata
    await execFileAsync(FFMPEG_BIN, [
        '-i', mergedWav,
        '-i', metadataPath,
        '-map_metadata', '1',
        '-c:a', 'aac',
        '-b:a', `${bitrateKbps}k`,
        '-movflags', '+faststart',
        '-y',
        outputM4B,
    ]);

    // Get final duration
    const totalSeconds = Math.round(cursor / 1000);

    // Cleanup temp files
    await Promise.all([
        fs.unlink(concatListPath).catch(() => {}),
        fs.unlink(silenceWav).catch(() => {}),
        fs.unlink(mergedWav).catch(() => {}),
        fs.unlink(metadataPath).catch(() => {}),
    ]);

    return {
        outputPath: outputM4B,
        durationSeconds: totalSeconds,
    };
}

// ─── Main generator (yields progress) ────────────────────────────────────────

export async function* generateAudiobook(
    exportId: string,
    chapters: AudiobookChapter[],
    bookTitle: string,
    settings: AudiobookSettings,
): AsyncGenerator<ProgressEvent> {
    const exportDir = path.join(OUTPUT_BASE, exportId);
    await fs.mkdir(exportDir, { recursive: true });

    const voice = NEURAL_VOICES.find((v) => v.id === settings.voiceId) ?? NEURAL_VOICES[0];
    const total = chapters.length;

    const wavFiles: string[] = [];
    const chapterTitles: string[] = [];

    const narratorVoice = NEURAL_VOICES.find((v) => v.id === settings.voiceId) ?? NEURAL_VOICES[0];
    const dialogueVoice = settings.dialogueVoiceId 
        ? (NEURAL_VOICES.find((v) => v.id === settings.dialogueVoiceId) ?? narratorVoice)
        : narratorVoice;

    // ── Phase 1: Synthesise each chapter ──────────────────────────────────────
    for (let i = 0; i < chapters.length; i++) {
        if (isJobCancelled(exportId)) {
            yield { type: 'error', stage: 'tts', currentChapter: i, totalChapters: total, percentComplete: Math.round((i / total) * 100), message: 'Cancelled' };
            cleanupJobCancel(exportId);
            return;
        }

        const chapter = chapters[i];
        const plainText = stripHtml(chapter.content);
        chapterTitles.push(chapter.title || `Chapter ${i + 1}`);

        yield {
            type: 'progress',
            stage: 'tts',
            currentChapter: i + 1,
            totalChapters: total,
            percentComplete: Math.round(((i / total) * 80)),
            message: `Synthesising chapter ${i + 1} of ${total}: "${chapter.title}"`,
        };

        const wavOut = path.join(exportDir, `ch_${String(i).padStart(3, '0')}.wav`);

        try {
            if (!settings.dialogueVoiceId || settings.dialogueVoiceId === settings.voiceId) {
                // Standard single-voice path
                await synthesiseChapter(plainText, narratorVoice.model, wavOut, settings.speed);
            } else {
                // Multi-voice chunking path
                const chunks = extractDialogueChunks(plainText);
                const chunkWavs: string[] = [];
                
                for (let c = 0; c < chunks.length; c++) {
                    const chunk = chunks[c];
                    const chunkWav = path.join(exportDir, `ch_${i}_chunk_${c}.wav`);
                    const model = chunk.type === 'dialogue' ? dialogueVoice.model : narratorVoice.model;
                    await synthesiseChapter(chunk.text, model, chunkWav, settings.speed);
                    chunkWavs.push(chunkWav);
                }
                
                // Concat chunks into chapter WAV
                const concatListPath = path.join(exportDir, `concat_ch_${i}.txt`);
                const lines = chunkWavs.map(w => `file '${w}'`);
                await fs.writeFile(concatListPath, lines.join('\n'), 'utf-8');
                
                await execFileAsync(FFMPEG_BIN, [
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', concatListPath,
                    '-c', 'copy',
                    '-y',
                    wavOut,
                ]);
                
                // Cleanup chunks
                await fs.unlink(concatListPath).catch(() => {});
                for (const w of chunkWavs) await fs.unlink(w).catch(() => {});
            }
            wavFiles.push(wavOut);
        } catch (err: unknown) {
            const error = err as Error;
            yield {
                type: 'error',
                stage: 'tts',
                currentChapter: i + 1,
                totalChapters: total,
                percentComplete: Math.round((i / total) * 80),
                message: `Piper failed for chapter ${i + 1}: ${error.message}`,
            };
            return;
        }
    }

    // ── Phase 2: Concatenate ──────────────────────────────────────────────────
    if (isJobCancelled(exportId)) {
        yield { type: 'error', stage: 'concatenating', currentChapter: total, totalChapters: total, percentComplete: 80, message: 'Cancelled' };
        cleanupJobCancel(exportId);
        return;
    }

    yield { type: 'progress', stage: 'concatenating', currentChapter: total, totalChapters: total, percentComplete: 85, message: 'Concatenating chapters…' };

    let outputPath: string;
    let durationSeconds: number;

    try {
        const result = await concatenateToM4B(wavFiles, settings.pauseDurationMs, chapterTitles, bookTitle, exportDir, exportId, settings.bitrateKbps || 64);
        outputPath = result.outputPath;
        durationSeconds = result.durationSeconds;
    } catch (err: unknown) {
        const error = err as Error;
        yield { type: 'error', stage: 'concatenating', currentChapter: total, totalChapters: total, percentComplete: 85, message: `FFmpeg failed: ${error.message}` };
        return;
    }

    // Cleanup individual WAV files
    for (const wav of wavFiles) {
        await fs.unlink(wav).catch(() => {});
    }

    // Public download URL (served from Next.js public directory)
    const filename = path.basename(outputPath);
    const downloadUrl = `/audiobooks/${exportId}/${filename}`;

    yield {
        type: 'complete',
        stage: 'done',
        currentChapter: total,
        totalChapters: total,
        percentComplete: 100,
        message: 'Audiobook generation complete!',
        downloadUrl,
        durationSeconds,
    };

    cleanupJobCancel(exportId);
}
