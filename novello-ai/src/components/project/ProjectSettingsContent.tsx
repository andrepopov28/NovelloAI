'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Settings,
    RefreshCw,
    Check,
    Loader2,
    Server,
    Sparkles,
    ArrowLeft,
    Wifi,
    WifiOff
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useProjects } from '@/lib/hooks/useProjects';

interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
}

export function ProjectSettingsContent({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { projects, updateProject, loading: loadingProjects } = useProjects();
    const project = projects.find((p) => p.id === projectId);

    const [localSettings, setLocalSettings] = useState({
        aiProvider: 'ollama',
        modelName: '',
    });

    const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
    const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
    const [scanningOllama, setScanningOllama] = useState(false);

    useEffect(() => {
        if (project?.settings) {
            setLocalSettings({
                aiProvider: 'ollama',
                modelName: project.settings.modelName || '',
            });
        }
    }, [project]);

    const scanOllama = useCallback(async () => {
        setScanningOllama(true);
        setOllamaStatus('checking');
        try {
            const healthRes = await fetch('/api/ai/health');
            const healthData = await healthRes.json();

            if (healthData.ollama) {
                setOllamaStatus('connected');
                try {
                    const modelsRes = await fetch('http://127.0.0.1:11434/api/tags');
                    const modelsData = await modelsRes.json();
                    setOllamaModels(modelsData.models || []);
                } catch {
                    setOllamaModels([]);
                }
            } else {
                setOllamaStatus('offline');
            }
        } catch {
            setOllamaStatus('offline');
        } finally {
            setScanningOllama(false);
        }
    }, []);

    useEffect(() => {
        scanOllama();
    }, [scanOllama]);

    const handleSave = async (updates: any) => {
        const next = { ...localSettings, ...updates };
        setLocalSettings(next);
        try {
            await updateProject(projectId, {
                settings: next
            });
            toast.success('Project settings updated');
        } catch (err) {
            toast.error('Failed to save settings');
            console.error(err);
        }
    };

    const formatSize = (bytes: number) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    };

    if (loadingProjects) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-accent" />
            </div>
        );
    }

    if (!project) return <div>Project not found</div>;

    return (
        <div className="settings-root">
            <div className="settings-container">
                <div className="settings-header">
                    <button onClick={() => router.push(`/project/${projectId}`)} className="back-btn">
                        <ArrowLeft size={16} />
                    </button>
                    <div className="header-icon">
                        <Settings size={22} />
                    </div>
                    <div>
                        <h1 className="settings-title">Project AI Settings</h1>
                        <p className="settings-subtitle">Configure dedicated LLM for "{project.title}"</p>
                    </div>
                </div>

                {localSettings.aiProvider === 'ollama' && (
                    <Card className="settings-section">
                        <div className="section-head">
                            <div className="section-head-left">
                                <Server size={18} />
                                <div>
                                    <h2 className="section-name">Local LLM — Ollama</h2>
                                    <p className="section-desc">Choose a model running on your machine.</p>
                                </div>
                            </div>
                            <div className="status-badge-wrap">
                                {ollamaStatus === 'checking' && (
                                    <span className="status-badge status-checking"><Loader2 size={12} className="animate-spin" /> Scanning...</span>
                                )}
                                {ollamaStatus === 'connected' && (
                                    <span className="status-badge status-online"><Wifi size={12} /> Connected</span>
                                )}
                                {ollamaStatus === 'offline' && (
                                    <span className="status-badge status-offline"><WifiOff size={12} /> Offline</span>
                                )}
                            </div>
                        </div>

                        <div className="section-body">
                            <Button onClick={scanOllama} disabled={scanningOllama} className="scan-btn">
                                {scanningOllama ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                Scan Models
                            </Button>

                            <div className="model-list">
                                <span className="model-list-label">Available Models</span>
                                {ollamaModels.map((m) => (
                                    <button
                                        key={m.name}
                                        className={`model-row ${localSettings.modelName === m.name ? 'model-row-active' : ''}`}
                                        onClick={() => handleSave({ modelName: m.name })}
                                    >
                                        <div className="model-row-left">
                                            {localSettings.modelName === m.name ? <Check size={14} className="model-check" /> : <div className="model-radio" />}
                                            <span className="model-name">{m.name}</span>
                                        </div>
                                        <span className="model-size">{formatSize(m.size)}</span>
                                    </button>
                                ))}
                                {ollamaModels.length === 0 && ollamaStatus === 'connected' && (
                                    <p className="text-xs text-secondary p-4 bg-surface-tertiary rounded">No models found in Ollama.</p>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {project.styleProfile && (
                    <Card className="settings-section">
                        <div className="section-head">
                            <div className="section-head-left">
                                <Sparkles size={18} />
                                <div>
                                    <h2 className="section-name">Style Profile</h2>
                                    <p className="section-desc">AI-generated analysis of your writing voice. Used to guide text generation.</p>
                                </div>
                            </div>
                        </div>
                        <div className="section-body">
                            <div className="style-grid">
                                <div className="style-item">
                                    <span className="style-label">Avg Sentence Length</span>
                                    <span className="style-value">{project.styleProfile.avgSentenceLength} words</span>
                                </div>
                                <div className="style-item">
                                    <span className="style-label">Vocabulary Level</span>
                                    <span className="style-value capitalize">{project.styleProfile.vocabularyLevel}</span>
                                </div>
                                <div className="style-item">
                                    <span className="style-label">Point of View</span>
                                    <span className="style-value">{project.styleProfile.povConsistency}</span>
                                </div>
                                <div className="style-item">
                                    <span className="style-label">Tense</span>
                                    <span className="style-value">{project.styleProfile.tenseUsage}</span>
                                </div>
                                <div className="style-item">
                                    <span className="style-label">Dialogue Ratio</span>
                                    <span className="style-value">{Math.round(project.styleProfile.dialogueRatio * 100)}%</span>
                                </div>
                            </div>
                            <p className="text-xs text-secondary mt-2">
                                Novello analyzes your chapters as you write to update this profile.
                            </p>
                        </div>
                    </Card>
                )}
            </div>

            <style jsx>{`
                .settings-root {
                    min-height: calc(100vh - var(--nav-height));
                    background: var(--surface-primary);
                    padding: 32px 24px 80px;
                }
                .settings-container {
                    max-width: 640px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .settings-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }
                .back-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .header-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: var(--radius-md);
                    background: var(--accent-warm-muted);
                    color: var(--accent-warm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .settings-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .settings-subtitle {
                    font-size: 0.8rem;
                    color: var(--text-tertiary);
                }
                .settings-section {
                    padding: 0 !important;
                    overflow: hidden;
                }
                .section-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border);
                }
                .section-head-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .section-name {
                    font-size: 0.9rem;
                    font-weight: 700;
                }
                .section-desc {
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                }
                .section-body {
                    padding: 16px 20px 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border-radius: var(--radius-full);
                    font-size: 0.65rem;
                    font-weight: 600;
                }
                .status-online { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-offline { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .status-checking { background: rgba(234, 179, 8, 0.1); color: #eab308; }
                .model-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .model-list-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                .model-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    cursor: pointer;
                }
                .model-row-active {
                    border-color: var(--accent-warm);
                    background: var(--accent-warm-muted);
                }
                .model-row-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .model-name { font-size: 0.8rem; font-weight: 600; }
                .model-size { font-size: 0.7rem; color: var(--text-tertiary); }
                .style-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 16px;
                }
                .style-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: var(--surface-tertiary);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                }
                .style-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                    font-weight: 600;
                }
                .style-value {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .capitalize { text-transform: capitalize; }
            `}</style>
        </div>
    );
}
