import React, { useState } from 'react';
import { UnifiedVoice } from '@/lib/hooks/useVoices';
import { Play, Pause, MoreVertical, Sparkles, User, Loader2 } from 'lucide-react';

interface VoiceGridProps {
    voices: UnifiedVoice[];
    onVoiceSelect: (voice: UnifiedVoice) => void;
    userId: string | undefined;
}

export function VoiceGrid({ voices, onVoiceSelect, userId }: VoiceGridProps) {
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
    const [previewLoading, setPreviewLoading] = useState<string | null>(null);

    const handlePreview = async (e: React.MouseEvent, voice: UnifiedVoice) => {
        e.stopPropagation();

        if (previewingId === voice.id && previewAudio) {
            previewAudio.pause();
            setPreviewAudio(null);
            setPreviewingId(null);
            return;
        }

        if (previewAudio) {
            previewAudio.pause();
            setPreviewAudio(null);
        }

        try {
            setPreviewLoading(voice.id);
            const token = userId || 'local';
            const res = await fetch('/api/ai/voices/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: `This is a preview of the voice ${voice.displayName}. I hope it sounds exactly like you imagined.`,
                    engineVoiceId: voice.engineVoiceId || 'en_US-lessac-high' // Fallback
                })
            });

            if (!res.ok) throw new Error('Preview fetch failed');
            const { url } = await res.json();

            const audio = new Audio(url);
            audio.onended = () => {
                setPreviewingId(null);
                setPreviewAudio(null);
            };
            audio.play();

            setPreviewAudio(audio);
            setPreviewingId(voice.id);
        } catch (err) {
            console.error('Failed to play preview:', err);
        } finally {
            setPreviewLoading(null);
        }
    };

    return (
        <div className="vl-grid">
            {voices.map(voice => {
                const isTraining = !voice.isBuiltin && 'status' in voice && voice.status === 'training';
                const isPreviewing = previewingId === voice.id;
                const isLoadingPreview = previewLoading === voice.id;
                const avatarUrl = voice.avatar?.url;

                return (
                    <div
                        key={voice.id}
                        className={`vl-card glass-panel ${isTraining ? 'training' : ''}`}
                        onClick={() => !isTraining && onVoiceSelect(voice)}
                    >
                        <div className="vl-card-header">
                            <div className="vl-avatar-wrap">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={voice.displayName} className="vl-avatar-img" />
                                ) : (
                                    <div className="vl-avatar-fallback">
                                        {voice.isBuiltin ? <User size={20} /> : <Sparkles size={20} />}
                                    </div>
                                )}
                            </div>
                            <div className="vl-info">
                                <h3 className="vl-name">{voice.displayName}</h3>
                                <div className="vl-meta">
                                    <span className="vl-badge vl-type-badge">
                                        {voice.isBuiltin ? 'Built-in' : 'Cloned'}
                                    </span>
                                    {voice.language && (
                                        <span className="vl-badge">{voice.language.split('-')[0].toUpperCase()}</span>
                                    )}
                                    {voice.accent && (
                                        <span className="vl-badge">{voice.accent}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status / Quick Actions */}
                        <div className="vl-footer">
                            {isTraining ? (
                                <div className="vl-training-status">
                                    <Loader2 size={14} className="ab-spin" /> Training Model...
                                </div>
                            ) : (
                                <div className="vl-actions">
                                    <button
                                        className={`vl-preview-btn ${isPreviewing ? 'active' : ''}`}
                                        onClick={(e) => handlePreview(e, voice)}
                                        disabled={isLoadingPreview}
                                    >
                                        {isLoadingPreview ? (
                                            <Loader2 size={14} className="ab-spin" />
                                        ) : isPreviewing ? (
                                            <Pause size={14} />
                                        ) : (
                                            <Play size={14} />
                                        )}
                                        Preview
                                    </button>
                                    <button className="vl-more-btn" onClick={(e) => { e.stopPropagation(); onVoiceSelect(voice); }}>
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {voices.length === 0 && (
                <div className="vl-empty">
                    <p>No voices found matching your criteria.</p>
                </div>
            )}

            <style jsx>{`
                .vl-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
                    gap: 16px;
                }
                .vl-card {
                    padding: 16px; border-radius: var(--radius-lg);
                    border: 1px solid var(--border); background: var(--surface-secondary);
                    transition: all 0.2s ease; cursor: pointer; display: flex; flex-direction: column;
                }
                .vl-card:hover:not(.training) {
                    transform: translateY(-2px); border-color: var(--border-strong);
                    background: var(--surface-tertiary);
                    box-shadow: var(--shadow-md);
                }
                .vl-card.training {
                    border-color: var(--accent); opacity: 0.8; cursor: default;
                }
                .vl-card-header {
                    display: flex; gap: 14px; margin-bottom: 16px;
                }
                .vl-avatar-wrap {
                    width: 48px; height: 48px; border-radius: 50%;
                    background: var(--surface-tertiary); overflow: hidden;
                    flex-shrink: 0; border: 1px solid var(--border-strong);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .vl-avatar-img {
                    width: 100%; height: 100%; object-fit: cover;
                }
                .vl-avatar-fallback {
                    width: 100%; height: 100%; display: flex; align-items: center;
                    justify-content: center; color: var(--text-secondary);
                }
                .vl-info {
                    flex: 1; display: flex; flex-direction: column; justify-content: center;
                }
                .vl-name {
                    font-size: 1.05rem; font-weight: 600; margin: 0 0 6px; color: var(--text-primary);
                }
                .vl-meta {
                    display: flex; gap: 6px; flex-wrap: wrap;
                }
                .vl-badge {
                    font-size: 0.65rem; padding: 2px 6px; border-radius: 4px;
                    background: var(--surface-tertiary); color: var(--text-tertiary);
                    font-weight: 500; border: 1px solid var(--border);
                }
                .vl-type-badge {
                    background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16,185,129,0.2);
                }
                
                .vl-footer { margin-top: auto; }
                .vl-actions {
                    display: flex; gap: 8px;
                }
                .vl-preview-btn {
                    flex: 1; height: 32px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-primary);
                    color: var(--text-primary); font-size: 0.8rem; font-weight: 500;
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    cursor: pointer; transition: all 0.2s;
                }
                .vl-preview-btn:hover:not(:disabled) {
                    background: var(--surface-elevated); border-color: var(--border-strong);
                }
                .vl-preview-btn.active {
                    background: var(--accent-muted); color: var(--accent); border-color: var(--accent);
                }
                .vl-preview-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                
                .vl-more-btn {
                    width: 32px; height: 32px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-primary);
                    color: var(--text-secondary); display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .vl-more-btn:hover {
                    background: var(--surface-elevated); color: var(--text-primary);
                }

                .vl-training-status {
                    display: flex; align-items: center; gap: 8px; font-size: 0.85rem;
                    color: var(--accent); font-weight: 500; background: var(--accent-muted);
                    padding: 8px 12px; border-radius: var(--radius-md); justify-content: center;
                }
                .vl-empty {
                    grid-column: 1 / -1; padding: 4rem; text-align: center; color: var(--text-tertiary);
                    background: var(--surface-secondary); border-radius: var(--radius-xl);
                    border: 1px dashed var(--border-strong);
                }
            `}</style>
        </div>
    );
}
