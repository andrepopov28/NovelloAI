
import { useState } from 'react';
import {
    Play,
    Pause,
    CheckCircle2,
    Download,
    Star,
    Sparkles,
    User,
    Volume2
} from 'lucide-react';
import type { PiperVoice } from '@/lib/voices-config';

interface VoiceLibraryProps {
    availableVoices: PiperVoice[];
    installedVoiceIds: string[];
    onInstall: (voiceId: string) => void;
    onPreview: (voice: PiperVoice) => void;
    previewingVoiceId: string | null;
    isPlayingPreview: boolean;
}

export function VoiceLibrary({
    availableVoices,
    installedVoiceIds,
    onInstall,
    onPreview,
    previewingVoiceId,
    isPlayingPreview
}: VoiceLibraryProps) {
    const [filter, setFilter] = useState<'All' | 'Male' | 'Female'>('All');

    const filteredVoices = availableVoices.filter(v => {
        if (filter === 'All') return true;
        return v.gender === filter;
    });

    return (
        <div className="voice-library">
            {/* Header / Filter */}
            <div className="vl-header">
                <div>
                    <h2 className="vl-title">Neural Voice Library</h2>
                    <p className="vl-subtitle">
                        Browse and install premium AI voices for your audiobook.
                    </p>
                </div>
                <div className="vl-filters">
                    {(['All', 'Male', 'Female'] as const).map(f => (
                        <button
                            key={f}
                            className={`vl-filter-btn ${filter === f ? 'vl-filter-active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="vl-grid">
                {filteredVoices.map(voice => {
                    const isInstalled = installedVoiceIds.includes(voice.id);
                    const isPreviewing = previewingVoiceId === voice.id;

                    return (
                        <div key={voice.id} className="vl-card glass-panel">
                            {/* Card Header */}
                            <div className="vl-card-header">
                                <div className="vl-avatar">
                                    {voice.gender === 'Female' ? <User size={20} /> : <User size={20} />}
                                </div>
                                <div className="vl-info">
                                    <h3 className="vl-name">{voice.name}</h3>
                                    <div className="vl-meta">
                                        <span className="vl-badge">{voice.accent}</span>
                                        {voice.quality === 'High' && (
                                            <span className="vl-badge vl-badge-premium">
                                                <Sparkles size={8} /> Premium
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="vl-desc">{voice.description}</p>

                            {/* Actions */}
                            <div className="vl-actions">
                                <button
                                    className={`vl-preview-btn ${isPreviewing && isPlayingPreview ? 'vl-preview-active' : ''}`}
                                    onClick={() => onPreview(voice)}
                                >
                                    {isPreviewing && isPlayingPreview ? <Pause size={14} /> : <Play size={14} />}
                                    Preview
                                </button>

                                {isInstalled ? (
                                    <button className="vl-install-btn vl-installed" disabled>
                                        <CheckCircle2 size={14} />
                                        Installed
                                    </button>
                                ) : (
                                    <button
                                        className="vl-install-btn"
                                        onClick={() => onInstall(voice.id)}
                                    >
                                        <Download size={14} />
                                        Download
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                .voice-library {
                    animation: fade-in 0.3s ease;
                }
                .vl-header {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                }
                .vl-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0 0 4px;
                }
                .vl-subtitle {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                }
                .vl-filters {
                    display: flex;
                    gap: 8px;
                    background: var(--surface-secondary);
                    padding: 4px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                }
                .vl-filter-btn {
                    padding: 4px 12px;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    background: transparent;
                    border: none;
                }
                .vl-filter-active {
                    background: var(--surface-elevated);
                    color: var(--text-primary);
                    box-shadow: var(--shadow-sm);
                }

                .vl-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }

                .vl-card {
                    padding: 16px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary); /* Base background */
                    transition: transform var(--transition-fast), border-color var(--transition-fast);
                }
                .vl-card:hover {
                    transform: translateY(-2px);
                    border-color: var(--border-strong);
                    background: var(--surface-tertiary); /* Slightly lighter on hover */
                }

                .vl-card-header {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                .vl-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--surface-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-secondary);
                }
                .vl-info {
                    flex: 1;
                }
                .vl-name {
                    font-size: 0.95rem;
                    font-weight: 600;
                    margin: 0 0 4px;
                    color: var(--text-primary);
                }
                .vl-meta {
                    display: flex;
                    gap: 6px;
                }
                .vl-badge {
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: var(--surface-tertiary);
                    color: var(--text-tertiary);
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                }
                .vl-badge-premium {
                    background: rgba(245, 158, 11, 0.1);
                    color: #d97706;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }

                .vl-desc {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin: 0 0 16px;
                    line-height: 1.4;
                    min-height: 2.8em; /* 2 lines */
                }

                .vl-actions {
                    display: flex;
                    gap: 8px;
                }
                .vl-preview-btn {
                    flex: 1;
                    height: 32px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: transparent;
                    color: var(--text-primary);
                    font-size: 0.8rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: background var(--transition-fast);
                }
                .vl-preview-btn:hover {
                    background: var(--surface-tertiary);
                }
                .vl-preview-active {
                    background: var(--surface-tertiary);
                    color: var(--accent);
                    border-color: var(--accent);
                }

                .vl-install-btn {
                    flex: 1;
                    height: 32px;
                    border-radius: var(--radius-md);
                    border: 1px solid transparent;
                    background: var(--accent);
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: background var(--transition-fast);
                }
                .vl-install-btn:hover {
                    background: var(--accent-hover);
                }
                .vl-installed {
                    background: var(--surface-tertiary);
                    color: var(--text-tertiary);
                    border: 1px solid var(--border);
                    cursor: default;
                }
                .vl-installed:hover {
                    background: var(--surface-tertiary);
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
