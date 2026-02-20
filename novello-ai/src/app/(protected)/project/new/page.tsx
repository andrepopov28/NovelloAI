'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    BookOpen,
    User,
    Tag,
    Target,
    Plus,
    Loader2,
} from 'lucide-react';
import { useProjects } from '@/lib/hooks/useProjects';
import { toast } from 'sonner';

function Field({ label, icon, hint, children }: {
    label: string;
    icon: React.ReactNode;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="new-field">
            <label className="new-field-label">
                <span className="new-field-icon">{icon}</span>
                {label}
            </label>
            {children}
            {hint && <span className="new-field-hint">{hint}</span>}
        </div>
    );
}

export default function NewProjectPage() {
    const router = useRouter();
    const { createProject } = useProjects();

    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [genre, setGenre] = useState('');
    const [targetWordCount, setTargetWordCount] = useState(80000);
    const [targetChapterCount, setTargetChapterCount] = useState(0);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!title.trim()) { toast.error('Title is required'); return; }
        setCreating(true);
        try {
            const id = await createProject({
                title: title.trim(),
                genre: genre.trim() || 'literary',
                synopsis: synopsis.trim(),
                targetWordCount,
                targetChapterCount,
            });
            toast.success('Project created!');
            router.push(`/project/${id}/setup`);
        } catch {
            toast.error('Failed to create project');
            setCreating(false);
        }
    };

    return (
        <>
            <div className="new-root">
                {/* Top bar */}
                <div className="new-topbar">
                    <button className="new-back-btn" onClick={() => router.back()}>
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <h1 className="new-page-title">New Project</h1>
                </div>

                <div className="new-card">
                    <div className="new-hero">
                        <div className="new-hero-icon">
                            <BookOpen size={28} />
                        </div>
                        <div>
                            <h2 className="new-hero-title">Start a New Book</h2>
                            <p className="new-hero-sub">Fill in the details below. You can always edit them later.</p>
                        </div>
                    </div>

                    <div className="new-form">
                        <Field label="Book Title *" icon={<BookOpen size={13} />}>
                            <input
                                className="new-input"
                                placeholder="My Novel"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                autoFocus
                            />
                        </Field>

                        <Field label="Author Name" icon={<User size={13} />}>
                            <input
                                className="new-input"
                                placeholder="Your name"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                            />
                        </Field>

                        <Field label="Genre" icon={<Tag size={13} />}>
                            <input
                                className="new-input"
                                placeholder="Literary fiction, thriller, fantasy…"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                            />
                        </Field>

                        <Field label="Synopsis" icon={<BookOpen size={13} />} hint="A one-sentence premise for your story.">
                            <textarea
                                className="new-input new-textarea"
                                placeholder="A young detective discovers…"
                                value={synopsis}
                                onChange={(e) => setSynopsis(e.target.value)}
                                rows={3}
                            />
                        </Field>

                        <div className="new-targets-row">
                            <Field label="Target Word Count" icon={<Target size={13} />} hint="Progress is tracked against this.">
                                <input
                                    className="new-input"
                                    type="number"
                                    min={1000}
                                    step={1000}
                                    value={targetWordCount}
                                    onChange={(e) => setTargetWordCount(Number(e.target.value) || 80000)}
                                />
                            </Field>
                            <Field label="Target Chapters" icon={<Target size={13} />} hint="Optional. Set to 0 to skip.">
                                <input
                                    className="new-input"
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={targetChapterCount}
                                    onChange={(e) => setTargetChapterCount(Number(e.target.value) || 0)}
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="new-footer">
                        <button className="new-btn new-btn-ghost" onClick={() => router.back()} disabled={creating}>
                            Cancel
                        </button>
                        <button
                            className="new-btn new-btn-primary"
                            onClick={handleCreate}
                            disabled={!title.trim() || creating}
                        >
                            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                            {creating ? 'Creating…' : 'Create Project'}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .new-root {
                    max-width: 640px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem 6rem;
                }

                /* ── Top bar ── */
                .new-topbar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 2rem;
                }
                .new-back-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 7px 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }
                .new-back-btn:hover {
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                }
                .new-page-title {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                /* ── Card ── */
                .new-card {
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                }

                /* ── Hero ── */
                .new-hero {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 24px 24px 20px;
                    border-bottom: 1px solid var(--border);
                    background: linear-gradient(135deg, var(--surface-tertiary) 0%, var(--surface-secondary) 100%);
                }
                .new-hero-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: var(--radius-lg);
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 4px 16px rgba(245,158,11,0.3);
                }
                .new-hero-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 4px;
                }
                .new-hero-sub {
                    font-size: 0.8rem;
                    color: var(--text-tertiary);
                    margin: 0;
                }

                /* ── Form ── */
                .new-form {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .new-targets-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .new-field { display: flex; flex-direction: column; gap: 5px; }
                .new-field-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .new-field-icon {
                    color: var(--text-tertiary);
                    display: flex;
                    align-items: center;
                }
                .new-field-hint {
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                }
                .new-input {
                    width: 100%;
                    padding: 9px 13px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-strong);
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    font-size: 0.85rem;
                    font-family: inherit;
                    outline: none;
                    transition: border-color 0.15s;
                    box-sizing: border-box;
                }
                .new-input:focus { border-color: var(--accent-warm); }
                .new-input::placeholder { color: var(--text-tertiary); }
                .new-textarea { resize: vertical; min-height: 72px; }

                /* ── Footer ── */
                .new-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    padding: 16px 24px;
                    border-top: 1px solid var(--border);
                    background: var(--surface-tertiary);
                }
                .new-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 9px 18px;
                    border-radius: var(--radius-md);
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    border: none;
                }
                .new-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .new-btn-ghost {
                    background: var(--surface-elevated);
                    color: var(--text-secondary);
                    border: 1px solid var(--border);
                }
                .new-btn-ghost:hover:not(:disabled) {
                    background: var(--surface-primary);
                    color: var(--text-primary);
                }
                .new-btn-primary {
                    background: var(--accent-warm);
                    color: #fff;
                }
                .new-btn-primary:hover:not(:disabled) { opacity: 0.88; }
            `}</style>
        </>
    );
}
