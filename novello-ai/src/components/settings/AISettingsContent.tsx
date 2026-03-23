'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Cpu,
    RefreshCw,
    Check,
    AlertCircle,
    Loader2,
    Server,
    BarChart3,
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
    provider: 'ollama';
    ollamaModel: string;
    budget: {
        daily: number;
        weekly: number;
        monthly: number;
        annual: number;
        total: number;
    }
}

// Mock Token Usage Data
const mockUsage = {
    local: {
        day: { in: 15400, out: 4200 },
        week: { in: 125000, out: 38000 },
        month: { in: 640000, out: 185000 },
        year: { in: 2100000, out: 580000 },
        total: { in: 2100000, out: 580000 }
    }
};

const LOCAL_BLENDED_RATE = 5.00; // $5 per 1M tokens saved

type Timeframe = 'day' | 'week' | 'month' | 'year' | 'total';
const TIMEFRAMES: { id: Timeframe, label: string }[] = [
    { id: 'day', label: '24h' },
    { id: 'week', label: '7d' },
    { id: 'month', label: '30d' },
    { id: 'year', label: '1y' },
    { id: 'total', label: 'All' }
];

export default function AISettingsContent() {
    const { user } = useAuth();
    const [settings, setSettings] = useState<SettingsState>({
        provider: 'ollama',
        ollamaModel: 'llama3',
        budget: {
            daily: 1.00,
            weekly: 5.00,
            monthly: 20.00,
            annual: 100.00,
            total: 500.00
        }
    });

    const [timeframe, setTimeframe] = useState<Timeframe>('month');

    // Ollama state
    const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
    const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
    const [scanningOllama, setScanningOllama] = useState(false);


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
            const token = user?.uid ?? 'local';
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
    }, [user]);

    useEffect(() => {
        scanOllama();
    }, [scanOllama]);

    return (
        <div className="settings-content">
            <header className="content-header">
                <h2 className="content-title">AI & Models</h2>
                <p className="content-subtitle">Configure providers, track usage, and manage API budgets</p>
            </header>

            <div className="settings-grid">


                {/* ── Token Usage & Cost Monitor ── */}
                <Card className="settings-section">
                    <div className="section-head">
                        <div className="section-head-left">
                            <BarChart3 size={18} />
                            <div>
                                <h3 className="section-name">Token Usage & Cost Monitor</h3>
                                <p className="section-desc">Track AI metrics and api spends across Local and Cloud providers.</p>
                            </div>
                        </div>
                        <div className="timeframe-toggle">
                            {TIMEFRAMES.map(t => (
                                <button
                                    key={t.id}
                                    className={`timeframe-btn ${timeframe === t.id ? 'timeframe-active' : ''}`}
                                    onClick={() => setTimeframe(t.id)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="section-body">
                        <div className="usage-grid">
                            {/* Local Usage Block */}
                            {(() => {
                                const localIn = mockUsage.local[timeframe].in;
                                const localOut = mockUsage.local[timeframe].out;
                                const localTot = localIn + localOut;
                                const saved = (localTot / 1000000) * LOCAL_BLENDED_RATE;

                                return (
                                    <div className="usage-block local-usage">
                                        <div className="usage-header">
                                            <Cpu size={16} className="text-[var(--accent-blue)]" />
                                            <span className="usage-title">Local OSS Output</span>
                                        </div>
                                        <div className="usage-stats">
                                            <div className="stat-item">
                                                <span className="stat-val">{localTot.toLocaleString()}</span>
                                                <span className="stat-lbl">Tokens</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-val text-[var(--accent-blue)]">${saved.toFixed(2)}</span>
                                                <span className="stat-lbl">Value Saved</span>
                                            </div>
                                        </div>
                                        <div className="usage-detail">
                                            <span>{localIn.toLocaleString()} in</span>
                                            <span>·</span>
                                            <span>{localOut.toLocaleString()} out</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
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

                /* Token Monitor Styles */
                .timeframe-toggle { display: flex; gap: 4px; background: var(--surface-tertiary); padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border); }
                .timeframe-btn { padding: 4px 10px; font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); background: transparent; border: none; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
                .timeframe-btn:hover { color: var(--text-primary); }
                .timeframe-active { background: var(--surface-elevated); color: var(--text-primary); box-shadow: var(--shadow-sm); }
                
                .usage-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .usage-block { padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface-tertiary); }
                .usage-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
                .usage-title { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em; }
                
                .usage-stats { display: flex; gap: 24px; margin-bottom: 12px; }
                .stat-item { display: flex; flex-direction: column; }
                .stat-val { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
                .stat-lbl { font-size: 0.75rem; color: var(--text-tertiary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
                
                .usage-detail { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: var(--text-tertiary); }
                
                @media (max-width: 768px) {
                    .usage-grid { grid-template-columns: 1fr; }
                }

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
                    width: 100%;
                }
                .model-row:hover { border-color: var(--border-strong); }
                .model-row-active { border-color: var(--accent-warm); background: var(--accent-warm-muted); }
                .model-row-left { display: flex; align-items: center; gap: 12px; }
                .model-radio { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border-strong); }
                .model-name { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }
            `}</style>
        </div>
    );
}
