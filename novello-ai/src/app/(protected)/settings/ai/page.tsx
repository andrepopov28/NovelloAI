'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Cpu,
    Cloud,
    RefreshCw,
    Check,
    AlertCircle,
    Loader2,
    Server,
    Sparkles,
    Zap,
    Mic2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';

/* ─── Types ──────────────────────────── */
interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
}

interface SettingsState {
    provider: 'ollama' | 'gemini';
    ollamaModel: string;
    geminiModel: string;
    geminiApiKey: string;
}

export default function AISettingsPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<SettingsState>({
        provider: 'ollama',
        ollamaModel: 'qwen2.5-coder:7b',
        geminiModel: 'gemini-2.0-flash',
        geminiApiKey: '',
    });

    // Ollama state
    const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
    const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
    const [scanningOllama, setScanningOllama] = useState(false);

    // Gemini state
    const [geminiStatus, setGeminiStatus] = useState<'untested' | 'testing' | 'connected' | 'error'>('untested');

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('novello-settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings((prev) => ({ ...prev, ...parsed }));
            } catch { /* ignore */ }
        }
    }, []);

    // Save to localStorage on change
    const updateSettings = useCallback((updates: Partial<SettingsState>) => {
        setSettings((prev) => {
            const next = { ...prev, ...updates };
            localStorage.setItem('novello-settings', JSON.stringify(next));
            return next;
        });
    }, []);

    // Scan Ollama
    const scanOllama = useCallback(async () => {
        setScanningOllama(true);
        setOllamaStatus('checking');
        try {
            const token = await user?.getIdToken();
            const healthRes = await fetch('/api/ai/health', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const health = await healthRes.json();

            if (health.ollama) {
                setOllamaStatus('connected');
                try {
                    const modelsRes = await fetch('http://127.0.0.1:11434/api/tags');
                    const modelsData = await modelsRes.json();
                    setOllamaModels(modelsData.models || []);
                    toast.success(`Ollama connected — ${(modelsData.models || []).length} models found`);
                } catch {
                    setOllamaModels([]);
                    toast.success('Ollama connected, but could not list models');
                }
            } else {
                setOllamaStatus('offline');
                setOllamaModels([]);
                toast.error('Ollama is not running. Start it with: ollama serve');
            }
        } catch {
            setOllamaStatus('offline');
            setOllamaModels([]);
            toast.error('Could not reach Ollama');
        } finally {
            setScanningOllama(false);
        }
    }, []);

    useEffect(() => {
        scanOllama();
    }, [scanOllama]);

    const testGemini = useCallback(async () => {
        if (!settings.geminiApiKey.trim()) {
            toast.error('Please enter a Gemini API key first');
            return;
        }
        setGeminiStatus('testing');
        try {
            const token = await user?.getIdToken();
            const res = await fetch('/api/ai/health', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.gemini) {
                setGeminiStatus('connected');
                toast.success('Gemini API connected!');
            } else {
                setGeminiStatus('error');
                toast.error('Gemini API not reachable');
            }
        } catch {
            setGeminiStatus('error');
            toast.error('Could not verify Gemini API');
        }
    }, [settings.geminiApiKey]);

    return (
        <div className="settings-content">
            <header className="content-header">
                <h2 className="content-title">AI & Models</h2>
                <p className="content-subtitle">Configure local and cloud-based AI providers</p>
            </header>

            <div className="settings-grid">
                {/* ── Active Provider ── */}
                <Card className="provider-select-card">
                    <div className="provider-select-header">
                        <Zap size={16} />
                        <span className="provider-select-title">Active AI Provider</span>
                    </div>
                    <div className="provider-toggle">
                        <button
                            className={`provider-opt ${settings.provider === 'ollama' ? 'provider-opt-active' : ''}`}
                            onClick={() => updateSettings({ provider: 'ollama' })}
                        >
                            <Cpu size={16} />
                            <span>Ollama (Local)</span>
                        </button>
                        <button
                            className={`provider-opt ${settings.provider === 'gemini' ? 'provider-opt-active' : ''}`}
                            onClick={() => updateSettings({ provider: 'gemini' })}
                        >
                            <Cloud size={16} />
                            <span>Gemini (Cloud)</span>
                        </button>
                    </div>
                </Card>

                {/* ── Ollama Section ── */}
                <Card className="settings-section">
                    <div className="section-head">
                        <div className="section-head-left">
                            <Server size={18} />
                            <div>
                                <h3 className="section-name">Local LLM — Ollama</h3>
                                <p className="section-desc">Run AI models locally on your machine. Free and private.</p>
                            </div>
                        </div>
                        <div className="status-badge-wrap">
                            {ollamaStatus === 'checking' && (
                                <span className="status-badge status-checking"><Loader2 size={12} className="animate-spin" /> Scanning...</span>
                            )}
                            {ollamaStatus === 'connected' && (
                                <span className="status-badge status-online"><Check size={12} /> Connected</span>
                            )}
                            {ollamaStatus === 'offline' && (
                                <span className="status-badge status-offline"><AlertCircle size={12} /> Offline</span>
                            )}
                        </div>
                    </div>

                    <div className="section-body">
                        <Button onClick={scanOllama} disabled={scanningOllama} className="scan-btn">
                            {scanningOllama ? (
                                <><Loader2 size={14} className="animate-spin" /> Scanning...</>
                            ) : (
                                <><RefreshCw size={14} /> Scan for Ollama</>
                            )}
                        </Button>

                        {ollamaStatus === 'connected' && ollamaModels.length > 0 && (
                            <div className="model-list">
                                <span className="model-list-label">Available Models ({ollamaModels.length})</span>
                                {ollamaModels.map((m) => (
                                    <button
                                        key={m.name}
                                        className={`model-row ${settings.ollamaModel === m.name ? 'model-row-active' : ''}`}
                                        onClick={() => updateSettings({ ollamaModel: m.name })}
                                    >
                                        <div className="model-row-left">
                                            {settings.ollamaModel === m.name ? (
                                                <Check size={14} className="model-check" />
                                            ) : (
                                                <div className="model-radio" />
                                            )}
                                            <span className="model-name">{m.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                {/* ── Gemini Section ── */}
                <Card className="settings-section">
                    <div className="section-head">
                        <div className="section-head-left">
                            <Sparkles size={18} />
                            <div>
                                <h3 className="section-name">Premium — Google Gemini</h3>
                                <p className="section-desc">Cloud-powered AI with higher quality and faster responses.</p>
                            </div>
                        </div>
                        <div className="status-badge-wrap">
                            {geminiStatus === 'untested' && (
                                <span className="status-badge status-neutral">Not tested</span>
                            )}
                            {geminiStatus === 'testing' && (
                                <span className="status-badge status-checking"><Loader2 size={12} className="animate-spin" /> Testing...</span>
                            )}
                            {geminiStatus === 'connected' && (
                                <span className="status-badge status-online"><Check size={12} /> Connected</span>
                            )}
                            {geminiStatus === 'error' && (
                                <span className="status-badge status-offline"><AlertCircle size={12} /> Error</span>
                            )}
                        </div>
                    </div>

                    <div className="section-body">
                        <div className="api-key-row">
                            <div className="api-key-input-wrap">
                                <input
                                    type="password"
                                    value={settings.geminiApiKey}
                                    onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                                    placeholder="Enter your Gemini API key..."
                                    className="api-key-input"
                                />
                            </div>
                            <Button onClick={testGemini} disabled={geminiStatus === 'testing'}>
                                {geminiStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : 'Test'}
                            </Button>
                        </div>

                        <div className="gemini-models">
                            <span className="model-list-label">Model</span>
                            <div className="gemini-model-grid">
                                {[
                                    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Fast, great for most tasks' },
                                    { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', desc: 'Highest quality' },
                                    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Latest, balanced' },
                                    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Premium, state of art' },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        className={`gemini-model-card ${settings.geminiModel === m.id ? 'gemini-model-active' : ''}`}
                                        onClick={() => updateSettings({ geminiModel: m.id })}
                                    >
                                        <span className="gemini-model-name">{m.name}</span>
                                        <span className="gemini-model-desc">{m.desc}</span>
                                        {settings.geminiModel === m.id && <Check size={12} className="gemini-check" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <style jsx>{`
                .settings-content {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                .content-header {
                    margin-bottom: 8px;
                }
                .content-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .content-subtitle {
                    font_size: 0.9rem;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }
                .settings-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .provider-select-card {
                    padding: 20px !important;
                }
                .provider-select-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                    color: var(--accent-warm);
                }
                .provider-select-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .provider-toggle {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .provider-opt {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 14px;
                    border-radius: var(--radius-md);
                    border: 1.5px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .provider-opt:hover {
                    border-color: var(--border-strong);
                }
                .provider-opt-active {
                    border-color: var(--accent-warm) !important;
                    background: var(--accent-warm-muted) !important;
                    color: var(--accent-warm) !important;
                }

                .settings-section {
                    padding: 0 !important;
                    overflow: hidden;
                }
                .section-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border);
                }
                .section-head-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    color: var(--accent-warm);
                }
                .section-name {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .section-desc {
                    font-size: 0.8rem;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }
                .section-body {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 14px;
                    border-radius: var(--radius-full);
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .status-online { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-offline { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .status-checking { background: rgba(234, 179, 8, 0.1); color: #eab308; }
                .status-neutral { background: var(--surface-tertiary); color: var(--text-tertiary); }

                .scan-btn { align-self: flex-start; }

                .model-list { display: flex; flex-direction: column; gap: 8px; }
                .model-list-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .model-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .model-row:hover { border-color: var(--border-strong); }
                .model-row-active { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .model-row-left { display: flex; align-items: center; gap: 12px; }
                .model-radio { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border-strong); }
                .model-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
                .model-size { font-size: 0.8rem; color: var(--text-tertiary); }

                .api-key-row { display: flex; gap: 12px; }
                .api-key-input-wrap { flex: 1; }
                .api-key-input {
                    width: 100%;
                    padding: 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    outline: none;
                }
                .api-key-input:focus { border-color: var(--accent-warm); }

                .gemini-model-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .gemini-model-card {
                    position: relative;
                    padding: 16px;
                    border-radius: var(--radius-md);
                    border: 1.5px solid var(--border);
                    background: var(--surface-tertiary);
                    text-align: left;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .gemini-model-card:hover { border-color: var(--border-strong); }
                .gemini-model-active { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .gemini-model-name { display: block; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
                .gemini-model-desc { display: block; font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px; }
                .gemini-check { position: absolute; top: 12px; right: 12px; color: var(--accent-warm); }
                .tts-provider-block { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface-tertiary); }
                .tts-provider-header { display: flex; align-items: center; justify-content: space-between; }
                .tts-provider-name { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
                .tts-provider-hint { font-size: 0.75rem; color: var(--text-tertiary); margin: 0; }
            `}</style>
        </div>
    );
}
