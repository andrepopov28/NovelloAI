'use client';

import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useProjects } from '@/lib/hooks/useProjects';
import { useActiveProject } from '@/lib/context/ActiveProjectContext';
import type { Project } from '@/lib/types';

// ─── Status dot ──────────────────────────────────────────────
function statusColor(pct: number): string {
    if (pct >= 0.8) return '#10b981'; // green
    if (pct >= 0.3) return '#f59e0b'; // amber
    return '#ef4444';                  // red
}

// ─── Progress bar ─────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
    const clamped = Math.min(1, Math.max(0, pct));
    return (
        <div className="pl-bar-track">
            <div className="pl-bar-fill" style={{ width: `${clamped * 100}%`, background: statusColor(clamped) }} />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────
export function ProjectLedger() {
    const router = useRouter();
    const { projects, loading, deleteProject } = useProjects();
    const { activeProjectId, setActiveProjectId } = useActiveProject();

    const handleRowClick = (project: Project) => {
        setActiveProjectId(project.id);
        router.push(`/project/${project.id}`);
    };

    const handleEdit = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setActiveProjectId(project.id);
        router.push(`/project/${project.id}/setup`);
    };

    const handleDelete = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
        await deleteProject(project.id);
        if (activeProjectId === project.id) setActiveProjectId(null);
    };

    return (
        <>
            <div className="pl-panel">
                {/* Hero Image Banner */}
                <div className="pl-hero">
                    <img
                        src="/images/ledger-hero.png"
                        alt="Projects"
                        className="pl-hero-img"
                    />
                    <div className="pl-hero-overlay" />
                    <div className="pl-hero-content">
                        <span className="pl-header-title">Projects</span>
                        <button className="pl-add-btn" onClick={() => router.push('/project/new')} title="New Project">
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/* Column labels */}
                <div className="pl-col-labels">
                    <span className="pl-col-name">Name</span>
                    <span className="pl-col-progress">Progress</span>
                    <span className="pl-col-status">Status</span>
                </div>

                {/* Rows */}
                <div className="pl-rows">
                    {loading && (
                        <div className="pl-empty">
                            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                    )}

                    {!loading && projects.length === 0 && (
                        <div className="pl-empty">
                            <span>No projects yet.</span>
                            <button className="pl-empty-cta" onClick={() => router.push('/project/new')}>Create one →</button>
                        </div>
                    )}

                    {!loading && projects.map((project) => {
                        const target = project.targetWordCount || 80000;
                        const pct = Math.min(1, (project.wordCount || 0) / target);
                        const isActive = project.id === activeProjectId;

                        return (
                            <div
                                key={project.id}
                                className={`pl-row ${isActive ? 'pl-row-active' : ''}`}
                                onClick={() => handleRowClick(project)}
                            >
                                {/* Name */}
                                <div className="pl-row-name">
                                    {isActive && <span className="pl-active-caret">›</span>}
                                    <span className={`pl-name-text ${isActive ? 'pl-name-active' : ''}`}>
                                        {project.title}
                                    </span>
                                </div>

                                {/* Progress */}
                                <div className="pl-row-progress">
                                    <ProgressBar pct={pct} />
                                    <span className="pl-pct-label">{Math.round(pct * 100)}%</span>
                                </div>

                                {/* Status dot */}
                                <div className="pl-row-status">
                                    <span className="pl-dot" style={{ background: statusColor(pct) }} />
                                </div>

                                {/* Actions */}
                                <div className="pl-row-actions">
                                    <button className="pl-action-btn" onClick={(e) => handleEdit(e, project)} title="Edit project settings">
                                        <Pencil size={11} />
                                    </button>
                                    <button className="pl-action-btn pl-action-delete" onClick={(e) => handleDelete(e, project)} title="Delete">
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>


            <style jsx>{`
                /* ── Panel ── */
                .pl-panel {
                    position: fixed;
                    right: 0;
                    bottom: 0;
                    width: var(--chatbox-width);
                    height: var(--ledger-height, 40vh);
                    z-index: 99;
                    display: flex;
                    flex-direction: column;
                    background: var(--glass-bg-strong);
                    backdrop-filter: var(--glass-blur-heavy);
                    -webkit-backdrop-filter: var(--glass-blur-heavy);
                    border-left: 1px solid var(--border);
                    border-top: 1px solid var(--border-strong);
                    box-shadow: var(--shadow-xl);
                    overflow: hidden;
                }

                /* ── Hero Banner ── */
                .pl-hero {
                    position: relative;
                    height: 72px;
                    flex-shrink: 0;
                    overflow: hidden;
                    border-bottom: 1px solid var(--border-strong);
                }
                .pl-hero-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center 30%;
                    display: block;
                }
                .pl-hero-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to right,
                        rgba(0,0,0,0.72) 0%,
                        rgba(0,0,0,0.45) 60%,
                        rgba(0,0,0,0.2) 100%
                    );
                }
                .pl-hero-content {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 14px;
                }
                .pl-header-title {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                }
                .pl-add-btn {
                    width: 22px;
                    height: 22px;
                    border-radius: var(--radius-sm);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .pl-add-btn:hover {
                    background: var(--accent-warm-muted);
                    color: var(--accent-warm);
                    border-color: var(--accent-warm-glow);
                }

                /* ── Column labels ── */
                .pl-col-labels {
                    display: grid;
                    grid-template-columns: 1fr 90px 28px;
                    gap: 4px;
                    padding: 4px 14px;
                    border-bottom: 1px solid var(--border);
                    flex-shrink: 0;
                }
                .pl-col-labels span {
                    font-size: 0.58rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--text-tertiary);
                }

                /* ── Rows container ── */
                .pl-rows {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                .pl-rows::-webkit-scrollbar { width: 3px; }
                .pl-rows::-webkit-scrollbar-thumb {
                    background: var(--border-strong);
                    border-radius: 2px;
                }

                /* ── Empty state ── */
                .pl-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    flex: 1;
                    padding: 16px;
                    font-size: 0.72rem;
                    color: var(--text-tertiary);
                }
                .pl-empty-cta {
                    font-size: 0.7rem;
                    color: var(--accent-warm);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }

                /* ── Row ── */
                .pl-row {
                    display: grid;
                    grid-template-columns: 1fr 90px 28px 40px;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 14px;
                    cursor: pointer;
                    border-bottom: 1px solid transparent;
                    transition: background 0.12s;
                    min-height: 36px;
                }
                .pl-row:hover {
                    background: var(--surface-tertiary);
                }
                .pl-row-active {
                    background: var(--accent-warm-muted);
                    border-bottom-color: var(--accent-warm-glow);
                }
                .pl-row-active:hover {
                    background: var(--accent-warm-muted);
                }

                /* Name cell */
                .pl-row-name {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    min-width: 0;
                }
                .pl-active-caret {
                    font-size: 0.9rem;
                    color: var(--accent-warm);
                    flex-shrink: 0;
                    line-height: 1;
                }
                .pl-name-text {
                    font-size: 0.72rem;
                    font-weight: 500;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .pl-name-active {
                    font-weight: 700;
                    color: var(--accent-warm);
                }
                .pl-edit-input {
                    font-size: 0.72rem;
                    font-weight: 600;
                    background: var(--surface-primary);
                    border: 1px solid var(--accent-warm);
                    border-radius: var(--radius-sm);
                    color: var(--text-primary);
                    padding: 2px 6px;
                    width: 100%;
                    outline: none;
                }

                /* Progress cell */
                .pl-row-progress {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .pl-bar-track {
                    flex: 1;
                    height: 5px;
                    border-radius: 3px;
                    background: var(--surface-elevated);
                    overflow: hidden;
                }
                .pl-bar-fill {
                    height: 100%;
                    border-radius: 3px;
                    transition: width 0.3s ease;
                }
                .pl-pct-label {
                    font-size: 0.58rem;
                    font-weight: 700;
                    color: var(--text-tertiary);
                    flex-shrink: 0;
                    width: 26px;
                    text-align: right;
                }

                /* Status cell */
                .pl-row-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pl-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    box-shadow: 0 0 6px currentColor;
                }

                /* Actions cell */
                .pl-row-actions {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    opacity: 0;
                    transition: opacity 0.12s;
                }
                .pl-row:hover .pl-row-actions {
                    opacity: 1;
                }
                .pl-action-btn {
                    width: 18px;
                    height: 18px;
                    border-radius: var(--radius-sm);
                    border: none;
                    background: transparent;
                    color: var(--text-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.12s;
                }
                .pl-action-btn:hover {
                    background: var(--surface-elevated);
                    color: var(--text-primary);
                }
                .pl-action-delete:hover {
                    color: #ef4444;
                }

                /* ── Create Modal ── */
                .pl-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 200;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pl-modal {
                    width: 380px;
                    border-radius: var(--radius-lg);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border-strong);
                    box-shadow: var(--shadow-xl);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: plModalIn 0.2s ease;
                }
                @keyframes plModalIn {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .pl-modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px 12px;
                    border-bottom: 1px solid var(--border);
                }
                .pl-modal-title {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .pl-modal-close {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                .pl-modal-body {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .pl-label {
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--text-tertiary);
                    margin-top: 6px;
                }
                .pl-input {
                    width: 100%;
                    padding: 8px 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    font-size: 0.8rem;
                    font-family: inherit;
                    outline: none;
                    transition: border-color 0.15s;
                }
                .pl-input:focus {
                    border-color: var(--accent-warm);
                }
                .pl-textarea {
                    resize: none;
                }
                .pl-hint {
                    font-size: 0.62rem;
                    color: var(--text-tertiary);
                    margin-top: 2px;
                }
                .pl-modal-footer {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                    padding: 12px 16px 14px;
                    border-top: 1px solid var(--border);
                }
                .pl-btn {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 7px 14px;
                    border-radius: var(--radius-md);
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    border: none;
                }
                .pl-btn-ghost {
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    border: 1px solid var(--border);
                }
                .pl-btn-ghost:hover {
                    background: var(--surface-elevated);
                    color: var(--text-primary);
                }
                .pl-btn-primary {
                    background: var(--accent-warm);
                    color: #fff;
                }
                .pl-btn-primary:hover {
                    opacity: 0.9;
                }
                .pl-btn-primary:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
            `}</style>
        </>
    );
}
