'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Trash2,
    BookOpen,
    User,
    Hash,
    Tag,
    Image as ImageIcon,
    Target,
    X,
    Loader2,
    CheckCircle2,
} from 'lucide-react';
import { useProjects } from '@/lib/hooks/useProjects';
import { toast } from 'sonner';

// ─── Delete Confirmation Modal ────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel, deleting }: {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
    deleting: boolean;
}) {
    return (
        <div className="setup-modal-overlay" onClick={onCancel}>
            <div className="setup-modal" onClick={(e) => e.stopPropagation()}>
                <div className="setup-modal-icon">
                    <Trash2 size={22} />
                </div>
                <h2 className="setup-modal-title">Delete Project?</h2>
                <p className="setup-modal-body">
                    <strong>&ldquo;{title}&rdquo;</strong> and all its chapters, entities, and data will be
                    permanently deleted. This cannot be undone.
                </p>
                <div className="setup-modal-actions">
                    <button className="setup-btn setup-btn-ghost" onClick={onCancel} disabled={deleting}>
                        Cancel
                    </button>
                    <button className="setup-btn setup-btn-danger" onClick={onConfirm} disabled={deleting}>
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {deleting ? 'Deleting…' : 'Delete Forever'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Field Row ────────────────────────────────────────────────
function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="setup-field">
            <label className="setup-field-label">
                <span className="setup-field-icon">{icon}</span>
                {label}
            </label>
            {children}
        </div>
    );
}

export default function SetupContent({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { projects, loading, updateProject, deleteProject } = useProjects();

    const project = projects.find((p) => p.id === projectId);

    // Form state
    const [title, setTitle] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [isbn, setIsbn] = useState('');
    const [genre, setGenre] = useState('');
    const [categories, setCategories] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [targetWordCount, setTargetWordCount] = useState(80000);
    const [targetChapterCount, setTargetChapterCount] = useState(0);

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Hydrate form when project loads
    useEffect(() => {
        if (!project) return;
        setTitle(project.title || '');
        setAuthorName(project.metadata?.authorName || '');
        setSynopsis(project.synopsis || '');
        setIsbn(project.metadata?.isbn || '');
        setGenre(project.genre || '');
        setCategories((project.metadata?.keywords || []).join(', '));
        setCoverImage(project.coverImage || '');
        setTargetWordCount(project.targetWordCount || 80000);
        setTargetChapterCount(project.targetChapterCount || 0);
    }, [project]);

    const handleSave = async () => {
        if (!title.trim()) { toast.error('Title is required'); return; }
        setSaving(true);
        setSaved(false);
        try {
            await updateProject(projectId, {
                title: title.trim(),
                synopsis: synopsis.trim(),
                genre: genre.trim(),
                coverImage: coverImage.trim(),
                targetWordCount,
                targetChapterCount,
                metadata: {
                    authorName: authorName.trim(),
                    isbn: isbn.trim() || null,
                    keywords: categories.split(',').map((k) => k.trim()).filter(Boolean),
                    language: project?.metadata?.language || 'en',
                },
            });
            setSaved(true);
            toast.success('Project saved!');
            setTimeout(() => setSaved(false), 2500);
        } catch {
            toast.error('Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteProject(projectId);
            toast.success('Project deleted');
            router.push('/app');
        } catch {
            toast.error('Failed to delete project');
            setDeleting(false);
        }
    };

    // Progress calculations
    const wordPct = project ? Math.min(1, (project.wordCount || 0) / (targetWordCount || 80000)) : 0;
    const chapterPct = targetChapterCount > 0 && project
        ? Math.min(1, (project.chapterCount || 0) / targetChapterCount)
        : 0;

    if (loading) {
        return (
            <div className="setup-loading">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="setup-loading">
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Project not found.</p>
                <button className="setup-btn setup-btn-ghost" onClick={() => router.push('/app')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="setup-root">
            {/* Top bar */}
            <div className="setup-topbar">
                <button className="setup-back-btn" onClick={() => router.back()}>
                    <ArrowLeft size={16} />
                    Back
                </button>
                <h1 className="setup-page-title">Project Setup</h1>
                <div className="setup-topbar-actions">
                    <button
                        className="setup-btn setup-btn-danger-ghost"
                        onClick={() => setShowDelete(true)}
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                    <button
                        className="setup-btn setup-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : saved ? (
                            <CheckCircle2 size={14} />
                        ) : (
                            <Save size={14} />
                        )}
                        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="setup-grid">
                {/* ── Left column: editable fields ── */}
                <div className="setup-left">

                    {/* Book Identity */}
                    <section className="setup-card">
                        <h2 className="setup-section-title">Book Identity</h2>

                        <Field label="Book Title" icon={<BookOpen size={13} />}>
                            <input
                                className="setup-input"
                                placeholder="My Novel"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </Field>

                        <Field label="Author Name" icon={<User size={13} />}>
                            <input
                                className="setup-input"
                                placeholder="Your name"
                                value={authorName}
                                onChange={(e) => setAuthorName(e.target.value)}
                            />
                        </Field>

                        <Field label="Description / Synopsis" icon={<BookOpen size={13} />}>
                            <textarea
                                className="setup-input setup-textarea"
                                placeholder="A compelling premise for your story…"
                                value={synopsis}
                                onChange={(e) => setSynopsis(e.target.value)}
                                rows={4}
                            />
                        </Field>
                    </section>

                    {/* Publishing Metadata */}
                    <section className="setup-card">
                        <h2 className="setup-section-title">Publishing Metadata</h2>

                        <Field label="ISBN" icon={<Hash size={13} />}>
                            <input
                                className="setup-input"
                                placeholder="978-0-000-00000-0"
                                value={isbn}
                                onChange={(e) => setIsbn(e.target.value)}
                            />
                        </Field>

                        <Field label="Genre" icon={<Tag size={13} />}>
                            <input
                                className="setup-input"
                                placeholder="Literary fiction, thriller, fantasy…"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                            />
                        </Field>

                        <Field label="Categories (comma-separated)" icon={<Tag size={13} />}>
                            <input
                                className="setup-input"
                                placeholder="Fiction, Mystery, Coming of Age"
                                value={categories}
                                onChange={(e) => setCategories(e.target.value)}
                            />
                        </Field>
                    </section>

                    {/* Cover */}
                    <section className="setup-card">
                        <h2 className="setup-section-title">Book Cover</h2>
                        <Field label="Cover Image URL" icon={<ImageIcon size={13} />}>
                            <input
                                className="setup-input"
                                placeholder="https://…"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                            />
                        </Field>
                        {coverImage && (
                            <div className="setup-cover-preview">
                                <img src={coverImage} alt="Cover preview" className="setup-cover-img" />
                                <button className="setup-cover-clear" onClick={() => setCoverImage('')}>
                                    <X size={12} /> Remove
                                </button>
                            </div>
                        )}
                        {!coverImage && (
                            <div className="setup-cover-empty">
                                <BookOpen size={28} />
                                <span>No cover set</span>
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Right column: targets + stats ── */}
                <div className="setup-right">

                    {/* Targets */}
                    <section className="setup-card">
                        <h2 className="setup-section-title">Writing Targets</h2>

                        <Field label="Target Word Count" icon={<Target size={13} />}>
                            <input
                                className="setup-input"
                                type="number"
                                min={1000}
                                step={1000}
                                value={targetWordCount}
                                onChange={(e) => setTargetWordCount(Number(e.target.value) || 80000)}
                            />
                        </Field>

                        <Field label="Target Chapter Count" icon={<Target size={13} />}>
                            <input
                                className="setup-input"
                                type="number"
                                min={0}
                                step={1}
                                value={targetChapterCount}
                                onChange={(e) => setTargetChapterCount(Number(e.target.value) || 0)}
                            />
                        </Field>
                    </section>

                    {/* Progress */}
                    <section className="setup-card">
                        <h2 className="setup-section-title">Progress</h2>

                        {/* Word count */}
                        <div className="setup-stat-row">
                            <div className="setup-stat-labels">
                                <span className="setup-stat-name">Word Count</span>
                                <span className="setup-stat-value">
                                    {(project.wordCount || 0).toLocaleString()}
                                    <span className="setup-stat-target"> / {targetWordCount.toLocaleString()}</span>
                                </span>
                            </div>
                            <div className="setup-progress-track">
                                <div
                                    className="setup-progress-fill"
                                    style={{
                                        width: `${wordPct * 100}%`,
                                        background: wordPct >= 0.8 ? '#10b981' : wordPct >= 0.3 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                            </div>
                            <span className="setup-pct">{Math.round(wordPct * 100)}% complete</span>
                        </div>

                        {/* Chapter count */}
                        <div className="setup-stat-row">
                            <div className="setup-stat-labels">
                                <span className="setup-stat-name">Chapters</span>
                                <span className="setup-stat-value">
                                    {project.chapterCount || 0}
                                    {targetChapterCount > 0 && (
                                        <span className="setup-stat-target"> / {targetChapterCount}</span>
                                    )}
                                </span>
                            </div>
                            {targetChapterCount > 0 && (
                                <>
                                    <div className="setup-progress-track">
                                        <div
                                            className="setup-progress-fill"
                                            style={{
                                                width: `${chapterPct * 100}%`,
                                                background: chapterPct >= 0.8 ? '#10b981' : chapterPct >= 0.3 ? '#f59e0b' : '#ef4444',
                                            }}
                                        />
                                    </div>
                                    <span className="setup-pct">{Math.round(chapterPct * 100)}% complete</span>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Quick nav */}
                    <section className="setup-card">
                        <h2 className="setup-section-title">Quick Navigation</h2>
                        <div className="setup-nav-links">
                            {[
                                { label: 'Write', href: `/project/${projectId}` },
                                { label: 'Brainstorm', href: `/project/${projectId}/brainstorm` },
                                { label: 'Codex', href: `/project/${projectId}/codex` },
                                { label: 'Audiobook', href: `/project/${projectId}/audiobook` },
                                { label: 'Publish', href: `/project/${projectId}/publish` },
                            ].map(({ label, href }) => (
                                <button
                                    key={label}
                                    className="setup-nav-link"
                                    onClick={() => router.push(href)}
                                >
                                    {label} →
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDelete && (
                <DeleteModal
                    title={project.title}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDelete(false)}
                    deleting={deleting}
                />
            )}

            <style jsx>{`
                .setup-root {
                    max-width: 1100px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem 6rem;
                }

                /* ── Loading ── */
                .setup-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    height: 60vh;
                }

                /* ── Top bar ── */
                .setup-topbar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 2rem;
                }
                .setup-back-btn {
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
                .setup-back-btn:hover {
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                }
                .setup-page-title {
                    flex: 1;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .setup-topbar-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* ── Grid ── */
                .setup-grid {
                    display: grid;
                    grid-template-columns: 1.4fr 1fr;
                    gap: 1.5rem;
                    align-items: start;
                }
                @media (max-width: 800px) {
                    .setup-grid { grid-template-columns: 1fr; }
                }

                /* ── Cards ── */
                .setup-card {
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-xl);
                    padding: 20px 22px;
                    margin-bottom: 1rem;
                }
                .setup-section-title {
                    font-size: 0.72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-tertiary);
                    margin: 0 0 16px;
                }

                /* ── Fields ── */
                .setup-field {
                    margin-bottom: 14px;
                }
                .setup-field:last-child { margin-bottom: 0; }
                .setup-field-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 6px;
                }
                .setup-field-icon {
                    color: var(--text-tertiary);
                    display: flex;
                    align-items: center;
                }
                .setup-input {
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
                .setup-input:focus {
                    border-color: var(--accent-warm);
                }
                .setup-input::placeholder { color: var(--text-tertiary); }
                .setup-textarea {
                    resize: vertical;
                    min-height: 90px;
                }

                /* ── Cover ── */
                .setup-cover-preview {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    margin-top: 12px;
                }
                .setup-cover-img {
                    max-width: 160px;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-md);
                }
                .setup-cover-clear {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }
                .setup-cover-clear:hover { color: #ef4444; }
                .setup-cover-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 24px;
                    border: 2px dashed var(--border-strong);
                    border-radius: var(--radius-lg);
                    color: var(--text-tertiary);
                    margin-top: 12px;
                    font-size: 0.78rem;
                }

                /* ── Progress ── */
                .setup-stat-row {
                    margin-bottom: 18px;
                }
                .setup-stat-row:last-child { margin-bottom: 0; }
                .setup-stat-labels {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 6px;
                }
                .setup-stat-name {
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .setup-stat-value {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .setup-stat-target {
                    font-weight: 400;
                    color: var(--text-tertiary);
                }
                .setup-progress-track {
                    height: 7px;
                    border-radius: 4px;
                    background: var(--surface-elevated);
                    overflow: hidden;
                    margin-bottom: 4px;
                }
                .setup-progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.4s ease;
                }
                .setup-pct {
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                }

                /* ── Quick nav ── */
                .setup-nav-links {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .setup-nav-link {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 9px 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                    text-align: left;
                }
                .setup-nav-link:hover {
                    background: var(--surface-elevated);
                    color: var(--text-primary);
                    border-color: var(--accent-warm-glow);
                }

                /* ── Buttons ── */
                .setup-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: var(--radius-md);
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    border: none;
                    white-space: nowrap;
                }
                .setup-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .setup-btn-primary {
                    background: var(--accent-warm);
                    color: #fff;
                }
                .setup-btn-primary:hover:not(:disabled) { opacity: 0.88; }
                .setup-btn-ghost {
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    border: 1px solid var(--border);
                }
                .setup-btn-ghost:hover:not(:disabled) {
                    background: var(--surface-elevated);
                    color: var(--text-primary);
                }
                .setup-btn-danger-ghost {
                    background: transparent;
                    color: var(--text-tertiary);
                    border: 1px solid var(--border);
                }
                .setup-btn-danger-ghost:hover {
                    background: rgba(239,68,68,0.08);
                    color: #ef4444;
                    border-color: rgba(239,68,68,0.3);
                }
                .setup-btn-danger {
                    background: #ef4444;
                    color: #fff;
                }
                .setup-btn-danger:hover:not(:disabled) { background: #dc2626; }

                /* ── Delete Modal ── */
                .setup-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 300;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .setup-modal {
                    width: 380px;
                    background: var(--surface-secondary);
                    border: 1px solid var(--border-strong);
                    border-radius: var(--radius-xl);
                    box-shadow: var(--shadow-xl);
                    padding: 28px 28px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    animation: setupModalIn 0.2s ease;
                }
                @keyframes setupModalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .setup-modal-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    background: rgba(239,68,68,0.12);
                    color: #ef4444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 16px;
                }
                .setup-modal-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 10px;
                }
                .setup-modal-body {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    margin: 0 0 24px;
                }
                .setup-modal-actions {
                    display: flex;
                    gap: 10px;
                    width: 100%;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
}
