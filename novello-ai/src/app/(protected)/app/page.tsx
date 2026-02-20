'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useProjects } from '@/lib/hooks/useProjects';
import { useTheme } from '@/lib/hooks/useTheme';
import { getThemeImage, isLightTheme } from '@/lib/theme-images';
import { useActiveProject } from '@/lib/context/ActiveProjectContext';
import { Plus, ArrowRight, TrendingUp } from 'lucide-react';
import type { Project } from '@/lib/types';

/* ─── Module definitions ─────────────────────────────────────── */
const MODULE_STATIC = [
    { title: 'Brainstorm', subtitle: 'Mind maps & stickies', href: '', key: 'brainstorm' as const },
    { title: 'Data & Knowledge', subtitle: 'Uploads & citations', href: '', key: 'data' as const },
    { title: 'Audiobook Studio', subtitle: 'Voice & narration', href: '/audiobook', key: 'audiobook' as const },
    { title: 'Publish', subtitle: 'Export & finalize', href: '/publish', key: 'publish' as const },
    { title: 'Settings', subtitle: 'Models & workflow', href: '/settings', key: 'settings' as const },
];

/* ─── Compact Destination Card ───────────────────────────────── */
function DestCard({
    title,
    subtitle,
    href,
    imageSrc,
    lightTheme,
}: {
    title: string;
    subtitle: string;
    href: string;
    imageSrc: string;
    lightTheme: boolean;
}) {
    const overlay = lightTheme
        ? 'linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.82) 100%)'
        : 'linear-gradient(180deg, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.72) 100%)';
    const titleColor = lightTheme ? 'var(--text-primary)' : '#fff';
    const subtitleColor = lightTheme ? 'var(--text-secondary)' : 'rgba(255,255,255,0.75)';

    return (
        <Link
            href={href || '#'}
            className="dest-card group"
        >
            <div className="dest-card-img-wrap">
                <Image src={imageSrc} alt={title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="200px" />
                <div className="dest-card-overlay" style={{ background: overlay }} />
            </div>
            <div className="dest-card-text">
                <span className="dest-card-title" style={{ color: titleColor }}>{title}</span>
                <span className="dest-card-subtitle" style={{ color: subtitleColor }}>{subtitle}</span>
            </div>
        </Link>
    );
}

/* ─── Progress Bar ───────────────────────────────────────────── */
function ProgressBar({ pct, color = 'var(--accent)' }: { pct: number; color?: string }) {
    return (
        <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', flex: 1 }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round(pct * 100))}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
        </div>
    );
}

/* ─── Stat Chip ──────────────────────────────────────────────── */
function StatChip({ label, value, delta }: { label: string; value: string; delta?: string }) {
    return (
        <div className="stat-chip">
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
            {delta && <span className="stat-delta">▲ {delta}</span>}
            <style jsx>{`
                .stat-chip {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    padding: 10px 12px;
                    border-radius: var(--radius-md);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    flex: 1;
                    min-width: 0;
                }
                .stat-label {
                    font-size: 10px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--text-tertiary);
                    font-family: var(--font-text);
                }
                .stat-value {
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--text-primary);
                    font-family: var(--font-display);
                    line-height: 1.1;
                }
                .stat-delta {
                    font-size: 10px;
                    color: #4caf50;
                    font-weight: 600;
                }
            `}</style>
        </div>
    );
}

/* ─── Dashboard Stats Panel ──────────────────────────────────── */
function DashboardPanel({ projects, activeProjectId, onNewProject, onProjectClick }: {
    projects: Project[];
    activeProjectId: string | null;
    onNewProject: () => void;
    onProjectClick: (p: Project) => void;
}) {
    const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;
    const wordCount = activeProject?.wordCount || 0;
    const targetWords = activeProject?.targetWordCount || 80000;
    const chapterCount = activeProject?.chapterCount || 0;
    const targetChapters = activeProject?.targetChapterCount || 24;
    const wordPct = Math.min(1, wordCount / targetWords);
    const chapterPct = Math.min(1, chapterCount / targetChapters);

    // Aggregate stats across all projects
    const totalWords = projects.reduce((s, p) => s + (p.wordCount || 0), 0);

    return (
        <div className="dash-panel">
            {/* Header */}
            <div className="dash-section-header">
                <div>
                    <h2 className="dash-section-title">Dashboard</h2>
                    <p className="dash-section-sub">Progress, output, and AI usage across your books.</p>
                </div>
                <button className="dash-new-btn" onClick={onNewProject}>
                    <Plus size={13} />
                    New Book
                </button>
            </div>

            {/* Active project card */}
            {activeProject ? (
                <div className="dash-project-card" onClick={() => onProjectClick(activeProject)}>
                    <div className="dash-project-top">
                        <div>
                            <span className="dash-project-label">Active Project</span>
                            <span className="dash-project-name">{activeProject.title}</span>
                        </div>
                        <ArrowRight size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                    </div>
                    <div className="dash-project-progress-row">
                        <span className="dash-project-pct">{Math.round(wordPct * 100)}%</span>
                        <ProgressBar pct={wordPct} />
                    </div>
                    <span className="dash-project-meta">{wordCount.toLocaleString()} / {targetWords.toLocaleString()} words</span>
                </div>
            ) : (
                <div className="dash-empty-card">
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>No projects yet.</span>
                    <button className="dash-new-btn" onClick={onNewProject} style={{ marginTop: 8 }}>
                        <Plus size={13} /> Create your first book
                    </button>
                </div>
            )}

            {/* Stat chips row */}
            <div className="dash-stats-row">
                <StatChip label="Words written" value={totalWords.toLocaleString()} />
                <StatChip label="Chapters" value={`${chapterCount}/${targetChapters}`} />
                <StatChip label="Projects" value={String(projects.length)} />
            </div>

            {/* Chapter completion bars */}
            {activeProject && (
                <div className="dash-completion-section">
                    <span className="dash-completion-title">Chapter completion</span>
                    <div className="dash-completion-row">
                        <span className="dash-completion-label">{chapterCount} Complete</span>
                        <ProgressBar pct={chapterPct} color="var(--accent)" />
                        <span className="dash-completion-pct">{Math.round(chapterPct * 100)}%</span>
                    </div>
                    <div className="dash-completion-row">
                        <span className="dash-completion-label">{Math.max(0, targetChapters - chapterCount)} In progress</span>
                        <ProgressBar pct={Math.min(1, (targetChapters - chapterCount) / targetChapters)} color="var(--accent-warm, #c9a84c)" />
                        <span className="dash-completion-pct">{Math.round(Math.min(1, (targetChapters - chapterCount) / targetChapters) * 100)}%</span>
                    </div>
                </div>
            )}

            {/* Recent projects list */}
            {projects.length > 1 && (
                <div className="dash-recent">
                    <span className="dash-completion-title">All Books</span>
                    {projects.slice(0, 4).map(p => {
                        const pct = Math.min(1, (p.wordCount || 0) / (p.targetWordCount || 80000));
                        return (
                            <div key={p.id} className="dash-recent-row" onClick={() => onProjectClick(p)}>
                                <span className="dash-recent-name">{p.title}</span>
                                <ProgressBar pct={pct} />
                                <span className="dash-recent-pct">{Math.round(pct * 100)}%</span>
                            </div>
                        );
                    })}
                </div>
            )}

            <style jsx>{`
                .dash-panel {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    height: 100%;
                    overflow-y: auto;
                }
                .dash-section-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 8px;
                }
                .dash-section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                    font-family: var(--font-display);
                    margin: 0 0 2px;
                    letter-spacing: -0.02em;
                }
                .dash-section-sub {
                    font-size: 11px;
                    color: var(--text-tertiary);
                    font-family: var(--font-text);
                    margin: 0;
                }
                .dash-new-btn {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 6px 12px;
                    border-radius: var(--radius-md);
                    background: var(--accent);
                    color: var(--text-inverse);
                    border: none;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    transition: opacity 0.2s;
                    flex-shrink: 0;
                }
                .dash-new-btn:hover { opacity: 0.85; }
                .dash-project-card {
                    padding: 12px 14px;
                    border-radius: var(--radius-md);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    cursor: pointer;
                    transition: box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .dash-project-card:hover { box-shadow: var(--shadow-md); }
                .dash-project-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }
                .dash-project-label {
                    display: block;
                    font-size: 9px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: var(--text-tertiary);
                    margin-bottom: 2px;
                }
                .dash-project-name {
                    display: block;
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-primary);
                    font-family: var(--font-display);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dash-project-progress-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .dash-project-pct {
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--accent);
                    min-width: 30px;
                }
                .dash-project-meta {
                    font-size: 10px;
                    color: var(--text-tertiary);
                }
                .dash-empty-card {
                    padding: 16px;
                    border-radius: var(--radius-md);
                    background: var(--surface-secondary);
                    border: 1px dashed var(--border-strong);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                .dash-stats-row {
                    display: flex;
                    gap: 8px;
                }
                .dash-completion-section {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 12px 14px;
                    border-radius: var(--radius-md);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                }
                .dash-completion-title {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.06em;
                    color: var(--text-tertiary);
                    margin-bottom: 2px;
                }
                .dash-completion-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .dash-completion-label {
                    font-size: 11px;
                    color: var(--text-secondary);
                    min-width: 90px;
                    white-space: nowrap;
                }
                .dash-completion-pct {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    min-width: 30px;
                    text-align: right;
                }
                .dash-recent {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    padding: 12px 14px;
                    border-radius: var(--radius-md);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                }
                .dash-recent-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    padding: 3px 0;
                    transition: opacity 0.15s;
                }
                .dash-recent-row:hover { opacity: 0.75; }
                .dash-recent-name {
                    font-size: 11px;
                    color: var(--text-secondary);
                    min-width: 90px;
                    max-width: 120px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .dash-recent-pct {
                    font-size: 11px;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    min-width: 30px;
                    text-align: right;
                }
            `}</style>
        </div>
    );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function DashboardPage() {
    const { projects, loading } = useProjects();
    const { theme } = useTheme();
    const router = useRouter();
    const { activeProjectId } = useActiveProject();
    const lightTheme = isLightTheme(theme);

    const writeHref = activeProjectId ? `/project/${activeProjectId}` : '/app';

    const allModules = [
        { title: 'Write', subtitle: 'AI Core', href: writeHref, key: 'write' as const },
        ...MODULE_STATIC.map(m => ({
            ...m,
            href: m.href
                ? m.href
                : activeProjectId
                    ? `/project/${activeProjectId}/${m.key === 'data' ? 'codex' : m.key}`
                    : '/app',
        })),
    ];

    const handleProjectClick = (project: Project) => {
        router.push(`/project/${project.id}`);
    };

    return (
        <div className="home-root">
            {/* ── Left: Destinations ── */}
            <div className="home-left">
                <div className="home-section-header">
                    <h2 className="home-section-title">Destinations</h2>
                    <p className="home-section-sub">Photorealistic shortcuts into the core areas.</p>
                </div>
                <div className="dest-grid">
                    {allModules.map(mod => (
                        <DestCard
                            key={mod.key}
                            title={mod.title}
                            subtitle={mod.subtitle}
                            href={mod.href}
                            imageSrc={getThemeImage(theme, mod.key)}
                            lightTheme={lightTheme}
                        />
                    ))}
                </div>
            </div>

            {/* ── Right: Dashboard ── */}
            <div className="home-right">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton-block" style={{ height: i === 1 ? 60 : 80 }} />
                        ))}
                    </div>
                ) : (
                    <DashboardPanel
                        projects={projects}
                        activeProjectId={activeProjectId}
                        onNewProject={() => router.push('/project/new')}
                        onProjectClick={handleProjectClick}
                    />
                )}
            </div>

            <style jsx>{`
                .home-root {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 32px;
                    height: calc(100vh - 80px);
                    max-height: calc(100vh - 80px);
                    overflow: hidden;
                    padding: 24px 28px;
                    box-sizing: border-box;
                }
                .home-left {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    overflow: hidden;
                }
                .home-right {
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    padding-right: 4px;
                }
                .home-section-header {
                    flex-shrink: 0;
                }
                .home-section-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--text-primary);
                    font-family: var(--font-display);
                    margin: 0 0 2px;
                    letter-spacing: -0.02em;
                }
                .home-section-sub {
                    font-size: 11px;
                    color: var(--text-tertiary);
                    font-family: var(--font-text);
                    margin: 0;
                }
                .dest-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    flex: 1;
                    min-height: 0;
                }
                :global(.dest-card) {
                    position: relative;
                    border-radius: var(--radius-md);
                    overflow: hidden;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    text-decoration: none;
                    box-shadow: var(--shadow-sm);
                    transition: box-shadow 0.25s, transform 0.25s;
                    aspect-ratio: 4/3;
                    background: var(--surface-tertiary);
                }
                :global(.dest-card:hover) {
                    box-shadow: var(--shadow-lg);
                    transform: translateY(-2px);
                }
                :global(.dest-card-img-wrap) {
                    position: absolute;
                    inset: 0;
                }
                :global(.dest-card-overlay) {
                    position: absolute;
                    inset: 0;
                }
                :global(.dest-card-text) {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 10px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    z-index: 2;
                }
                :global(.dest-card-title) {
                    font-size: 12px;
                    font-weight: 700;
                    font-family: var(--font-display);
                    line-height: 1.2;
                    letter-spacing: -0.01em;
                }
                :global(.dest-card-subtitle) {
                    font-size: 10px;
                    font-weight: 400;
                    font-family: var(--font-text);
                    line-height: 1.3;
                }
                .skeleton-block {
                    border-radius: var(--radius-md);
                    background: var(--surface-secondary);
                    animation: pulse 1.5s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
