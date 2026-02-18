'use client';

import { use, useState, useRef } from 'react';
import {
    Headphones,
    Play,
    Pause,
    Square,
    SkipForward,
    Volume2,
    Gauge,
    Mic2,
    Loader2,
    Sparkles,
    CheckCircle2,
} from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { useAudiobook } from '@/lib/hooks/useAudiobook';
import type { Chapter } from '@/lib/types';
import { toast } from 'sonner';
import { VoiceLibrary } from '@/components/audiobook/VoiceLibrary';
import { piperService } from '@/lib/piper-service';
import type { PiperVoice } from '@/lib/voices-config';

export default function AudiobookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const { chapters, loading } = useChapters(projectId);
    const { voices, playback, speak, pause, resume, stop, setSpeed, setVoice, cloneVoice } = useAudiobook();

    // Voice cloning state
    const [isRecording, setIsRecording] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingComplete, setTrainingComplete] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Voice Library State
    const [view, setView] = useState<'studio' | 'library'>('studio');
    const [installedVoiceIds, setInstalledVoiceIds] = useState<string[]>(['piper-lessac', 'piper-amy']);
    const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
    const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
    const currentChapter = playback.currentChapterIndex >= 0 ? sortedChapters[playback.currentChapterIndex] : null;
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

    // Filter available voices based on installed list for the Studio
    const studioVoices = voices.filter(v => installedVoiceIds.includes(v.id));

    const handleInstallVoice = (voiceId: string) => {
        setInstalledVoiceIds(prev => [...prev, voiceId]);
        toast.success('Voice installed successfully');
    };

    const handlePreviewVoice = async (voice: PiperVoice) => {
        // Stop current preview
        if (previewAudio) {
            previewAudio.pause();
            setPreviewAudio(null);
            setPreviewingVoiceId(null);
            if (previewingVoiceId === voice.id) return; // Toggle off
        }

        // Generate preview
        try {
            setPreviewingVoiceId(voice.id);
            const text = "This is a preview of my voice. I hope you enjoy listening.";
            const audio = await piperService.speak(text, voice.id);

            if (audio) {
                setPreviewAudio(audio);
                audio.onended = () => {
                    setPreviewingVoiceId(null);
                    setPreviewAudio(null);
                };
            } else {
                // Fallback for non-piper voices (browser synthesis)
                const synth = window.speechSynthesis;
                const router = new SpeechSynthesisUtterance(text);
                // Simple mapping logic just for preview
                const sysVoices = synth.getVoices();
                const matchedinfo = sysVoices.find(v => v.name.includes(voice.gender === 'Female' ? 'Samantha' : 'Daniel')) || sysVoices[0];
                if (matchedinfo) router.voice = matchedinfo;

                router.onend = () => setPreviewingVoiceId(null);
                synth.speak(router);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to preview voice');
            setPreviewingVoiceId(null);
        }
    };

    const handlePlayChapter = (chapter: Chapter, index: number) => {
        if (playback.currentChapterIndex === index && playback.isPlaying) {
            pause();
        } else if (playback.currentChapterIndex === index && !playback.isPlaying) {
            resume();
        } else {
            speak(chapter.content || '', index);
        }
    };

    const handlePlayAll = () => {
        if (sortedChapters.length > 0) {
            speak(sortedChapters[0].content || '', 0);
        }
    };

    // Voice cloning handlers
    const handleRecordSample = async () => {
        if (isRecording) {
            // Stop recording
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.info('Recording... Speak naturally for 10-30 seconds.');
        } catch {
            toast.error('Microphone access denied.');
        }
    };

    const handleTrainClone = async () => {
        if (chunksRef.current.length === 0) {
            toast.error('Record a voice sample first.');
            return;
        }
        setIsTraining(true);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
            const clonedVoice = await cloneVoice(blob);
            setVoice(clonedVoice.id);
            setTrainingComplete(true);
            toast.success(`Voice clone "${clonedVoice.name}" created!`);
        } catch {
            toast.error('Voice cloning failed.');
        } finally {
            setIsTraining(false);
        }
    };

    return (
        <>
            <div className="audiobook-root">
                {/* Header */}
                <div className="ab-header ambient-glow">
                    <div className="ab-header-icon">
                        <Headphones size={24} />
                    </div>
                    <div className="ab-header-text">
                        <h1 className="ab-title">Audiobook Studio</h1>
                        <p className="ab-subtitle">
                            Listen to your manuscript with AI-powered text-to-speech
                        </p>
                    </div>
                    <div className="ab-header-actions" style={{ marginLeft: 'auto' }}>
                        <button
                            className={`ab-tab-btn ${view === 'studio' ? 'ab-tab-active' : ''}`}
                            onClick={() => setView('studio')}
                        >
                            Studio
                        </button>
                        <button
                            className={`ab-tab-btn ${view === 'library' ? 'ab-tab-active' : ''}`}
                            onClick={() => setView('library')}
                        >
                            Voice Library
                        </button>
                    </div>
                </div>

                {view === 'library' ? (
                    <VoiceLibrary
                        availableVoices={voices}
                        installedVoiceIds={installedVoiceIds}
                        onInstall={handleInstallVoice}
                        onPreview={handlePreviewVoice}
                        previewingVoiceId={previewingVoiceId}
                        isPlayingPreview={!!previewingVoiceId}
                    />
                ) : (
                    <>
                        {/* Controls Bar */}
                        <div className="ab-controls glass-strong">
                            <div className="ab-controls-left">
                                <button
                                    className="ab-play-main"
                                    onClick={playback.isPlaying ? pause : handlePlayAll}
                                    disabled={chapters.length === 0}
                                >
                                    {playback.isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                                <button
                                    className="ab-control-btn"
                                    onClick={stop}
                                    disabled={!playback.isPlaying && playback.currentChapterIndex === -1}
                                >
                                    <Square size={16} />
                                </button>
                                {currentChapter && (
                                    <div className="ab-now-playing">
                                        <span className="ab-now-label">Now playing</span>
                                        <span className="ab-now-title">{currentChapter.title}</span>
                                    </div>
                                )}
                            </div>

                            <div className="ab-controls-right">
                                {/* Neural Status */}
                                {playback.isNeuralAvailable && (
                                    <span className="ab-neural-badge">
                                        <Sparkles size={10} /> Neural
                                    </span>
                                )}

                                {/* Speed */}
                                <div className="ab-speed-group">
                                    <Gauge size={14} />
                                    <select
                                        value={playback.speed}
                                        onChange={(e) => setSpeed(Number(e.target.value))}
                                        className="ab-select"
                                    >
                                        {speeds.map((s) => (
                                            <option key={s} value={s}>
                                                {s}x
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Voice */}
                                <div className="ab-voice-group">
                                    <Mic2 size={14} />
                                    <select
                                        value={playback.selectedVoiceId}
                                        onChange={(e) => setVoice(e.target.value)}
                                        className="ab-select ab-select-wide"
                                    >
                                        {studioVoices.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} ({v.quality})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {playback.currentChapterIndex >= 0 && (
                            <div className="ab-progress-wrap">
                                <div className="ab-progress-bar">
                                    <div
                                        className="ab-progress-fill"
                                        style={{ width: `${playback.progress * 100}%` }}
                                    />
                                </div>
                                <span className="ab-progress-label">
                                    {Math.round(playback.progress * 100)}%
                                </span>
                            </div>
                        )}

                        {/* Chapter List */}
                        <div className="ab-chapters stagger-children">
                            <h2 className="ab-section-title">Chapters</h2>

                            {loading && (
                                <div className="ab-loading">
                                    <div className="ab-loading-spinner" />
                                    <span>Loading chapters...</span>
                                </div>
                            )}

                            {!loading && chapters.length === 0 && (
                                <div className="ab-empty">
                                    <Volume2 size={32} />
                                    <p>No chapters yet. Write some content first, then come back to listen.</p>
                                </div>
                            )}

                            {sortedChapters.map((chapter, index) => {
                                const isActive = playback.currentChapterIndex === index;
                                const wordCount = (chapter.content || '')
                                    .replace(/<[^>]*>/g, '')
                                    .split(/\s+/)
                                    .filter(Boolean).length;
                                const duration = Math.ceil(wordCount / 150); // ~150 words per minute

                                return (
                                    <div
                                        key={chapter.id}
                                        className={`ab-chapter-card premium-card animate-slide-up ${isActive ? 'ab-chapter-active' : ''}`}
                                        onClick={() => handlePlayChapter(chapter, index)}
                                    >
                                        <div className="ab-chapter-left">
                                            <div className={`ab-chapter-play ${isActive ? 'ab-chapter-play-active' : ''}`}>
                                                {isActive && playback.isPlaying ? (
                                                    <Pause size={14} />
                                                ) : (
                                                    <Play size={14} />
                                                )}
                                            </div>
                                            <div className="ab-chapter-info">
                                                <span className="ab-chapter-num">Chapter {index + 1}</span>
                                                <span className="ab-chapter-name">{chapter.title}</span>
                                            </div>
                                        </div>
                                        <div className="ab-chapter-meta">
                                            <span>{wordCount.toLocaleString()} words</span>
                                            <span>~{duration} min</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Voice Cloning Section */}
                        <div className="ab-cloning glass-strong">
                            <h2 className="ab-section-title">Voice Cloning</h2>
                            <p className="ab-clone-desc">
                                Record a 10-30 second voice sample to create a personalized neural voice clone.
                            </p>
                            <div className="ab-clone-actions">
                                <button
                                    className={`ab-clone-btn ${isRecording ? 'ab-clone-recording' : ''}`}
                                    onClick={handleRecordSample}
                                >
                                    <Mic2 size={16} />
                                    {isRecording ? 'Stop Recording' : 'Record Sample'}
                                </button>
                                <button
                                    className="ab-clone-btn ab-clone-train"
                                    onClick={handleTrainClone}
                                    disabled={isTraining || chunksRef.current.length === 0}
                                >
                                    {isTraining ? (
                                        <><Loader2 size={16} className="ab-spin" /> Training...</>
                                    ) : trainingComplete ? (
                                        <><CheckCircle2 size={16} /> Clone Created</>
                                    ) : (
                                        <><Sparkles size={16} /> Train Clone</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                .audiobook-root {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem 4rem;
                }

                /* ── Header ── */
                .ab-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 2rem;
                    border-radius: var(--radius-xl);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    margin-bottom: 1.5rem;
                }
                .ab-header-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #f59e0b, #ec4899);
                    color: white;
                    flex-shrink: 0;
                }
                .ab-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0 0 4px;
                }
                .ab-subtitle {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                /* ── Controls ── */
                .ab-controls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-radius: var(--radius-lg);
                    margin-bottom: 1rem;
                }
                .ab-controls-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ab-play-main {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    background: var(--accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .ab-play-main:hover:not(:disabled) {
                    background: var(--accent-hover);
                    transform: scale(1.05);
                }
                .ab-play-main:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .ab-control-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .ab-control-btn:hover:not(:disabled) {
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                }
                .ab-control-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                .ab-now-playing {
                    display: flex;
                    flex-direction: column;
                    margin-left: 6px;
                }
                .ab-now-label {
                    font-size: 0.65rem;
                    color: var(--accent);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                }
                .ab-now-title {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .ab-controls-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .ab-speed-group, .ab-voice-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-tertiary);
                }
                .ab-select {
                    padding: 4px 8px;
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-primary);
                    font-size: 0.75rem;
                    cursor: pointer;
                }
                .ab-select-wide {
                    max-width: 150px;
                }

                /* ── Progress ── */
                .ab-progress-wrap {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 1.5rem;
                }
                .ab-progress-bar {
                    flex: 1;
                    height: 4px;
                    border-radius: 2px;
                    background: var(--surface-tertiary);
                    overflow: hidden;
                }
                .ab-progress-fill {
                    height: 100%;
                    background: var(--gradient-brand);
                    border-radius: 2px;
                    transition: width 0.3s ease;
                }
                .ab-progress-label {
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                    min-width: 36px;
                    text-align: right;
                }

                /* ── Section ── */
                .ab-section-title {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 1rem;
                }

                /* ── Chapter Cards ── */
                .ab-chapter-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    margin-bottom: 8px;
                    cursor: pointer;
                }
                .ab-chapter-active {
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 1px var(--accent), var(--shadow-glow) !important;
                }
                .ab-chapter-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .ab-chapter-play {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    transition: all var(--transition-fast);
                    flex-shrink: 0;
                }
                .ab-chapter-card:hover .ab-chapter-play {
                    background: var(--accent-muted);
                    color: var(--accent);
                }
                .ab-chapter-play-active {
                    background: var(--accent) !important;
                    color: white !important;
                }
                .ab-chapter-info {
                    display: flex;
                    flex-direction: column;
                }
                .ab-chapter-num {
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    font-weight: 600;
                }
                .ab-chapter-name {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .ab-chapter-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                }

                /* ── States ── */
                .ab-loading {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 2rem;
                    justify-content: center;
                    color: var(--text-tertiary);
                    font-size: 0.85rem;
                }
                .ab-loading-spinner {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid var(--border);
                    border-top-color: var(--accent);
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .ab-empty {
                    text-align: center;
                    padding: 3rem;
                    color: var(--text-tertiary);
                }
                .ab-empty p {
                    margin-top: 12px;
                    font-size: 0.85rem;
                    max-width: 360px;
                    margin-left: auto;
                    margin-right: auto;
                }

                /* Neural Badge */
                .ab-neural-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-radius: var(--radius-full);
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15));
                    color: #10b981;
                    font-size: 0.65rem;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                }

                /* Voice Cloning */
                .ab-cloning {
                    margin-top: 2rem;
                    padding: 1.5rem;
                    border-radius: var(--radius-xl);
                }
                .ab-clone-desc {
                    font-size: 0.82rem;
                    color: var(--text-secondary);
                    margin: 0.5rem 0 1rem;
                }
                .ab-clone-actions {
                    display: flex;
                    gap: 10px;
                }
                .ab-clone-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-primary);
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .ab-clone-btn:hover:not(:disabled) {
                    background: var(--surface-tertiary);
                    border-color: var(--border-strong);
                }
                .ab-clone-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .ab-clone-recording {
                    border-color: #ef4444 !important;
                    background: rgba(239, 68, 68, 0.1) !important;
                    color: #ef4444 !important;
                    animation: pulse-recording 1.5s infinite;
                }
                .ab-clone-train {
                    background: var(--accent-warm-muted);
                    border-color: var(--accent-warm);
                    color: var(--accent-warm);
                }
                @keyframes pulse-recording {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                .ab-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </>
    );
}
