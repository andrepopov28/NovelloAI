'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePersonas } from '@/lib/hooks/usePersonas';
import { useVoices } from '@/lib/hooks/useVoices';
import { useAuth } from '@/lib/hooks/useAuth';
import { Loader2, Save, Sparkles, BookOpen, Lightbulb, Headphones, Send, Cpu } from 'lucide-react';
import { toast } from 'sonner';

const PERSONA_ICONS: Record<string, any> = {
    write: BookOpen,
    brainstorm: Lightbulb,
    codex: Sparkles,
    audiobook: Headphones,
    publish: Send,
};

const PROVIDERS = [
    { id: 'ollama', label: 'Local (Ollama)' }
];

export function AITeamSettingsContent() {
    const { user } = useAuth();
    const { personas, loading: loadingPersonas, updatePersona } = usePersonas();
    const { allVoices: voices, loading: loadingVoices } = useVoices(user?.uid);
    const [selectedId, setSelectedId] = useState<string>('write');
    const [saving, setSaving] = useState(false);

    if (loadingPersonas || loadingVoices) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-[var(--accent-warm)] w-8 h-8" />
            </div>
        );
    }

    const team = personas.filter(p => p.id !== 'default');
    const selectedPersona = team.find(p => p.id === selectedId);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPersona) return;

        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const provider = (form.elements.namedItem('provider') as HTMLSelectElement).value;
        const model = (form.elements.namedItem('model') as HTMLInputElement).value;
        const voiceId = (form.elements.namedItem('voiceId') as HTMLSelectElement).value;
        const personality = (form.elements.namedItem('personality') as HTMLTextAreaElement).value;

        try {
            setSaving(true);
            await updatePersona(selectedId, {
                name,
                provider,
                model,
                voiceId: voiceId || null,
                personality
            });
            toast.success(`${name} updated successfully`);
        } catch (error) {
            toast.error('Failed to update persona');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ai-team-content">
            <header className="content-header">
                <h2 className="content-title">Agentic AI Creative Team</h2>
                <p className="content-subtitle">Customize your co-pilots' personalities, voices, and LLM backends.</p>
            </header>

            <div className="team-layout">
                {/* Left Sidebar - List of Agents */}
                <div className="team-sidebar">
                    {team.map(persona => {
                        const Icon = PERSONA_ICONS[persona.id] || Cpu;
                        const isSelected = selectedId === persona.id;
                        return (
                            <button
                                key={persona.id}
                                className={`team-member-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => setSelectedId(persona.id)}
                            >
                                <div className="icon-wrap">
                                    <Icon size={18} />
                                </div>
                                <div className="member-info">
                                    <span className="member-name">{persona.name}</span>
                                    <span className="member-role capitalize">{persona.id} Node</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Right Editor - Selected Agent Details */}
                <div className="team-editor">
                    {selectedPersona ? (
                        <Card className="editor-card">
                            <div className="editor-header">
                                <h3>{selectedPersona.name} Settings</h3>
                            </div>

                            <form onSubmit={handleSave} className="editor-form">
                                <div className="form-group row-group">
                                    <div className="input-wrap">
                                        <label>Agent Name</label>
                                        <Input
                                            name="name"
                                            defaultValue={selectedPersona.name}
                                            required
                                        />
                                    </div>
                                    <div className="input-wrap">
                                        <label>Node Assignment</label>
                                        <Input
                                            value={`/${selectedPersona.id}`}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="form-group row-group">
                                    <div className="input-wrap">
                                        <label>LLM Provider</label>
                                        <select
                                            name="provider"
                                            defaultValue={selectedPersona.provider}
                                            className="custom-select"
                                        >
                                            {PROVIDERS.map(p => (
                                                <option key={p.id} value={p.id}>{p.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-wrap">
                                        <label>LLM Model</label>
                                        <Input
                                            name="model"
                                            defaultValue={selectedPersona.model}
                                            placeholder="e.g. llama3, gemini-2.0-flash"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>TTS Voice (Optional)</label>
                                    <select
                                        name="voiceId"
                                        defaultValue={selectedPersona.voiceId || ''}
                                        className="custom-select"
                                    >
                                        <option value="">-- No custom voice --</option>
                                        {voices.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.displayName} {v.type === 'cloned' ? '(Cloned)' : '(Built-in)'} - {v.language}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="field-hint">Used for Live Voice Conversations in the Chatbox.</p>
                                </div>

                                <div className="form-group">
                                    <label>Personality (System Prompt)</label>
                                    <textarea
                                        name="personality"
                                        defaultValue={selectedPersona.personality}
                                        className="custom-textarea"
                                        rows={6}
                                        required
                                    />
                                    <p className="field-hint">Dictates how the agent behaves, its tone of voice, and its primary objective.</p>
                                </div>

                                <div className="form-actions">
                                    <Button type="submit" disabled={saving}>
                                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    ) : (
                        <div className="empty-state">Select an agent to configure</div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .ai-team-content {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                    height: 100%;
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
                    font-size: 0.9rem;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }

                .team-layout {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 24px;
                    align-items: start;
                }

                /* Sidebar */
                .team-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .team-member-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    border-radius: var(--radius-md);
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s;
                }
                .team-member-btn:hover {
                    border-color: var(--border-strong);
                    background: var(--surface-elevated);
                }
                .team-member-btn.selected {
                    border-color: var(--accent-warm);
                    background: var(--accent-warm-muted);
                }
                .icon-wrap {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: var(--surface-primary);
                    color: var(--text-secondary);
                    border: 1px solid var(--border);
                }
                .team-member-btn.selected .icon-wrap {
                    color: var(--accent-warm);
                    border-color: var(--accent-warm);
                }
                .member-info {
                    display: flex;
                    flex-direction: column;
                }
                .member-name {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .member-role {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }

                /* Editor */
                .team-editor {
                    min-height: 500px;
                }
                .editor-card {
                    padding: 24px !important;
                }
                .editor-header {
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border);
                }
                .editor-header h3 {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }

                .editor-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .row-group {
                    flex-direction: row;
                    gap: 16px;
                }
                .input-wrap {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .field-hint {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    margin: 0;
                }
                
                .custom-select, .custom-textarea {
                    width: 100%;
                    padding: 10px 12px;
                    background: var(--surface-tertiary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: 0.9rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .custom-select:focus, .custom-textarea:focus {
                    border-color: var(--accent-blue);
                }
                .custom-textarea {
                    resize: vertical;
                    font-family: inherit;
                    line-height: 1.5;
                }

                .form-actions {
                    margin-top: 10px;
                    display: flex;
                    justify-content: flex-end;
                }
                
                .empty-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-tertiary);
                    font-size: 0.9rem;
                }

                @media (max-width: 768px) {
                    .team-layout {
                        grid-template-columns: 1fr;
                    }
                    .row-group {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
