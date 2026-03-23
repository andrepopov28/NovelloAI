import React, { useState } from 'react';
import { UnifiedVoice } from '@/lib/hooks/useVoices';
import { X, Play, Loader2, Sparkles, AlertTriangle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceDetailDrawerProps {
    voice: UnifiedVoice | null;
    onClose: () => void;
    userId: string | undefined;
}

export function VoiceDetailDrawer({ voice, onClose, userId }: VoiceDetailDrawerProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewText, setPreviewText] = useState('This is a preview of my voice. I hope you enjoy listening to this audiobook flow.');
    const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);

    // Editable fields for Cloned Voices
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');

    React.useEffect(() => {
        if (voice && !voice.isBuiltin) {
            setDisplayName(voice.displayName);
            setDescription(voice.description || '');
        }
    }, [voice]);

    if (!voice) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleSave = async () => {
        if (voice.isBuiltin) return;
        setIsSaving(true);
        try {
            const token = userId || 'local';
            const res = await fetch(`/api/ai/voices/cloned/${voice.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ displayName, description })
            });
            if (!res.ok) throw new Error('Failed to update voice');
            toast.success('Voice details updated');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (voice.isBuiltin) return;
        const confirmDelete = window.confirm("Are you sure you want to delete this voice? This cannot be undone.");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const token = userId || 'local';
            const res = await fetch(`/api/ai/voices/cloned/${voice.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete voice');
            toast.success('Voice deleted');
            onClose();
        } catch (err: any) {
            toast.error(err.message);
            setIsDeleting(false);
        }
    };

    const handleAvatarAction = async (action: 'regenerate' | 'upload', file?: File) => {
        if (voice.isBuiltin) return;
        setIsSaving(true);
        try {
            const token = userId || 'local';
            const formData = new FormData();
            formData.append('action', action);
            if (file) formData.append('image', file);

            const res = await fetch(`/api/ai/voices/cloned/${voice.id}/avatar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (!res.ok) throw new Error(`Failed to ${action} avatar`);
            toast.success(`Avatar ${action === 'upload' ? 'uploaded' : 'regenerated'} successfully!`);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePreviewPlay = async () => {
        if (isPreviewing) return;
        setIsPreviewing(true);
        try {
            const token = userId || 'local';
            const res = await fetch('/api/ai/voices/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text: previewText, engineVoiceId: voice.engineVoiceId || 'en_US-lessac-high' })
            });

            if (!res.ok) throw new Error('Preview fetch failed');
            const { url } = await res.json();

            const audio = new Audio(url);
            audio.onended = () => setIsPreviewing(false);
            audio.play();
            setPreviewAudio(audio);
        } catch (err) {
            console.error('Failed to play preview:', err);
            setIsPreviewing(false);
        }
    };

    return (
        <div className="vl-drawer-backdrop" onClick={handleBackdropClick}>
            <div className="vl-drawer glass-strong animate-slide-up-modal">
                <button className="vl-drawer-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="vl-drawer-scrollview">
                    {/* Header Splash */}
                    <div className="vl-drawer-header">
                        <div className="vl-drawer-avatar">
                            {voice.avatar?.url ? (
                                <img src={voice.avatar.url} alt="Avatar" />
                            ) : (
                                <div className="vl-avatar-placeholder">
                                    <Sparkles size={32} />
                                </div>
                            )}

                            {!voice.isBuiltin && (
                                <div className="vl-avatar-actions">
                                    <button
                                        className="vl-avatar-btn"
                                        onClick={() => handleAvatarAction('regenerate')}
                                        disabled={isSaving}
                                        title="AI Regenerate Style"
                                    >
                                        <Sparkles size={14} />
                                    </button>
                                    <label className="vl-avatar-btn" title="Upload Replacement">
                                        <ImageIcon size={14} />
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleAvatarAction('upload', e.target.files[0]);
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="vl-drawer-title-block">
                            {voice.isBuiltin ? (
                                <>
                                    <h2 className="vl-drawer-name">{voice.displayName}</h2>
                                    <span className="vl-badge-global">Built-in Neural Voice</span>
                                </>
                            ) : (
                                <input
                                    className="vl-inline-edit-name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Voice Name"
                                />
                            )}
                        </div>
                    </div>

                    <div className="vl-drawer-body">
                        {/* Meta Grid */}
                        <div className="vl-meta-grid">
                            <div className="vl-meta-item">
                                <label>Language</label>
                                <span>{voice.language || 'en-US'}</span>
                            </div>
                            <div className="vl-meta-item">
                                <label>Gender</label>
                                <span>{voice.gender || 'Neutral'}</span>
                            </div>
                            <div className="vl-meta-item">
                                <label>Accent</label>
                                <span>{voice.accent || 'Standard'}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="vl-section">
                            <label className="vl-section-label">Description</label>
                            {voice.isBuiltin ? (
                                <p className="vl-desc-text">{voice.description || 'No description provided.'}</p>
                            ) : (
                                <textarea
                                    className="vl-textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add a description for this voice clone..."
                                    rows={3}
                                />
                            )}
                        </div>

                        {/* Preview Lab */}
                        <div className="vl-section vl-lab">
                            <label className="vl-section-label">Testing Lab</label>
                            <textarea
                                className="vl-textarea"
                                value={previewText}
                                onChange={(e) => setPreviewText(e.target.value)}
                                rows={2}
                            />
                            <button
                                className="vl-action-btn vl-play-btn"
                                onClick={handlePreviewPlay}
                                disabled={isPreviewing}
                            >
                                {isPreviewing ? <Loader2 size={16} className="ab-spin" /> : <Play size={16} />}
                                {isPreviewing ? 'Generating audio...' : 'Generate & Play Preview'}
                            </button>
                        </div>

                        {/* Actions */}
                        {!voice.isBuiltin && (
                            <div className="vl-drawer-footer">
                                <button className="vl-action-btn vl-danger-btn" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 size={16} className="ab-spin" /> : <Trash2 size={16} />} Delete Clone
                                </button>
                                <button className="vl-action-btn vl-save-btn" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 size={16} className="ab-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .vl-drawer-backdrop {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
                    z-index: 50; display: flex; justify-content: flex-end;
                }
                .vl-drawer {
                    width: 100%; max-width: 450px; height: 100%;
                    background: var(--bg-main); border-left: 1px solid var(--border);
                    position: relative; display: flex; flex-direction: column;
                }
                .animate-slide-up-modal {
                    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .vl-drawer-scrollview {
                    flex: 1; overflow-y: auto; padding-bottom: 2rem;
                }
                .vl-drawer-close {
                    position: absolute; top: 16px; right: 16px; z-index: 10;
                    width: 36px; height: 36px; border-radius: 50%;
                    background: var(--surface-secondary); border: 1px solid var(--border);
                    color: var(--text-secondary); display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .vl-drawer-close:hover { background: var(--surface-elevated); color: var(--text-primary); }

                /* Header Area */
                .vl-drawer-header {
                    padding: 3rem 2rem 2rem; border-bottom: 1px solid var(--border);
                    background: linear-gradient(to bottom, var(--surface-primary), var(--surface-secondary));
                    display: flex; flex-direction: column; align-items: center; text-align: center;
                }
                .vl-drawer-avatar {
                    width: 120px; height: 120px; border-radius: 50%;
                    background: var(--surface-tertiary); margin-bottom: 1.5rem;
                    position: relative; box-shadow: 0 12px 24px rgba(0,0,0,0.15);
                    border: 2px solid var(--border-strong);
                }
                .vl-drawer-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
                .vl-avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); }
                
                .vl-avatar-actions {
                    position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%);
                    display: flex; gap: 6px; background: var(--surface-elevated);
                    padding: 4px; border-radius: var(--radius-full); border: 1px solid var(--border);
                    box-shadow: var(--shadow-sm);
                }
                .vl-avatar-btn {
                    width: 28px; height: 28px; border-radius: 50%;
                    background: var(--surface-secondary); border: none;
                    color: var(--text-primary); display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                }
                .vl-avatar-btn:hover { background: var(--accent); color: white; }

                .vl-drawer-title-block { width: 100%; }
                .vl-drawer-name { font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
                .vl-inline-edit-name {
                    font-size: 1.5rem; font-weight: 700; color: var(--text-primary);
                    background: transparent; border: 1px dashed transparent;
                    text-align: center; width: 100%; padding: 4px;
                    border-radius: var(--radius-sm); transition: all 0.2s;
                }
                .vl-inline-edit-name:hover, .vl-inline-edit-name:focus {
                    border-color: var(--accent); background: var(--surface-primary); outline: none;
                }
                .vl-badge-global {
                    display: inline-block; padding: 4px 10px; border-radius: var(--radius-full);
                    background: var(--surface-tertiary); color: var(--text-primary);
                    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em; border: 1px solid var(--border);
                }

                /* Body Area */
                .vl-drawer-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
                
                .vl-meta-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
                    background: var(--surface-primary); padding: 16px;
                    border-radius: var(--radius-lg); border: 1px solid var(--border);
                }
                .vl-meta-item { display: flex; flex-direction: column; gap: 4px; text-align: center; }
                .vl-meta-item label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
                .vl-meta-item span { font-size: 0.9rem; color: var(--text-primary); font-weight: 500; }

                .vl-section { display: flex; flex-direction: column; gap: 8px; }
                .vl-section-label { font-size: 0.85rem; font-weight: 600; color: var(--text-primary); }
                .vl-desc-text { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin: 0; }
                
                .vl-textarea {
                    width: 100%; padding: 12px; border-radius: var(--radius-md);
                    border: 1px solid var(--border); background: var(--surface-primary);
                    color: var(--text-primary); font-size: 0.9rem; line-height: 1.5;
                    resize: vertical; min-height: 60px;
                }
                .vl-textarea:focus { border-color: var(--accent); outline: none; }

                .vl-lab {
                    background: linear-gradient(145deg, var(--surface-secondary), var(--surface-primary));
                    padding: 16px; border-radius: var(--radius-lg); border: 1px solid var(--border-strong);
                }
                
                .vl-action-btn {
                    padding: 12px 16px; border-radius: var(--radius-md);
                    font-size: 0.9rem; font-weight: 600; display: inline-flex;
                    align-items: center; justify-content: center; gap: 8px;
                    cursor: pointer; transition: all 0.2s; border: none;
                }
                .vl-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                
                .vl-play-btn {
                    background: var(--surface-elevated); color: var(--text-primary); border: 1px solid var(--border); width: 100%;
                }
                .vl-play-btn:hover:not(:disabled) { background: var(--surface-tertiary); border-color: var(--text-tertiary); }
                
                .vl-drawer-footer { display: flex; gap: 12px; margin-top: 1rem; }
                .vl-save-btn { background: var(--accent); color: white; flex: 2; }
                .vl-save-btn:hover:not(:disabled) { background: var(--accent-hover); }
                
                .vl-danger-btn { background: rgba(239, 68, 68, 0.1); color: #ef4444; flex: 1; border: 1px solid rgba(239,68,68,0.2); }
                .vl-danger-btn:hover:not(:disabled) { background: rgba(239, 68, 68, 0.2); }
            `}</style>
        </div>
    );
}
