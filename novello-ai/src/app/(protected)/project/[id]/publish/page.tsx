'use client';

import { use, useState } from 'react';
import {
    Send,
    Download,
    FileText,
    Image,
    BookOpen,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
} from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { usePublish } from '@/lib/hooks/usePublish';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function PublishPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params);
    const { chapters } = useChapters(projectId);
    const { metadata, updateMetadata, exporting, exportError, exportEpub, exportPdf } =
        usePublish();
    const [generatingCover, setGeneratingCover] = useState(false);

    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
    const totalWords = sortedChapters.reduce((sum, ch) => {
        const text = (ch.content || '').replace(/<[^>]*>/g, '');
        return sum + text.split(/\s+/).filter(Boolean).length;
    }, 0);
    const completedChapters = sortedChapters.filter((ch) => ch.status === 'final').length;

    // Readiness checks
    const checks = [
        {
            label: 'At least one chapter',
            passed: chapters.length > 0,
        },
        {
            label: 'Author name set',
            passed: metadata.author.trim().length > 0,
        },
        {
            label: '1,000+ words written',
            passed: totalWords >= 1000,
        },
    ];

    const allChecksPassed = checks.every((c) => c.passed);

    return (
        <>
            <div className="publish-root">
                {/* Header */}
                <div className="pub-header ambient-glow">
                    <div className="pub-header-icon">
                        <Send size={24} />
                    </div>
                    <div className="pub-header-text">
                        <h1 className="pub-title">Publishing Studio</h1>
                        <p className="pub-subtitle">
                            Prepare your manuscript for the world — metadata, cover, and export
                        </p>
                    </div>
                </div>

                <div className="pub-grid">
                    {/* Left: Metadata + Cover */}
                    <div className="pub-left">
                        {/* Metadata Card */}
                        <div className="pub-card premium-card">
                            <h2 className="pub-card-title">
                                <FileText size={16} />
                                Manuscript Metadata
                            </h2>
                            <div className="pub-form">
                                <Input
                                    label="Author Name"
                                    placeholder="Your name"
                                    value={metadata.author}
                                    onChange={(e) => updateMetadata({ author: e.target.value })}
                                />
                                <div>
                                    <label className="pub-label">Description</label>
                                    <textarea
                                        className="pub-textarea"
                                        placeholder="A compelling description for readers..."
                                        value={metadata.description}
                                        onChange={(e) =>
                                            updateMetadata({ description: e.target.value })
                                        }
                                        rows={3}
                                    />
                                </div>
                                <Input
                                    label="ISBN (Optional)"
                                    placeholder="978-..."
                                    value={metadata.isbn}
                                    onChange={(e) => updateMetadata({ isbn: e.target.value })}
                                />
                                <Input
                                    label="Categories"
                                    placeholder="Fiction, Fantasy, Adventure..."
                                    value={metadata.categories}
                                    onChange={(e) => updateMetadata({ categories: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Cover Card */}
                        <div className="pub-card premium-card">
                            <h2 className="pub-card-title">
                                <Image size={16} />
                                Book Cover
                            </h2>
                            {metadata.coverUrl ? (
                                <div className="pub-cover-preview">
                                    <img src={metadata.coverUrl} alt="Cover" className="pub-cover-img" />
                                    <button
                                        className="pub-cover-change"
                                        onClick={() => updateMetadata({ coverUrl: null })}
                                    >
                                        Change Cover
                                    </button>
                                </div>
                            ) : (
                                <div className="pub-cover-empty">
                                    <div className="pub-cover-placeholder">
                                        <BookOpen size={32} />
                                        <span>No cover yet</span>
                                    </div>
                                    <p className="pub-cover-hint">
                                        AI cover generation coming soon. For now, you can upload a custom cover.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            // Placeholder for AI cover generation
                                            setGeneratingCover(true);
                                            setTimeout(() => setGeneratingCover(false), 2000);
                                        }}
                                        loading={generatingCover}
                                    >
                                        <Sparkles size={14} />
                                        Generate with AI
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Readiness + Export */}
                    <div className="pub-right">
                        {/* Stats */}
                        <div className="pub-card premium-card">
                            <h2 className="pub-card-title">Manuscript Stats</h2>
                            <div className="pub-stats">
                                <div className="pub-stat">
                                    <span className="pub-stat-value">{chapters.length}</span>
                                    <span className="pub-stat-label">Chapters</span>
                                </div>
                                <div className="pub-stat">
                                    <span className="pub-stat-value">{totalWords.toLocaleString()}</span>
                                    <span className="pub-stat-label">Words</span>
                                </div>
                                <div className="pub-stat">
                                    <span className="pub-stat-value">{completedChapters}</span>
                                    <span className="pub-stat-label">Finalized</span>
                                </div>
                            </div>
                        </div>

                        {/* Readiness */}
                        <div className="pub-card premium-card">
                            <h2 className="pub-card-title">Publishing Checklist</h2>
                            <div className="pub-checks">
                                {checks.map((check) => (
                                    <div
                                        key={check.label}
                                        className={`pub-check ${check.passed ? 'pub-check-pass' : 'pub-check-fail'}`}
                                    >
                                        {check.passed ? (
                                            <CheckCircle2 size={16} />
                                        ) : (
                                            <AlertCircle size={16} />
                                        )}
                                        <span>{check.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Export */}
                        <div className="pub-card premium-card">
                            <h2 className="pub-card-title">
                                <Download size={16} />
                                Export
                            </h2>

                            {exportError && (
                                <div className="pub-error">
                                    <AlertCircle size={14} />
                                    {exportError}
                                </div>
                            )}

                            <div className="pub-export-btns">
                                <button
                                    className="pub-export-btn"
                                    onClick={() => exportEpub(projectId)}
                                    disabled={exporting || !allChecksPassed}
                                >
                                    {exporting ? (
                                        <Loader2 size={16} className="spin" />
                                    ) : (
                                        <BookOpen size={16} />
                                    )}
                                    <div>
                                        <span className="pub-export-format">EPUB</span>
                                        <span className="pub-export-desc">E-book format</span>
                                    </div>
                                </button>
                                <button
                                    className="pub-export-btn"
                                    onClick={() => exportPdf(projectId)}
                                    disabled={exporting || !allChecksPassed}
                                >
                                    {exporting ? (
                                        <Loader2 size={16} className="spin" />
                                    ) : (
                                        <FileText size={16} />
                                    )}
                                    <div>
                                        <span className="pub-export-format">PDF</span>
                                        <span className="pub-export-desc">Print-ready</span>
                                    </div>
                                </button>
                            </div>

                            {!allChecksPassed && (
                                <p className="pub-export-notice">
                                    Complete the checklist above to enable exports.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .publish-root {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem 4rem;
                }

                /* ── Header ── */
                .pub-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 2rem;
                    border-radius: var(--radius-xl);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    margin-bottom: 2rem;
                }
                .pub-header-icon {
                    width: 52px;
                    height: 52px;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #3b82f6, #06b6d4);
                    color: white;
                    flex-shrink: 0;
                }
                .pub-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0 0 4px;
                }
                .pub-subtitle {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                /* ── Grid ── */
                .pub-grid {
                    display: grid;
                    grid-template-columns: 1.2fr 1fr;
                    gap: 1.5rem;
                    align-items: start;
                }

                /* ── Cards ── */
                .pub-card {
                    padding: 20px;
                    margin-bottom: 1rem;
                }
                .pub-card-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin: 0 0 16px;
                    color: var(--text-primary);
                }

                /* ── Form ── */
                .pub-form {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .pub-label {
                    display: block;
                    font-size: 0.82rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 6px;
                }
                .pub-textarea {
                    width: 100%;
                    padding: 10px 14px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border-strong);
                    background: var(--surface-secondary);
                    color: var(--text-primary);
                    font-size: 0.85rem;
                    font-family: inherit;
                    resize: none;
                    outline: none;
                    transition: border-color var(--transition-fast);
                }
                .pub-textarea:focus {
                    border-color: var(--accent);
                }
                .pub-textarea::placeholder {
                    color: var(--text-tertiary);
                }

                /* ── Cover ── */
                .pub-cover-preview {
                    text-align: center;
                }
                .pub-cover-img {
                    max-width: 200px;
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-md);
                    margin-bottom: 12px;
                }
                .pub-cover-change {
                    font-size: 0.78rem;
                    color: var(--accent);
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .pub-cover-empty {
                    text-align: center;
                    padding: 16px 0;
                }
                .pub-cover-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 24px;
                    border-radius: var(--radius-lg);
                    border: 2px dashed var(--border-strong);
                    color: var(--text-tertiary);
                    margin-bottom: 12px;
                }
                .pub-cover-placeholder span {
                    font-size: 0.8rem;
                }
                .pub-cover-hint {
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                    margin: 0 0 12px;
                }

                /* ── Stats ── */
                .pub-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                }
                .pub-stat {
                    text-align: center;
                    padding: 12px;
                    border-radius: var(--radius-md);
                    background: var(--surface-tertiary);
                }
                .pub-stat-value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .pub-stat-label {
                    display: block;
                    font-size: 0.68rem;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-top: 4px;
                }

                /* ── Checks ── */
                .pub-checks {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .pub-check {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    border-radius: var(--radius-md);
                    font-size: 0.8rem;
                }
                .pub-check-pass {
                    color: var(--success);
                    background: rgba(34, 197, 94, 0.08);
                }
                .pub-check-fail {
                    color: var(--text-tertiary);
                    background: var(--surface-tertiary);
                }

                /* ── Export ── */
                .pub-export-btns {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .pub-export-btn {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                    text-align: left;
                }
                .pub-export-btn:hover:not(:disabled) {
                    border-color: var(--accent);
                    background: var(--accent-muted);
                }
                .pub-export-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .pub-export-format {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .pub-export-desc {
                    display: block;
                    font-size: 0.7rem;
                    color: var(--text-tertiary);
                }
                .pub-export-notice {
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                    margin: 10px 0 0;
                    text-align: center;
                }
                .pub-error {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    border-radius: var(--radius-md);
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--error);
                    font-size: 0.78rem;
                    margin-bottom: 12px;
                }
                :global(.spin) {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
