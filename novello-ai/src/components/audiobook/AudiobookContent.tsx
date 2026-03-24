'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
    ChevronDown,
    X,
    Check,
    Settings2,
} from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { useAudiobook } from '@/lib/hooks/useAudiobook';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Chapter } from '@/lib/types';
import { toast } from 'sonner';
import { VoiceLibrary } from '@/components/audiobook/VoiceLibrary';
import { AudiobookExport } from '@/components/audiobook/AudiobookExport';
import { ChapterRecorder } from '@/components/audiobook/ChapterRecorder';

export default function AudiobookContent({ projectId }: { projectId: string }) {
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const userId = user?.uid;
    const { chapters, loading, updateChapter } = useChapters(projectId);
    const { voices, playback, speak, pause, resume, stop, setSpeed, setVoice } = useAudiobook();

    // Voice Library State
    const paramView = searchParams.get('view') as 'studio' | 'library' | 'export' | null;
    const [view, setView] = useState<'studio' | 'library' | 'export'>(paramView || 'studio');

    // Sync view with URL changes (when clicking mega menu while already on page)
    useEffect(() => {
        if (paramView && paramView !== view) {
            setView(paramView);
        }
    }, [paramView]);

    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
    const currentChapter = playback.currentChapterIndex >= 0 ? sortedChapters[playback.currentChapterIndex] : null;
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

    // ── Voice Picker State ──
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTab, setPickerTab] = useState<'browser'>('browser');
    const [ttsProvider, setTtsProvider] = useState<'browser'>('browser');
    const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');
    const [previewingPickerVoice, setPreviewingPickerVoice] = useState<string | null>(null);
    const [recordingChapterId, setRecordingChapterId] = useState<string | null>(null);

    // Load persisted settings
    useEffect(() => {
        setTtsProvider('browser');
        setPickerTab('browser');
        setSelectedBrowserVoice(localStorage.getItem('novello-tts-voice') || '');
    }, []);

    // Load browser voices
    useEffect(() => {
        const load = () => {
            const raw = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
            setBrowserVoices(raw);
            if (!selectedBrowserVoice && raw.length > 0) setSelectedBrowserVoice(raw[0].name);
        };
        load();
        window.speechSynthesis.onvoiceschanged = load;
    }, [selectedBrowserVoice]);

    const speakWithProvider = useCallback((text: string, chapterIndex: number, customAudioUrl?: string) => {
        // Default: browser
        speak(text, chapterIndex, customAudioUrl);
    }, [speak]);

    const selectProvider = (p: 'browser') => {
        setTtsProvider(p);
        localStorage.setItem('novello-tts-provider', p);
        toast.success(`Voice: Browser`);
    };

    const previewBrowserVoice = (voiceName: string) => {
        window.speechSynthesis.cancel();
        if (previewingPickerVoice === voiceName) { setPreviewingPickerVoice(null); return; }
        const voice = browserVoices.find(v => v.name === voiceName);
        if (!voice) return;
        const utt = new SpeechSynthesisUtterance('This is a preview of the selected voice.');
        utt.voice = voice;
        utt.onend = () => setPreviewingPickerVoice(null);
        setPreviewingPickerVoice(voiceName);
        window.speechSynthesis.speak(utt);
    };

    const activeVoiceLabel = selectedBrowserVoice || 'Browser Voice';

    const handlePlayChapter = (chapter: Chapter, index: number) => {
        if (playback.currentChapterIndex === index && playback.isPlaying) {
            pause();
        } else if (playback.currentChapterIndex === index && !playback.isPlaying) {
            resume();
        } else {
            speakWithProvider(chapter.content || '', index, chapter.audioUrl);
        }
    };

    const handlePlayAll = () => {
        if (sortedChapters.length > 0) {
            speakWithProvider(sortedChapters[0].content || '', 0, sortedChapters[0].audioUrl);
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
                        <button
                            className={`ab-tab-btn ${view === 'export' ? 'ab-tab-active' : ''}`}
                            onClick={() => setView('export')}
                        >
                            Export
                        </button>
                    </div>
                </div>

                {view === 'export' ? (
                    <AudiobookExport projectId={projectId} userId={userId} />
                ) : view === 'library' ? (
                    <VoiceLibrary userId={userId} />
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

                                {/* Voice Picker Button */}
                                <div className="ab-voice-group">
                                    <Mic2 size={14} />
                                    <button
                                        className="ab-voice-picker-btn"
                                        onClick={() => setPickerOpen(true)}
                                    >
                                        <span className="ab-voice-picker-label">{activeVoiceLabel}</span>
                                        <ChevronDown size={13} />
                                    </button>
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
                                    <div key={chapter.id} className="ab-chapter-container animate-slide-up">
                                        <div
                                            className={`ab-chapter-card premium-card ${isActive ? 'ab-chapter-active' : ''}`}
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
                                                {chapter.audioUrl && (
                                                    <span className="ab-badge-custom-audio" title="Custom audio recording">
                                                        <Mic2 size={12} /> Narrated
                                                    </span>
                                                )}
                                                <span>{wordCount.toLocaleString()} words</span>
                                                <span>~{duration} min</span>
                                                <button 
                                                    className="ab-btn-record-inline" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRecordingChapterId(recordingChapterId === chapter.id ? null : chapter.id);
                                                    }}
                                                >
                                                    <Mic2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {recordingChapterId === chapter.id && (
                                            <div className="ab-recorder-wrapper">
                                                <ChapterRecorder 
                                                    chapter={chapter} 
                                                    onClose={() => setRecordingChapterId(null)}
                                                    onSave={async (audioData) => {
                                                        await updateChapter(chapter.id, { audioUrl: audioData });
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
                /* Voice Picker Button */
                .ab-voice-picker-btn {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 6px 12px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    color: var(--text-primary); font-size: 0.8rem; font-weight: 600;
                    cursor: pointer; transition: all 0.2s; max-width: 200px;
                }
                .ab-voice-picker-btn:hover { border-color: var(--border-strong); background: var(--surface-secondary); }
                .ab-voice-picker-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                /* Voice Picker Panel */
                .vp-overlay {
                    position: fixed; inset: 0; z-index: 200;
                    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
                    display: flex; align-items: flex-end; justify-content: center;
                }
                .vp-panel {
                    width: 100%; max-width: 640px; max-height: 80vh;
                    background: var(--surface-secondary); border-radius: 20px 20px 0 0;
                    border: 1px solid var(--border); border-bottom: none;
                    display: flex; flex-direction: column; overflow: hidden;
                    animation: vp-slide-up 0.25s ease;
                }
                @keyframes vp-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
                .vp-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
                }
                .vp-header-left { display: flex; align-items: center; gap: 10px; color: var(--text-primary); }
                .vp-title { font-size: 1rem; font-weight: 700; }
                .vp-close {
                    width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border);
                    background: var(--surface-tertiary); color: var(--text-secondary);
                    display: flex; align-items: center; justify-content: center; cursor: pointer;
                    transition: all 0.15s;
                }
                .vp-close:hover { background: var(--surface-primary); color: var(--text-primary); }
                .vp-provider-row {
                    display: flex; gap: 8px; padding: 14px 24px;
                    border-bottom: 1px solid var(--border); background: var(--surface-tertiary);
                }
                .vp-provider-btn {
                    display: inline-flex; align-items: center; gap: 6px;
                    padding: 7px 14px; border-radius: var(--radius-md);
                    border: 1.5px solid var(--border); background: var(--surface-secondary);
                    color: var(--text-secondary); font-size: 0.78rem; font-weight: 600;
                    cursor: pointer; transition: all 0.15s;
                }
                .vp-provider-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }
                .vp-provider-active { border-color: var(--accent-warm) !important; background: var(--accent-warm-muted) !important; color: var(--accent-warm) !important; }
                .vp-tabs {
                    display: flex; border-bottom: 1px solid var(--border); padding: 0 24px;
                }
                .vp-tab {
                    position: relative; display: flex; align-items: center; gap: 6px;
                    padding: 10px 16px; font-size: 0.82rem; font-weight: 600;
                    color: var(--text-tertiary); background: none; border: none; cursor: pointer;
                }
                .vp-tab:hover { color: var(--text-primary); }
                .vp-tab-active { color: var(--text-primary); }
                .vp-tab-active::after {
                    content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
                    height: 2px; background: var(--accent-warm); border-radius: 2px 2px 0 0;
                }
                .vp-tab-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent-warm); }
                .vp-content { flex: 1; overflow-y: auto; padding: 16px 24px; }
                .vp-voice-list { display: flex; flex-direction: column; gap: 6px; }
                .vp-voice-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 10px 14px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    cursor: pointer; transition: all 0.15s;
                }
                .vp-voice-row:hover { border-color: var(--border-strong); }
                .vp-voice-selected { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .vp-voice-left { display: flex; align-items: center; gap: 10px; }
                .vp-radio {
                    width: 16px; height: 16px; border-radius: 50%;
                    border: 2px solid var(--border-strong); flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
                }
                .vp-radio-on { border-color: var(--accent-warm); background: var(--accent-warm); color: white; }
                .vp-voice-info { display: flex; flex-direction: column; gap: 1px; }
                .vp-voice-name { font-size: 0.82rem; font-weight: 600; color: var(--text-primary); }
                .vp-voice-lang { font-size: 0.7rem; color: var(--text-tertiary); }
                .vp-voice-right { display: flex; align-items: center; gap: 8px; }
                .vp-badge {
                    padding: 2px 7px; border-radius: var(--radius-full);
                    font-size: 0.65rem; font-weight: 700;
                }
                .vp-badge-neural { color: #10b981; background: rgba(16,185,129,0.12); }
                .vp-preview-btn {
                    display: inline-flex; align-items: center; gap: 4px;
                    padding: 4px 9px; border-radius: var(--radius-sm);
                    border: 1px solid var(--border); background: var(--surface-secondary);
                    color: var(--text-secondary); font-size: 0.7rem; font-weight: 600;
                    cursor: pointer; transition: all 0.15s;
                }
                .vp-preview-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }
                .vp-preview-stop { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.08); }
                .vp-empty { color: var(--text-tertiary); font-size: 0.82rem; padding: 1rem 0; display: flex; align-items: center; gap: 8px; }
                .vp-no-key {
                    display: flex; align-items: flex-start; gap: 12px; padding: 16px;
                    border-radius: var(--radius-md); border: 1px dashed var(--border);
                    background: var(--surface-tertiary); color: var(--text-secondary);
                    font-size: 0.82rem; margin-bottom: 8px;
                }
                .vp-oai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
                .vp-oai-card {
                    display: flex; flex-direction: column; gap: 3px;
                    padding: 12px 14px; border-radius: var(--radius-md);
                    border: 1.5px solid var(--border); background: var(--surface-tertiary);
                    text-align: left; cursor: pointer; transition: all 0.15s;
                }
                .vp-oai-card:hover { border-color: var(--border-strong); }
                .vp-oai-active { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .vp-oai-top { display: flex; align-items: center; justify-content: space-between; }
                .vp-oai-name { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
                .vp-oai-desc { font-size: 0.72rem; color: var(--text-tertiary); }
                .vp-footer {
                    padding: 14px 24px; border-top: 1px solid var(--border);
                    display: flex; justify-content: flex-end;
                }
                .vp-done-btn {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 10px 24px; border-radius: var(--radius-md);
                    background: var(--accent-warm); color: white;
                    border: none; font-size: 0.85rem; font-weight: 700;
                    cursor: pointer; transition: opacity 0.15s;
                }
                .vp-done-btn:hover { opacity: 0.9; }
                /* ── Narrator Mode Custom Styles ── */
                .ab-btn-record-inline {
                    background: none;
                    border: none;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: var(--radius-sm);
                    transition: all var(--transition-fast);
                }
                .ab-btn-record-inline:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }
                .ab-badge-custom-audio {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                    padding: 2px 6px;
                    border-radius: var(--radius-sm);
                }
                .ab-recorder-wrapper {
                    margin-top: 8px;
                    margin-bottom: 16px;
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ── Voice Picker Slide-Up Panel ── */}
            {pickerOpen && (
                <div className="vp-overlay" onClick={() => setPickerOpen(false)}>
                    <div className="vp-panel" onClick={e => e.stopPropagation()}>
                        {/* Panel Header */}
                        <div className="vp-header">
                            <div className="vp-header-left">
                                <Mic2 size={18} />
                                <span className="vp-title">Voice Picker</span>
                            </div>
                            <button className="vp-close" onClick={() => setPickerOpen(false)}><X size={18} /></button>
                        </div>

                        {/* Provider selector */}
                        <div className="vp-provider-row">
                            {(['browser'] as const).map(p => (
                                <button
                                    key={p}
                                    className={`vp-provider-btn ${ttsProvider === p ? 'vp-provider-active' : ''}`}
                                    onClick={() => selectProvider(p)}
                                >
                                    {ttsProvider === p && <Check size={12} />}
                                    {'🌐 Browser'}
                                </button>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="vp-tabs">
                            {(['browser'] as const).map(t => (
                                <button
                                    key={t}
                                    className={`vp-tab ${pickerTab === t ? 'vp-tab-active' : ''}`}
                                    onClick={() => setPickerTab(t)}
                                >
                                    {'Browser'}
                                    {ttsProvider === t && <span className="vp-tab-dot" />}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="vp-content">
                            {/* Browser Tab */}
                            {pickerTab === 'browser' && (
                                <div className="vp-voice-list">
                                    {browserVoices.length === 0 && <p className="vp-empty">Loading voices...</p>}
                                    {browserVoices.map(v => (
                                        <div
                                            key={v.name}
                                            className={`vp-voice-row ${selectedBrowserVoice === v.name ? 'vp-voice-selected' : ''}`}
                                            onClick={() => { setSelectedBrowserVoice(v.name); localStorage.setItem('novello-tts-voice', v.name); }}
                                        >
                                            <div className="vp-voice-left">
                                                <div className={`vp-radio ${selectedBrowserVoice === v.name ? 'vp-radio-on' : ''}`}>
                                                    {selectedBrowserVoice === v.name && <Check size={10} />}
                                                </div>
                                                <div className="vp-voice-info">
                                                    <span className="vp-voice-name">{v.name}</span>
                                                    <span className="vp-voice-lang">{v.lang}</span>
                                                </div>
                                            </div>
                                            <div className="vp-voice-right">
                                                {(v.localService || v.name.toLowerCase().includes('enhanced')) && (
                                                    <span className="vp-badge vp-badge-neural">Neural</span>
                                                )}
                                                <button
                                                    className={`vp-preview-btn ${previewingPickerVoice === v.name ? 'vp-preview-stop' : ''}`}
                                                    onClick={e => { e.stopPropagation(); previewBrowserVoice(v.name); }}
                                                >
                                                    {previewingPickerVoice === v.name ? <Square size={10} /> : <Play size={10} />}
                                                    {previewingPickerVoice === v.name ? 'Stop' : 'Preview'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="vp-footer">
                            <button className="vp-done-btn" onClick={() => setPickerOpen(false)}>
                                <Check size={14} /> Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
