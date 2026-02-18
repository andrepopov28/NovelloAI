'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Mic2,
    Play,
    Square,
    Check,
    Loader2,
    AlertCircle,
    Volume2,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

/* ─── Types ──────────────────────────── */
type TtsProvider = 'browser' | 'elevenlabs' | 'openai';

interface BrowserVoice {
    name: string;
    lang: string;
    localService: boolean;
    isEnhanced: boolean;
    voiceObj: SpeechSynthesisVoice;
}

const OPENAI_VOICES = [
    { id: 'alloy', name: 'Alloy', desc: 'Neutral, balanced' },
    { id: 'echo', name: 'Echo', desc: 'Warm, conversational' },
    { id: 'fable', name: 'Fable', desc: 'British, expressive' },
    { id: 'onyx', name: 'Onyx', desc: 'Deep, authoritative' },
    { id: 'nova', name: 'Nova', desc: 'Bright, energetic' },
    { id: 'shimmer', name: 'Shimmer', desc: 'Soft, gentle' },
];

const PREVIEW_TEXT = 'This is a preview of my voice. I hope you enjoy listening to your story.';

export default function VoiceSettingsPage() {
    const [activeTab, setActiveTab] = useState<TtsProvider>('browser');
    const [activeProvider, setActiveProvider] = useState<TtsProvider>('browser');

    // Browser voices
    const [browserVoices, setBrowserVoices] = useState<BrowserVoice[]>([]);
    const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string>('');
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

    // ElevenLabs
    const [elKey, setElKey] = useState('');
    const [elKeySaved, setElKeySaved] = useState(false);
    const [elVoices, setElVoices] = useState<{ voice_id: string; name: string; labels?: Record<string, string> }[]>([]);
    const [elLoading, setElLoading] = useState(false);
    const [selectedElVoice, setSelectedElVoice] = useState('');

    // OpenAI TTS
    const [oaiKey, setOaiKey] = useState('');
    const [oaiKeySaved, setOaiKeySaved] = useState(false);
    const [selectedOaiVoice, setSelectedOaiVoice] = useState('alloy');
    const [oaiModel, setOaiModel] = useState<'tts-1' | 'tts-1-hd'>('tts-1-hd');
    const [oaiPreviewing, setOaiPreviewing] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load from localStorage
    useEffect(() => {
        const provider = (localStorage.getItem('novello-tts-provider') as TtsProvider) || 'browser';
        setActiveProvider(provider);
        setActiveTab(provider);
        setSelectedBrowserVoice(localStorage.getItem('novello-tts-voice') || '');
        setSelectedElVoice(localStorage.getItem('novello-elevenlabs-voice') || '');
        setSelectedOaiVoice(localStorage.getItem('novello-openai-tts-voice') || 'alloy');
        setOaiModel((localStorage.getItem('novello-openai-tts-model') as 'tts-1' | 'tts-1-hd') || 'tts-1-hd');

        const savedElKey = localStorage.getItem('novello-elevenlabs-key') || '';
        const savedOaiKey = localStorage.getItem('novello-openai-key') || '';
        setElKey(savedElKey);
        setOaiKey(savedOaiKey);
        if (savedElKey) setElKeySaved(true);
        if (savedOaiKey) setOaiKeySaved(true);
    }, []);

    // Load browser voices
    useEffect(() => {
        const loadVoices = () => {
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
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, [selectedBrowserVoice]);

    // Fetch ElevenLabs voices
    const fetchElVoices = useCallback(async (key: string) => {
        if (!key) return;
        setElLoading(true);
        try {
            const res = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: { 'xi-api-key': key },
            });
            if (!res.ok) throw new Error('Invalid key');
            const data = await res.json();
            setElVoices(data.voices || []);
            toast.success(`${(data.voices || []).length} ElevenLabs voices loaded`);
        } catch {
            toast.error('Could not load ElevenLabs voices — check your API key');
        } finally {
            setElLoading(false);
        }
    }, []);

    const saveElKey = () => {
        localStorage.setItem('novello-elevenlabs-key', elKey);
        setElKeySaved(true);
        fetchElVoices(elKey);
    };

    const saveOaiKey = () => {
        localStorage.setItem('novello-openai-key', oaiKey);
        setOaiKeySaved(true);
        toast.success('OpenAI key saved');
    };

    const selectProvider = (p: TtsProvider) => {
        setActiveProvider(p);
        localStorage.setItem('novello-tts-provider', p);
        toast.success(`Active TTS provider: ${p === 'browser' ? 'Browser' : p === 'elevenlabs' ? 'ElevenLabs' : 'OpenAI'}`);
    };

    // Browser voice preview
    const previewBrowserVoice = (voice: BrowserVoice) => {
        window.speechSynthesis.cancel();
        if (previewingVoice === voice.name) {
            setPreviewingVoice(null);
            return;
        }
        const utt = new SpeechSynthesisUtterance(PREVIEW_TEXT);
        utt.voice = voice.voiceObj;
        utt.onend = () => setPreviewingVoice(null);
        utt.onerror = () => setPreviewingVoice(null);
        setPreviewingVoice(voice.name);
        window.speechSynthesis.speak(utt);
    };

    const selectBrowserVoice = (name: string) => {
        setSelectedBrowserVoice(name);
        localStorage.setItem('novello-tts-voice', name);
    };

    // OpenAI TTS preview
    const previewOaiVoice = async (voiceId: string) => {
        if (!oaiKey) { toast.error('Save your OpenAI key first'); return; }
        if (oaiPreviewing) {
            audioRef.current?.pause();
            setOaiPreviewing(false);
            return;
        }
        setOaiPreviewing(true);
        try {
            const res = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${oaiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ model: oaiModel, voice: voiceId, input: PREVIEW_TEXT }),
            });
            if (!res.ok) throw new Error('API error');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => setOaiPreviewing(false);
            audio.play();
        } catch {
            toast.error('Preview failed — check your OpenAI key');
            setOaiPreviewing(false);
        }
    };

    const selectOaiVoice = (id: string) => {
        setSelectedOaiVoice(id);
        localStorage.setItem('novello-openai-tts-voice', id);
    };

    const selectOaiModel = (m: 'tts-1' | 'tts-1-hd') => {
        setOaiModel(m);
        localStorage.setItem('novello-openai-tts-model', m);
    };

    const enhancedVoices = browserVoices.filter(v => v.isEnhanced);
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
                    {(['browser', 'elevenlabs', 'openai'] as TtsProvider[]).map(p => (
                        <button
                            key={p}
                            className={`vc-provider-opt ${activeProvider === p ? 'vc-provider-active' : ''}`}
                            onClick={() => selectProvider(p)}
                        >
                            {activeProvider === p && <Check size={13} />}
                            <span>{p === 'browser' ? '🌐 Browser' : p === 'elevenlabs' ? '⚡ ElevenLabs' : '✦ OpenAI'}</span>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Tabs */}
            <div className="vc-tabs">
                {(['browser', 'elevenlabs', 'openai'] as TtsProvider[]).map(t => (
                    <button
                        key={t}
                        className={`vc-tab ${activeTab === t ? 'vc-tab-active' : ''}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {t === 'browser' ? 'Browser Voices' : t === 'elevenlabs' ? 'ElevenLabs' : 'OpenAI TTS'}
                        {activeProvider === t && <span className="vc-tab-dot" />}
                    </button>
                ))}
            </div>

            {/* ── Browser Tab ── */}
            {activeTab === 'browser' && (
                <div className="vc-section">
                    <p className="vc-section-desc">
                        Uses your device&apos;s built-in speech synthesis. On macOS, <strong>Enhanced</strong> voices use Apple&apos;s neural engine and sound significantly more natural.
                    </p>

                    {enhancedVoices.length > 0 && (
                        <div className="vc-voice-group">
                            <div className="vc-group-label">
                                <Sparkles size={12} />
                                <span>Enhanced / Neural</span>
                            </div>
                            {enhancedVoices.map(v => (
                                <VoiceRow
                                    key={v.name}
                                    name={v.name}
                                    lang={v.lang}
                                    badge="Neural"
                                    badgeColor="#10b981"
                                    isSelected={selectedBrowserVoice === v.name}
                                    isPreviewing={previewingVoice === v.name}
                                    onSelect={() => selectBrowserVoice(v.name)}
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
                                    onSelect={() => selectBrowserVoice(v.name)}
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

            {/* ── ElevenLabs Tab ── */}
            {activeTab === 'elevenlabs' && (
                <div className="vc-section">
                    <Card className="vc-api-card">
                        <div className="vc-api-header">
                            <div>
                                <h3 className="vc-api-title">ElevenLabs API Key</h3>
                                <p className="vc-api-desc">Get your key at <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="vc-link">elevenlabs.io</a></p>
                            </div>
                            {elKeySaved && <span className="vc-saved-badge"><Check size={11} /> Saved</span>}
                        </div>
                        <div className="vc-key-row">
                            <input
                                type="password"
                                value={elKey}
                                onChange={e => setElKey(e.target.value)}
                                placeholder="sk-..."
                                className="vc-key-input"
                            />
                            <Button onClick={saveElKey} disabled={!elKey.trim()}>
                                {elLoading ? <Loader2 size={14} className="animate-spin" /> : 'Save & Load'}
                            </Button>
                        </div>
                    </Card>

                    {elLoading && (
                        <div className="vc-empty"><Loader2 size={18} className="animate-spin" /><span>Loading voices...</span></div>
                    )}

                    {!elLoading && elVoices.length > 0 && (
                        <div className="vc-voice-group">
                            <div className="vc-group-label"><Sparkles size={12} /><span>Available Voices ({elVoices.length})</span></div>
                            {elVoices.map(v => (
                                <VoiceRow
                                    key={v.voice_id}
                                    name={v.name}
                                    lang={v.labels?.accent || 'en'}
                                    badge="ElevenLabs"
                                    badgeColor="#8b5cf6"
                                    isSelected={selectedElVoice === v.voice_id}
                                    isPreviewing={false}
                                    onSelect={() => {
                                        setSelectedElVoice(v.voice_id);
                                        localStorage.setItem('novello-elevenlabs-voice', v.voice_id);
                                    }}
                                    onPreview={() => toast.info('ElevenLabs preview uses your quota — select a voice to use it')}
                                />
                            ))}
                        </div>
                    )}

                    {!elLoading && elVoices.length === 0 && elKeySaved && (
                        <div className="vc-empty"><AlertCircle size={18} /><span>No voices loaded. Check your API key.</span></div>
                    )}
                </div>
            )}

            {/* ── OpenAI Tab ── */}
            {activeTab === 'openai' && (
                <div className="vc-section">
                    <Card className="vc-api-card">
                        <div className="vc-api-header">
                            <div>
                                <h3 className="vc-api-title">OpenAI API Key</h3>
                                <p className="vc-api-desc">Get your key at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="vc-link">platform.openai.com</a></p>
                            </div>
                            {oaiKeySaved && <span className="vc-saved-badge"><Check size={11} /> Saved</span>}
                        </div>
                        <div className="vc-key-row">
                            <input
                                type="password"
                                value={oaiKey}
                                onChange={e => setOaiKey(e.target.value)}
                                placeholder="sk-..."
                                className="vc-key-input"
                            />
                            <Button onClick={saveOaiKey} disabled={!oaiKey.trim()}>Save</Button>
                        </div>
                    </Card>

                    {/* Model selector */}
                    <div className="vc-model-row">
                        <span className="vc-group-label-text">Model Quality</span>
                        <div className="vc-model-toggle">
                            <button className={`vc-model-opt ${oaiModel === 'tts-1' ? 'vc-model-active' : ''}`} onClick={() => selectOaiModel('tts-1')}>
                                tts-1 <span className="vc-model-sub">Fast</span>
                            </button>
                            <button className={`vc-model-opt ${oaiModel === 'tts-1-hd' ? 'vc-model-active' : ''}`} onClick={() => selectOaiModel('tts-1-hd')}>
                                tts-1-hd <span className="vc-model-sub">High Quality</span>
                            </button>
                        </div>
                    </div>

                    {/* Voice grid */}
                    <div className="vc-voice-group">
                        <div className="vc-group-label"><Sparkles size={12} /><span>Voices</span></div>
                        <div className="vc-oai-grid">
                            {OPENAI_VOICES.map(v => (
                                <button
                                    key={v.id}
                                    className={`vc-oai-card ${selectedOaiVoice === v.id ? 'vc-oai-active' : ''}`}
                                    onClick={() => selectOaiVoice(v.id)}
                                >
                                    <div className="vc-oai-card-top">
                                        <span className="vc-oai-name">{v.name}</span>
                                        {selectedOaiVoice === v.id && <Check size={13} className="vc-oai-check" />}
                                    </div>
                                    <span className="vc-oai-desc">{v.desc}</span>
                                    <button
                                        className="vc-oai-preview"
                                        onClick={e => { e.stopPropagation(); previewOaiVoice(v.id); }}
                                    >
                                        {oaiPreviewing && selectedOaiVoice === v.id ? <Square size={10} /> : <Play size={10} />}
                                        Preview
                                    </button>
                                </button>
                            ))}
                        </div>
                    </div>
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

                .vc-section { display: flex; flex-direction: column; gap: 20px; }
                .vc-section-desc { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; }

                .vc-voice-group { display: flex; flex-direction: column; gap: 6px; }
                .vc-group-label {
                    display: flex; align-items: center; gap: 6px;
                    font-size: 0.72rem; font-weight: 700; color: var(--text-tertiary);
                    text-transform: uppercase; letter-spacing: 0.06em;
                    margin-bottom: 4px; padding: 0 4px;
                }
                .vc-group-label-text {
                    font-size: 0.72rem; font-weight: 700; color: var(--text-tertiary);
                    text-transform: uppercase; letter-spacing: 0.06em;
                }

                .vc-empty { display: flex; align-items: center; gap: 10px; padding: 2rem; justify-content: center; color: var(--text-tertiary); font-size: 0.85rem; }

                .vc-api-card { padding: 20px !important; }
                .vc-api-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
                .vc-api-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
                .vc-api-desc { font-size: 0.78rem; color: var(--text-tertiary); margin-top: 3px; }
                .vc-link { color: var(--accent-warm); text-decoration: none; }
                .vc-link:hover { text-decoration: underline; }
                .vc-saved-badge {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 4px 10px; border-radius: var(--radius-full);
                    background: rgba(16, 185, 129, 0.1); color: #10b981;
                    font-size: 0.72rem; font-weight: 600; white-space: nowrap;
                }
                .vc-key-row { display: flex; gap: 10px; }
                .vc-key-input {
                    flex: 1; padding: 10px 14px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    color: var(--text-primary); font-size: 0.85rem; outline: none;
                }
                .vc-key-input:focus { border-color: var(--accent-warm); }

                .vc-model-row { display: flex; align-items: center; gap: 16px; }
                .vc-model-toggle { display: flex; gap: 8px; }
                .vc-model-opt {
                    display: flex; flex-direction: column; align-items: center;
                    padding: 10px 20px; border-radius: var(--radius-md);
                    border: 1.5px solid var(--border); background: var(--surface-tertiary);
                    color: var(--text-secondary); font-size: 0.85rem; font-weight: 700;
                    cursor: pointer; transition: all 0.2s;
                }
                .vc-model-sub { font-size: 0.68rem; font-weight: 400; color: var(--text-tertiary); margin-top: 2px; }
                .vc-model-active { border-color: var(--accent-warm); background: var(--accent-warm-muted); color: var(--accent-warm); }

                .vc-oai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .vc-oai-card {
                    position: relative; display: flex; flex-direction: column; gap: 4px;
                    padding: 14px 16px; border-radius: var(--radius-md);
                    border: 1.5px solid var(--border); background: var(--surface-tertiary);
                    text-align: left; cursor: pointer; transition: all 0.2s;
                }
                .vc-oai-card:hover { border-color: var(--border-strong); }
                .vc-oai-active { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .vc-oai-card-top { display: flex; align-items: center; justify-content: space-between; }
                .vc-oai-name { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
                .vc-oai-check { color: var(--accent-warm); }
                .vc-oai-desc { font-size: 0.75rem; color: var(--text-tertiary); }
                .vc-oai-preview {
                    display: inline-flex; align-items: center; gap: 5px;
                    margin-top: 8px; padding: 5px 10px; border-radius: var(--radius-sm);
                    border: 1px solid var(--border); background: var(--surface-secondary);
                    color: var(--text-secondary); font-size: 0.72rem; font-weight: 600;
                    cursor: pointer; transition: all 0.15s; align-self: flex-start;
                }
                .vc-oai-preview:hover { border-color: var(--border-strong); color: var(--text-primary); }
            `}</style>
        </div>
    );
}

/* ─── Shared VoiceRow component ── */
function VoiceRow({
    name, lang, badge, badgeColor, isSelected, isPreviewing, onSelect, onPreview,
}: {
    name: string; lang: string; badge: string; badgeColor: string;
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
                    <span className="vr-name">{name}</span>
                    <span className="vr-lang">{lang}</span>
                </div>
            </div>
            <div className="vr-right">
                <span className="vr-badge" style={{ color: badgeColor, background: `${badgeColor}18` }}>{badge}</span>
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
                    padding: 11px 14px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-tertiary);
                    cursor: pointer; transition: all 0.15s;
                }
                .vr-row:hover { border-color: var(--border-strong); }
                .vr-selected { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .vr-left { display: flex; align-items: center; gap: 12px; }
                .vr-radio {
                    width: 18px; height: 18px; border-radius: 50%;
                    border: 2px solid var(--border-strong);
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0; transition: all 0.15s;
                }
                .vr-radio-active { border-color: var(--accent-warm); background: var(--accent-warm); color: white; }
                .vr-info { display: flex; flex-direction: column; gap: 1px; }
                .vr-name { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
                .vr-lang { font-size: 0.72rem; color: var(--text-tertiary); }
                .vr-right { display: flex; align-items: center; gap: 10px; }
                .vr-badge {
                    padding: 3px 8px; border-radius: var(--radius-full);
                    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.03em;
                }
                .vr-preview-btn {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 5px 10px; border-radius: var(--radius-sm);
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
