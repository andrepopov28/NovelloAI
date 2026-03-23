'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Mic2,
    Play,
    Square,
    Check,
    Loader2,
    Volume2,
    Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { toast } from 'sonner';
import { NEURAL_VOICES } from '@/lib/voices-config';

/* ─── Types ──────────────────────────── */
type TtsProvider = 'browser' | 'neural';

interface BrowserVoice {
    name: string;
    lang: string;
    localService: boolean;
    isEnhanced: boolean;
    voiceObj: SpeechSynthesisVoice;
}

const PREVIEW_TEXT = 'This is a preview of my voice. I hope you enjoy listening to your story.';

export default function VoiceSettingsContent() {
    const [activeTab, setActiveTab] = useState<TtsProvider>('neural');
    const [activeProvider, setActiveProvider] = useState<TtsProvider>('neural');

    // Browsers
    const [browserVoices, setBrowserVoices] = useState<BrowserVoice[]>([]);
    const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

    // Neural
    const [selectedNeuralVoice, setSelectedNeuralVoice] = useState<string>('');

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load from localStorage
    useEffect(() => {
        const storedProvider = localStorage.getItem('novello-tts-provider') as TtsProvider;
        if (storedProvider === 'neural' || storedProvider === 'browser') {
            setActiveProvider(storedProvider);
            setActiveTab(storedProvider);
        } else {
            setActiveProvider('neural');
            setActiveTab('neural');
        }
        setSelectedBrowserVoice(localStorage.getItem('novello-tts-voice-browser') || '');
        setSelectedNeuralVoice(localStorage.getItem('novello-tts-voice-neural') || 'piper-lessac');
    }, []);

    // Load browser voices
    useEffect(() => {
        const loadVoices = () => {
            if (typeof window === 'undefined') return;
            const raw = window.speechSynthesis.getVoices();
            const parsed: BrowserVoice[] = raw
                .filter(v => v.lang.startsWith('en'))
                .map(v => ({
                    name: v.name,
                    lang: v.lang,
                    localService: v.localService,
                    isEnhanced: v.name.toLowerCase().includes('enhanced') || v.name.toLowerCase().includes('premium') || v.localService,
                    voiceObj: v,
                }))
                .sort((a, b) => {
                    if (a.isEnhanced && !b.isEnhanced) return -1;
                    if (!a.isEnhanced && b.isEnhanced) return 1;
                    return a.name.localeCompare(b.name);
                });
            setBrowserVoices(parsed);
            if (!selectedBrowserVoice && parsed.length > 0) {
                setSelectedBrowserVoice(parsed[0].name);
            }
        };
        loadVoices();
        if (typeof window !== 'undefined') {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, [selectedBrowserVoice]);

    const selectProvider = (p: TtsProvider) => {
        setActiveProvider(p);
        localStorage.setItem('novello-tts-provider', p);
        toast.success(`Active TTS provider: ${p === 'browser' ? 'Browser' : 'Neural'}`);
    };

    // ── Preview Functions ──
    const stopAudio = () => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setPreviewingVoice(null);
    };

    const previewBrowserVoice = (voice: BrowserVoice) => {
        if (previewingVoice === voice.name) {
            stopAudio();
            return;
        }
        stopAudio();
        const utt = new SpeechSynthesisUtterance(PREVIEW_TEXT);
        utt.voice = voice.voiceObj;
        utt.onend = () => setPreviewingVoice(null);
        utt.onerror = () => setPreviewingVoice(null);
        setPreviewingVoice(voice.name);
        window.speechSynthesis.speak(utt);
    };

    const previewNeuralVoice = async (voiceId: string) => {
        if (previewingVoice === voiceId) {
            stopAudio();
            return;
        }
        stopAudio();

        setPreviewingVoice(voiceId);
        toast.loading('Synthesizing...', { id: 'tts-toast' });
        try {
            const res = await fetch('/api/voice/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: PREVIEW_TEXT, voiceId })
            });

            if (!res.ok) throw new Error(await res.text());

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            toast.dismiss('tts-toast');

            audio.onended = () => {
                setPreviewingVoice(null);
                URL.revokeObjectURL(url);
            };
            audio.onerror = () => setPreviewingVoice(null);

            await audio.play();
        } catch (e) {
            console.error(e);
            toast.error('Failed to preview neural voice', { id: 'tts-toast' });
            setPreviewingVoice(null);
        }
    };

    const enhanceVoices = browserVoices.filter(v => v.isEnhanced);
    const standardVoices = browserVoices.filter(v => !v.isEnhanced);

    return (
        <div className="vc-root">
            <header className="vc-header">
                <div className="vc-header-icon">
                    <Mic2 size={20} />
                </div>
                <div>
                    <h2 className="vc-title">Voice & TTS</h2>
                    <p className="vc-subtitle">Choose your text-to-speech engine and voice</p>
                </div>
            </header>

            {/* Active Provider Selector */}
            <Card className="vc-provider-card">
                <div className="vc-provider-label">
                    <Volume2 size={14} />
                    <span>Active TTS Provider</span>
                </div>
                <div className="vc-provider-toggle">
                    {(['neural', 'browser'] as TtsProvider[]).map(p => (
                        <button
                            key={p}
                            className={`vc-provider-opt ${activeProvider === p ? 'vc-provider-active' : ''}`}
                            onClick={() => selectProvider(p)}
                        >
                            {activeProvider === p && <Check size={13} />}
                            <span>{p === 'neural' ? '🎙️ Neural' : '🌐 Browser'}</span>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Tabs */}
            <div className="vc-tabs">
                {(['neural', 'browser'] as TtsProvider[]).map(t => (
                    <button
                        key={t}
                        className={`vc-tab ${activeTab === t ? 'vc-tab-active' : ''}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {t === 'neural' ? 'Neural Voices (Piper)' : 'Browser Voices'}
                        {activeProvider === t && <span className="vc-tab-dot" />}
                    </button>
                ))}
            </div>

            {/* ── Neural Tab ── */}
            {activeTab === 'neural' && (
                <div className="vc-section">
                    <p className="vc-section-desc">
                        These are high-quality, commercially-safe models rendered natively by Piper via Novello AI&apos;s backend infrastructure. They are automatically used for audiobook exports.
                    </p>

                    <div className="vc-voice-group">
                        <div className="vc-group-label">
                            <Sparkles size={12} />
                            <span>High Quality</span>
                        </div>
                        {NEURAL_VOICES.filter(v => v.quality === 'High').map(v => (
                            <VoiceRow
                                key={v.id}
                                name={v.name}
                                lang={v.accent}
                                badge={v.licenseName}
                                badgeColor={v.commercialOk ? "#10b981" : "#ef4444"}
                                desc={v.description}
                                isSelected={selectedNeuralVoice === v.id}
                                isPreviewing={previewingVoice === v.id}
                                onSelect={() => {
                                    setSelectedNeuralVoice(v.id);
                                    localStorage.setItem('novello-tts-voice-neural', v.id);
                                }}
                                onPreview={() => previewNeuralVoice(v.id)}
                            />
                        ))}
                    </div>

                    <div className="vc-voice-group">
                        <div className="vc-group-label">
                            <Volume2 size={12} />
                            <span>Medium / Low Quality</span>
                        </div>
                        {NEURAL_VOICES.filter(v => v.quality !== 'High').map(v => (
                            <VoiceRow
                                key={v.id}
                                name={v.name}
                                lang={v.accent}
                                badge={v.licenseName}
                                badgeColor={v.commercialOk ? "#10b981" : "#ef4444"}
                                desc={v.description}
                                isSelected={selectedNeuralVoice === v.id}
                                isPreviewing={previewingVoice === v.id}
                                onSelect={() => {
                                    setSelectedNeuralVoice(v.id);
                                    localStorage.setItem('novello-tts-voice-neural', v.id);
                                }}
                                onPreview={() => previewNeuralVoice(v.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Browser Tab ── */}
            {activeTab === 'browser' && (
                <div className="vc-section">
                    <p className="vc-section-desc">
                        Uses your device&apos;s built-in speech synthesis. On macOS, <strong>Enhanced</strong> voices use Apple&apos;s neural engine and sound significantly more natural.
                    </p>

                    {enhanceVoices.length > 0 && (
                        <div className="vc-voice-group">
                            <div className="vc-group-label">
                                <Sparkles size={12} />
                                <span>Enhanced / Neural</span>
                            </div>
                            {enhanceVoices.map(v => (
                                <VoiceRow
                                    key={v.name}
                                    name={v.name}
                                    lang={v.lang}
                                    badge="Neural"
                                    badgeColor="#10b981"
                                    isSelected={selectedBrowserVoice === v.name}
                                    isPreviewing={previewingVoice === v.name}
                                    onSelect={() => {
                                        setSelectedBrowserVoice(v.name);
                                        localStorage.setItem('novello-tts-voice-browser', v.name);
                                    }}
                                    onPreview={() => previewBrowserVoice(v)}
                                />
                            ))}
                        </div>
                    )}

                    {standardVoices.length > 0 && (
                        <div className="vc-voice-group">
                            <div className="vc-group-label">
                                <Volume2 size={12} />
                                <span>Standard</span>
                            </div>
                            {standardVoices.map(v => (
                                <VoiceRow
                                    key={v.name}
                                    name={v.name}
                                    lang={v.lang}
                                    badge="Standard"
                                    badgeColor="var(--text-tertiary)"
                                    isSelected={selectedBrowserVoice === v.name}
                                    isPreviewing={previewingVoice === v.name}
                                    onSelect={() => {
                                        setSelectedBrowserVoice(v.name);
                                        localStorage.setItem('novello-tts-voice-browser', v.name);
                                    }}
                                    onPreview={() => previewBrowserVoice(v)}
                                />
                            ))}
                        </div>
                    )}

                    {browserVoices.length === 0 && (
                        <div className="vc-empty">
                            <Loader2 size={20} className="animate-spin" />
                            <span>Loading voices...</span>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .vc-root { display: flex; flex-direction: column; gap: 24px; }
                .vc-header { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
                .vc-header-icon {
                    width: 44px; height: 44px; border-radius: 12px;
                    background: linear-gradient(135deg, #f59e0b, #ec4899);
                    display: flex; align-items: center; justify-content: center; color: white;
                }
                .vc-title { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
                .vc-subtitle { font-size: 0.85rem; color: var(--text-tertiary); margin-top: 2px; }

                .vc-provider-card { padding: 18px 20px !important; }
                .vc-provider-label {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 0.78rem; font-weight: 600; color: var(--text-tertiary);
                    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;
                }
                .vc-provider-toggle { display: flex; gap: 10px; }
                .vc-provider-opt {
                    display: flex; align-items: center; gap: 7px;
                    padding: 10px 18px; border-radius: var(--radius-md);
                    border: 1.5px solid var(--border); background: var(--surface-tertiary);
                    color: var(--text-secondary); font-size: 0.85rem; font-weight: 600;
                    cursor: pointer; transition: all 0.2s;
                }
                .vc-provider-opt:hover { border-color: var(--border-strong); color: var(--text-primary); }
                .vc-provider-active { border-color: var(--accent-warm) !important; background: var(--accent-warm-muted) !important; color: var(--accent-warm) !important; }

                .vc-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); }
                .vc-tab {
                    position: relative; display: flex; align-items: center; gap: 6px;
                    padding: 10px 20px; font-size: 0.85rem; font-weight: 600;
                    color: var(--text-tertiary); background: none; border: none;
                    cursor: pointer; transition: color 0.2s;
                }
                .vc-tab:hover { color: var(--text-primary); }
                .vc-tab-active { color: var(--text-primary); }
                .vc-tab-active::after {
                    content: ''; position: absolute; bottom: -1px; left: 0; right: 0;
                    height: 2px; background: var(--accent-warm); border-radius: 2px 2px 0 0;
                }
                .vc-tab-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: var(--accent-warm); display: inline-block;
                }

                .vc-section { display: flex; flex-direction: column; gap: 20px; padding-bottom: 40px; }
                .vc-section-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; }

                .vc-voice-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
                .vc-group-label {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.72rem; font-weight: 700; color: var(--text-tertiary);
                    text-transform: uppercase; letter-spacing: 0.06em;
                    margin-bottom: 4px; padding: 0 4px;
                }

                .vc-empty { display: flex; align-items: center; gap: 10px; padding: 2rem; justify-content: center; color: var(--text-tertiary); font-size: 0.85rem; }
            `}</style>
        </div>
    );
}

/* ─── Shared VoiceRow component ── */
function VoiceRow({
    name, lang, badge, badgeColor, desc, isSelected, isPreviewing, onSelect, onPreview,
}: {
    name: string; lang: string; badge: string; badgeColor: string; desc?: string;
    isSelected: boolean; isPreviewing: boolean;
    onSelect: () => void; onPreview: () => void;
}) {
    return (
        <div
            className={`vr-row ${isSelected ? 'vr-selected' : ''}`}
            onClick={onSelect}
        >
            <div className="vr-left">
                <div className={`vr-radio ${isSelected ? 'vr-radio-active' : ''}`}>
                    {isSelected && <Check size={11} />}
                </div>
                <div className="vr-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="vr-name">{name}</span>
                        <span className="vr-lang">{lang}</span>
                    </div>
                    {desc && <span className="vr-desc">{desc}</span>}
                </div>
            </div>
            <div className="vr-right">
                <span className="vr-badge" style={{ color: badgeColor, background: `${badgeColor}18`, border: `1px solid ${badgeColor}40` }}>{badge}</span>
                <button
                    className={`vr-preview-btn ${isPreviewing ? 'vr-preview-active' : ''}`}
                    onClick={e => { e.stopPropagation(); onPreview(); }}
                >
                    {isPreviewing ? <Square size={11} /> : <Play size={11} />}
                    {isPreviewing ? 'Stop' : 'Preview'}
                </button>
            </div>
            <style jsx>{`
                .vr-row {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 12px 14px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    cursor: pointer; transition: all 0.15s;
                }
                .vr-row:hover { border-color: var(--border-strong); }
                .vr-selected { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .vr-left { display: flex; align-items: center; gap: 14px; }
                .vr-radio {
                    width: 18px; height: 18px; border-radius: 50%;
                    border: 2px solid var(--border-strong);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: all 0.15s;
                }
                .vr-radio-active { border-color: var(--accent-warm); background: var(--accent-warm); color: white; }
                .vr-info { display: flex; flex-direction: column; gap: 3px; }
                .vr-name { font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
                .vr-lang { font-size: 0.7rem; color: var(--text-tertiary); font-weight: 500;}
                .vr-desc { font-size: 0.75rem; color: var(--text-secondary); max-width: 350px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
                .vr-right { display: flex; align-items: center; gap: 12px; }
                .vr-badge {
                    padding: 3px 8px; border-radius: var(--radius-sm);
                    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.03em;
                }
                .vr-preview-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 6px 12px; border-radius: var(--radius-sm);
                    border: 1px solid var(--border); background: var(--surface-secondary);
                    color: var(--text-secondary); font-size: 0.72rem; font-weight: 600;
                    cursor: pointer; transition: all 0.15s;
                }
                .vr-preview-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }
                .vr-preview-active { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.08); }
            `}</style>
        </div>
    );
}
