'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useProjects } from '@/lib/hooks/useProjects';
import { useSeries } from '@/lib/hooks/useSeries'; // 🆕
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
    Plus,
    BookOpen,
    Clock,
    Trash2,
    X,
    Sparkles,
    FileText,
    PenTool,
    Wand2,
    TrendingUp,
    Flame,
    Zap,
    ArrowRight,
    Library,
    Upload,
} from 'lucide-react';
import { parseManuscript } from '@/lib/import-engine';
import { createChapter } from '@/lib/firestore'; // Check if this is exported and usable.
// I saw createChapter in firestore.ts earlier, it needs projectId, userId, data.
// createProject returns ID.
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { Project, Series } from '@/lib/types';

// ─── Genre Color Map ──────────────────────
const genreColors: Record<string, string> = {
    fantasy: '#8B5CF6',
    'sci-fi': '#06B6D4',
    mystery: '#F59E0B',
    romance: '#EC4899',
    horror: '#EF4444',
    thriller: '#F97316',
    literary: '#10B981',
    historical: '#A78BFA',
};

function getGenreColor(genre: string): string {
    const key = genre?.toLowerCase() || '';
    for (const [g, c] of Object.entries(genreColors)) {
        if (key.includes(g)) return c;
    }
    return 'var(--accent)';
}

// ─── Destination Nodes (Kinetic Glass & Refraction theme) ──────────────────────
const destinations = [
    { key: 'write', label: 'Write', subtitle: 'CONTINUE YOUR MANUSCRIPT', image: '/images/kinetic/write.png', path: '' },
    { key: 'brainstorming', label: 'Brainstorm', subtitle: 'AI CHARACTER GENERATION', image: '/images/kinetic/brainstorm.png', path: '/brainstorm' },
    { key: 'data', label: 'Data', subtitle: 'RESEARCH ASSISTANT', image: '/images/kinetic/data.png', path: '/codex' },
    { key: 'audiobook', label: 'Audiobook', subtitle: 'VOICE SYNTHESIS', image: '/images/kinetic/audiobook.png', path: '/audiobook' },
    { key: 'publish', label: 'Publish', subtitle: 'EXPORT FORMATS', image: '/images/kinetic/publish.png', path: '/publish' },
    { key: 'settings', label: 'Settings', subtitle: 'STUDIO PREFERENCES', image: '/images/kinetic/settings.png', path: '__settings__' },
];

// ─── Mock data for the dashboard charts/feeds ──────
const weeklyOutput = [
    { day: 'MON', val: 1200 },
    { day: 'TUE', val: 800 },
    { day: 'WED', val: 1600 },
    { day: 'THU', val: 2200 },
    { day: 'FRI', val: 1800 },
    { day: 'SAT', val: 900 },
    { day: 'SUN', val: 1400 },
];
const maxVal = Math.max(...weeklyOutput.map((d) => d.val));

// ─── Dashboard Page ──────────────────────
export default function DashboardPage() {
    const { projects, loading: loadingProjects, createProject, deleteProject } = useProjects();
    const { series, loading: loadingSeries, createSeries, deleteSeries, updateSeries } = useSeries(); // 🆕
    const { user } = useAuth();
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showCreateSeries, setShowCreateSeries] = useState(false); // 🆕
    const [showImportProject, setShowImportProject] = useState(false); // 🆕
    const [importing, setImporting] = useState(false); // 🆕
    const [deleting, setDeleting] = useState<string | null>(null);
    const router = useRouter();

    const loading = loadingProjects || loadingSeries;
    const totalWords = projects.reduce((sum, p) => sum + (p.wordCount || 0), 0);
    const totalChapters = projects.reduce((sum, p) => sum + 10, 0); // approximate
    const firstName = user?.displayName?.split(' ')[0] || 'Writer';
    const activeProject = projects[0]; // most recent

    // Grouping Logic
    const seriesGroups = series.map(s => ({
        series: s,
        projects: projects.filter(p => s.projectIds.includes(p.id))
    }));
    const unbundledProjects = projects.filter(p => !p.seriesId);

    return (
        <div className="dashboard-root">
            {/* ── Welcome Header (Stitch-inspired) ── */}
            <div className="welcome-row">
                <div className="welcome-left">
                    <h1 className="welcome-title">Home</h1>
                    <p className="welcome-subtitle">Welcome back, {firstName}. Your muse is waiting.</p>
                </div>
                <div className="welcome-right">
                    <p className="literary-quote">&ldquo;The first draft is just you telling yourself the story.&rdquo;</p>
                    <p className="literary-author">— Terry Pratchett</p>
                </div>
            </div>

            {/* ── Hero Card — Resume Writing (Stitch-inspired) ── */}
            {activeProject && (
                <div className="hero-card" onClick={() => router.push(`/project/${activeProject.id}`)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/kinetic/hero.png"
                        alt="Kinetic Glass Abstract"
                        className="hero-card-bg"
                    />
                    <div className="hero-card-gradient" />
                    <div className="hero-card-content">
                        <div className="hero-card-left">
                            <div className="hero-card-badges">
                                <span className="hero-badge">CURRENT PROJECT</span>
                            </div>
                            <h2 className="hero-card-title">{activeProject.title}</h2>
                            <p className="hero-card-chapter">{activeProject.genre || 'Chapter in progress'}</p>
                        </div>
                        <div className="hero-card-right">
                            <div className="hero-progress-header">
                                <span>Progress</span>
                                <span className="hero-progress-pct">42% Complete</span>
                            </div>
                            <div className="hero-progress-track">
                                <div className="hero-progress-fill" style={{ width: '42%' }} />
                            </div>
                            <div className="hero-card-cta-row">
                                <button
                                    className="hero-resume-btn"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/project/${activeProject.id}`); }}
                                >
                                    Resume Writing <span className="hero-arrow">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Two Column Layout ── */}
            <div className="two-col">
                {/* Left — Destinations */}
                <div className="col-left">
                    <div className="section-header">
                        <h2 className="section-title">Destinations</h2>
                        <p className="section-desc">Quick visual access to your workspace.</p>
                    </div>
                    <div className="dest-grid">
                        {destinations.map((d) => {
                            const handleClick = () => {
                                if (d.path === '__settings__') {
                                    router.push('/settings');
                                    return;
                                }
                                if (activeProject) {
                                    router.push(`/project/${activeProject.id}${d.path}`);
                                } else {
                                    toast.error('Please select or create a project first');
                                }
                            };
                            return (
                                <div key={d.key} className="dest-card" onClick={handleClick} role="button" tabIndex={0}>
                                    <Image
                                        src={d.image}
                                        alt={d.label}
                                        fill
                                        className="dest-card-img"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <div className="dest-card-overlay" />
                                    <div className="dest-card-content">
                                        <span className="dest-card-label">{d.label}</span>
                                        <span className="dest-card-sub">{d.subtitle}</span>
                                        {d.key === 'audiobook' && (
                                            <div className="dest-card-cta">
                                                <span>ENTER STUDIO</span>
                                                <ArrowRight size={12} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right — Dashboard Analytics */}
                <div className="col-right">
                    <div className="section-header">
                        <h2 className="section-title">Dashboard</h2>
                        <p className="section-desc">Analytics and recent activity overview.</p>
                    </div>

                    {/* Active Projects Feed */}
                    <div className="active-projects-row">
                        {projects.slice(0, 2).map((p, i) => (
                            <div key={p.id} className="active-project-card" onClick={() => router.push(`/project/${p.id}`)}>
                                <span className="ap-label">{i === 0 ? 'ACTIVE PROJECT' : 'DRAFT'}</span>
                                <span className="ap-title">{p.title}</span>
                                <div className="ap-stats">
                                    <span>{Math.round(((p.wordCount || 0) / 80000) * 100)}% Progress</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Metrics Row */}
                    <div className="metrics-row">
                        <div className="metric-card">
                            <span className="metric-label">WORDS WRITTEN</span>
                            <span className="metric-value">{totalWords.toLocaleString()}</span>
                            <span className="metric-trend metric-up"><TrendingUp size={11} /> +1,240 today</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">CHAPTERS</span>
                            <span className="metric-value">{totalChapters > 0 ? `${Math.round(totalChapters / projects.length || 0)}` : '0'}</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">DAILY STREAK</span>
                            <span className="metric-value">14 Days</span>
                            <span className="metric-trend metric-up"><Flame size={11} /> Personal Best</span>
                        </div>
                        <div className="metric-card">
                            <span className="metric-label">AI ASSISTANCE</span>
                            <span className="metric-value">94%</span>
                            <span className="metric-trend"><Zap size={11} /> High quality score</span>
                        </div>
                    </div>

                    {/* Writing Output Chart */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <span className="chart-title">Writing Output</span>
                            <span className="chart-period">LAST 7 DAYS</span>
                        </div>
                        <div className="chart-bars">
                            {weeklyOutput.map((d) => (
                                <div key={d.day} className="chart-bar-col">
                                    <div className="chart-bar-track">
                                        <div className="chart-bar-fill" style={{ height: `${(d.val / maxVal) * 100}%` }} />
                                    </div>
                                    <span className="chart-bar-label">{d.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Buttons Row */}
                    <div className="flex gap-2">
                        <Button onClick={() => setShowCreateProject(true)} className="new-project-btn flex-1">
                            <Plus size={16} />
                            New Project
                        </Button>
                        <Button variant="secondary" onClick={() => setShowCreateSeries(true)} className="new-series-btn flex-1 border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] hover:border-[var(--border-strong)] transition-all">
                            <Library size={16} className="mr-2" />
                            New Series
                        </Button>
                        <Button variant="ghost" onClick={() => setShowImportProject(true)} className="import-project-btn flex-[0.5] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] hover:border-[var(--border-strong)] transition-all px-3" title="Import Manuscript">
                            <Upload size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Library Section ── */}
            {loading && (
                <div className="projects-grid mt-8">
                    {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
            )}

            {!loading && (
                <section className="mt-8 space-y-8">
                    <h2 className="section-title mb-4">Library</h2>

                    {/* 1. Series Groups */}
                    {seriesGroups.map(({ series: s, projects: pList }) => (
                        <div key={s.id} className="series-group p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] mb-6 relative group">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-serif font-semibold text-[var(--accent-warm)]">{s.title}</h3>
                                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--surface-tertiary)] px-2 py-0.5 rounded-full border border-[var(--border)]">Series</span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] max-w-2xl">{s.description}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-500/10 p-2 h-8 w-8"
                                    onClick={() => {
                                        if (confirm(`Delete series "${s.title}"? Projects will simply be unbundled.`)) {
                                            deleteSeries(s.id);
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>

                            <div className="projects-grid">
                                {pList.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onOpen={() => router.push(`/project/${project.id}`)}
                                        onDelete={async () => {
                                            setDeleting(project.id);
                                            await deleteProject(project.id);
                                            setDeleting(null);
                                        }}
                                        isDeleting={deleting === project.id}
                                    />
                                ))}
                                {/* Empty State for Series */}
                                {pList.length === 0 && (
                                    <div className="flex items-center justify-center p-8 border border-dashed border-[var(--border-strong)] rounded-xl text-[var(--text-tertiary)] text-sm italic bg-[var(--surface-tertiary)]/50">
                                        No books within this series yet. Drag and drop functionality coming soon.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* 2. Stand-alone Projects */}
                    {unbundledProjects.length > 0 && (
                        <div className="standalone-group">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4 ml-1">Stand-alone Projects</h3>
                            <div className="projects-grid">
                                {unbundledProjects.map((project) => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onOpen={() => router.push(`/project/${project.id}`)}
                                        onDelete={async () => {
                                            setDeleting(project.id);
                                            await deleteProject(project.id);
                                            setDeleting(null);
                                        }}
                                        isDeleting={deleting === project.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {projects.length === 0 && series.length === 0 && !loading && (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold mb-2">Your library is empty.</h3>
                            <p className="text-[var(--text-secondary)]">Create a project or series to get started.</p>
                        </div>
                    )}
                </section>
            )}

            {/* Create Project Modal */}
            {showCreateProject && (
                <CreateProjectModal
                    onCreate={async (data) => {
                        const id = await createProject(data);
                        setShowCreateProject(false);
                        router.push(`/project/${id}`);
                    }}
                    onClose={() => setShowCreateProject(false)}
                />
            )}

            {/* Create Series Modal */}
            {showCreateSeries && (
                <CreateSeriesModal
                    onCreate={async (data) => {
                        await createSeries(data);
                        setShowCreateSeries(false);
                    }}
                    onClose={() => setShowCreateSeries(false)}
                />
            )}

            {/* Import Project Modal */}
            {showImportProject && (
                <ImportProjectModal
                    onImport={async (file, metadata) => {
                        setImporting(true);
                        try {
                            const parsed = await parseManuscript(file);

                            // 1. Create Project
                            const projectId = await createProject({
                                title: metadata.title || parsed.title,
                                genre: metadata.genre,
                                synopsis: metadata.synopsis || `Imported from ${parsed.title}`
                            });

                            // 2. Add Chapters
                            // createProject creates a default 'Chapter 1' at order 0.
                            // We'll add subsequent chapters starting at order 1.
                            if (parsed.chapters.length > 0) {
                                await Promise.all(parsed.chapters.map((c, i) =>
                                    createChapter(projectId, user?.uid!, {
                                        title: c.title || `Chapter ${i + 1}`,
                                        order: i + 1,
                                        content: c.content
                                    })
                                ));
                            } else if (parsed.fullText) {
                                // If no chapters found, put full text in a new chapter
                                await createChapter(projectId, user?.uid!, {
                                    title: 'Imported Content',
                                    order: 1,
                                    content: parsed.fullText
                                });
                            }

                            toast.success(`Project imported successfully.`);
                            setShowImportProject(false);
                            router.push(`/project/${projectId}`);
                        } catch (err) {
                            console.error(err);
                            toast.error('Failed to import project.');
                        } finally {
                            setImporting(false);
                        }
                    }}
                    onClose={() => setShowImportProject(false)}
                    loading={importing}
                />
            )}

            {/* ── Footer ── */}
            <footer className="app-footer">
                <div className="footer-left">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="footer-pen">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                    <span>Novello AI</span>
                </div>
                <div className="footer-links">
                    <a href="#">DOCS</a>
                    <a href="#">SUPPORT</a>
                    <a href="#">TERMS</a>
                    <a href="#">PRIVACY</a>
                </div>
                <span className="footer-copy">© 2024 NOVELLO INTELLIGENCE SYSTEMS</span>
            </footer>

            <style jsx>{`
                .dashboard-root {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem 2rem;
                }

                /* ── Welcome ── */
                .welcome-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }
                .welcome-title {
                    font-size: 2.2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                    font-family: var(--font-serif);
                    font-style: italic;
                }
                .welcome-subtitle {
                    font-size: 0.88rem;
                    color: var(--text-secondary);
                    margin: 4px 0 0;
                }

                .welcome-right {
                    text-align: right;
                }
                .literary-quote {
                    color: var(--accent-warm);
                    font-family: var(--font-serif);
                    font-style: italic;
                    font-size: 1rem;
                    margin: 0;
                }
                .literary-author {
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    margin-top: 4px;
                }

                /* ── Stitch Hero Card ── */
                .hero-card {
                    position: relative;
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    min-height: 220px;
                    cursor: pointer;
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    margin-bottom: 2.5rem;
                    transition: all var(--transition-slow);
                    box-shadow: var(--shadow-md);
                }
                .hero-card:hover {
                    border-color: var(--accent-warm-glow);
                    box-shadow: var(--shadow-lg), 0 0 20px var(--accent-warm-muted);
                    transform: translateY(-2px);
                }
                .hero-card-bg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.2;
                    transition: opacity 0.7s ease, transform 0.7s ease;
                }
                .hero-card:hover .hero-card-bg {
                    opacity: 0.25;
                    transform: scale(1.05);
                }
                .hero-card-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to right, var(--surface-secondary) 0%, rgba(17, 17, 24, 0.9) 40%, transparent 100%);
                    z-index: 1;
                }
                .hero-card-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 28px 32px;
                    min-height: 200px;
                }
                .hero-card-left {
                    max-width: 60%;
                }
                .hero-card-badges {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .hero-badge {
                    padding: 4px 10px;
                    background: rgba(213, 169, 68, 0.2);
                    color: var(--accent-warm);
                    font-size: 0.6rem;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    border-radius: 4px;
                }
                .hero-card-title {
                    font-family: var(--font-serif);
                    font-size: 2.2rem;
                    color: #fff;
                    margin: 0 0 8px;
                    line-height: 1.2;
                }
                .hero-card-chapter {
                    color: var(--text-secondary);
                    font-size: 1rem;
                    margin: 0;
                }
                .hero-card-right {
                    width: 35%;
                }
                .hero-progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                    font-weight: 500;
                }
                .hero-progress-pct {
                    color: var(--accent-warm);
                }
                .hero-progress-track {
                    height: 6px;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 99px;
                    overflow: hidden;
                }
                .hero-progress-fill {
                    height: 100%;
                    border-radius: 99px;
                    background: linear-gradient(135deg, #d5a944 0%, #f3dba3 50%, #b88a2d 100%);
                    box-shadow: 0 0 10px rgba(213, 169, 68, 0.5);
                    transition: width 0.8s ease;
                }
                .hero-card-cta-row {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 20px;
                }
                .hero-resume-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: var(--accent-warm);
                    color: #0a0a0f;
                    font-weight: 600;
                    font-size: 0.85rem;
                    padding: 10px 24px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(213, 169, 68, 0.2);
                }
                .hero-resume-btn:hover {
                    background: #e8c46a;
                    box-shadow: 0 4px 20px rgba(213, 169, 68, 0.3);
                }
                .hero-arrow {
                    font-size: 0.9rem;
                    transition: transform 0.2s ease;
                }
                .hero-resume-btn:hover .hero-arrow {
                    transform: translateX(3px);
                }

                /* ── Two Column ── */
                .two-col {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2.5rem;
                }
                .section-header {
                    margin-bottom: 1rem;
                }
                .section-title {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 2px;
                }
                .section-desc {
                    font-size: 0.78rem;
                    color: var(--text-tertiary);
                    margin: 0;
                }

                /* ── Destination Grid ── */
                .dest-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }
                .dest-card {
                    position: relative;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    aspect-ratio: 16 / 9;
                    cursor: pointer;
                    border: 1px solid var(--border);
                    box-shadow: var(--shadow-sm);
                    transition: all var(--transition-normal);
                    background: var(--surface-tertiary);
                }
                .dest-card:hover {
                    box-shadow: var(--shadow-md);
                    border-color: var(--border-strong);
                    transform: scale(1.02);
                }
                .dest-card-img {
                    transition: transform 0.5s ease, opacity 0.5s ease;
                    opacity: 0.6;
                }
                .dest-card:hover .dest-card-img {
                    transform: scale(1.05);
                    opacity: 0.8;
                }
                .dest-card-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 100%);
                    z-index: 1;
                }
                .dest-card-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 16px 18px;
                    z-index: 2;
                }
                .dest-card-label {
                    display: block;
                    font-size: 1.1rem;
                    font-weight: 500;
                    color: #fff;
                    line-height: 1.2;
                    margin-bottom: 3px;
                }
                .dest-card-sub {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 400;
                    letter-spacing: 0.04em;
                    color: rgba(255,255,255,0.5);
                    transition: color 0.3s ease;
                }
                .dest-card:hover .dest-card-sub {
                    color: var(--accent-warm);
                }

                /* ── Active Projects ── */
                .active-projects-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .active-project-card {
                    padding: 14px;
                    border-radius: var(--radius-lg);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .active-project-card:hover {
                    border-color: var(--border-strong);
                    box-shadow: var(--shadow-sm);
                }
                .empty-project-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    color: var(--text-tertiary);
                }
                .ap-label {
                    font-size: 0.55rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                }
                .ap-title {
                    display: block;
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-top: 4px;
                }
                .ap-stats {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin-top: 8px;
                    font-size: 0.68rem;
                    color: var(--text-tertiary);
                }

                /* ── Metrics ── */
                .metrics-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 10px;
                }
                .metric-card {
                    padding: 14px;
                    border-radius: var(--radius-lg);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .metric-label {
                    font-size: 0.55rem;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    color: var(--text-tertiary);
                    text-transform: uppercase;
                }
                .metric-value {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.3;
                }
                .metric-trend {
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                    display: flex;
                    align-items: center;
                    gap: 3px;
                }
                .metric-up {
                    color: #22c55e;
                }

                /* ── Chart ── */
                .chart-card {
                    padding: 16px;
                    border-radius: var(--radius-lg);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    margin-bottom: 10px;
                }
                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 14px;
                }
                .chart-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .chart-period {
                    font-size: 0.6rem;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    color: var(--text-tertiary);
                }
                .chart-bars {
                    display: flex;
                    gap: 8px;
                    align-items: flex-end;
                    height: 100px;
                }
                .chart-bar-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }
                .chart-bar-track {
                    width: 100%;
                    height: 80px;
                    background: var(--surface-tertiary);
                    border-radius: 4px;
                    display: flex;
                    align-items: flex-end;
                    overflow: hidden;
                }
                .chart-bar-fill {
                    width: 100%;
                    background: var(--accent-warm);
                    border-radius: 4px 4px 0 0;
                    transition: height 0.5s ease;
                    opacity: 0.85;
                }
                .chart-bar-label {
                    font-size: 0.58rem;
                    font-weight: 600;
                    color: var(--text-tertiary);
                    letter-spacing: 0.02em;
                }

                /* ── Feed ── */
                .feed-card {
                    padding: 16px;
                    border-radius: var(--radius-lg);
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    margin-bottom: 12px;
                }
                .feed-list {
                    margin-top: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .feed-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .feed-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .feed-dot-success {
                    background: #22c55e;
                }
                .feed-dot-warning {
                    background: #f59e0b;
                }
                .feed-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .feed-label {
                    font-size: 0.78rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }
                .feed-detail {
                    font-size: 0.65rem;
                    color: var(--text-tertiary);
                }
                .feed-tokens {
                    font-size: 0.68rem;
                    color: var(--text-tertiary);
                    white-space: nowrap;
                }

                /* ── Grid ── */
                .projects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 20px;
                }

                /* ── Project Card ── */
                .project-card {
                    position: relative;
                    background: var(--surface-secondary);
                    border-radius: 12px;
                    border: 1px solid var(--border);
                    padding: 16px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    min-height: 160px;
                    overflow: hidden;
                }
                
                .project-card:hover {
                    border-color: var(--border-strong);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.1);
                }

                .pc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .pc-badge {
                    font-size: 0.6rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary);
                    background: var(--surface-tertiary);
                    padding: 2px 6px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }

                .pc-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    font-family: var(--font-serif);
                    margin-bottom: 4px;
                    line-height: 1.3;
                }

                .pc-meta {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                
                .pc-divider {
                    width: 1px;
                    height: 10px;
                    background: var(--border-strong);
                }

                .pc-footer {
                    margin-top: auto;
                    padding-top: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }

                .pc-synopsis {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    margin-bottom: 12px;
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .pc-delete-btn {
                    padding: 6px;
                    border-radius: 6px;
                    color: var(--text-tertiary);
                    transition: all 0.2s;
                    opacity: 0;
                }
                .project-card:hover .pc-delete-btn {
                    opacity: 1;
                }
                .pc-delete-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
                
                .new-project-btn {
                    /* Custom styles for the + New Project button in sidebar */
                }

                /* ── Project Card Backgrounds ── */
                .pc-bg-wrap {
                    position: absolute;
                    inset: 0;
                    z-index: 0;
                    overflow: hidden;
                    border-radius: 12px;
                }
                .pc-bg-img {
                    object-fit: cover;
                    opacity: 0.15;
                    transition: transform 0.6s ease, opacity 0.6s ease;
                }
                .project-card:hover .pc-bg-img {
                    transform: scale(1.05);
                    opacity: 0.25;
                }
                .pc-bg-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, var(--surface-secondary), rgba(18, 18, 24, 0.8));
                    z-index: 1;
                }
                .pc-content {
                    position: relative;
                    z-index: 10;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .pc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                /* ── Destinations CTA ── */
                .dest-card-cta {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 8px;
                    padding: 4px 10px;
                    background: var(--accent-warm);
                    color: #000;
                    font-size: 0.65rem;
                    font-weight: 700;
                    border-radius: 4px;
                    letter-spacing: 0.05em;
                }

                /* ── Footer ── */
                .app-footer {
                    margin-top: 4rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    color: var(--text-tertiary);
                    font-size: 0.75rem;
                }
                .footer-left {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .footer-links {
                    display: flex;
                    gap: 20px;
                }
                .footer-links a {
                    text-decoration: none;
                    color: var(--text-tertiary);
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .footer-links a:hover {
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
}

function ProjectCard({ project, onOpen, onDelete, isDeleting }: { project: Project; onOpen: () => void; onDelete: () => void; isDeleting: boolean }) {
    return (
        <div className="project-card group" onClick={onOpen}>
            <div className="pc-bg-wrap">
                <Image
                    src="/images/kinetic/book-cover-generic.png"
                    alt="Cover"
                    fill
                    className="pc-bg-img"
                />
                <div className="pc-bg-overlay" />
            </div>
            <div className="pc-content relative z-10">
                <div className="pc-header">
                    <span className="pc-badge">{project.genre || 'Fiction'}</span>
                </div>
                <h3 className="pc-title">{project.title}</h3>
                <p className="pc-synopsis">
                    {project.synopsis || 'No synopsis provided yet.'}
                </p>
                <div className="pc-footer">
                    <div className="pc-meta">
                        <span>{formatDistanceToNow(project.updatedAt?.toDate() || new Date(), { addSuffix: true })}</span>
                        <span className="pc-divider" />
                        <span>{project.wordCount || 0} words</span>
                    </div>
                    <button
                        className="pc-delete-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this project?')) {
                                onDelete();
                            }
                        }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Clock size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateProjectModal({ onCreate, onClose }: { onCreate: (data: any) => void; onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [synopsis, setSynopsis] = useState('');
    const [creating, setCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        await onCreate({ title, genre, synopsis });
        setCreating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[var(--surface-primary)] rounded-xl border border-[var(--border)] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            New Project
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            Start your next great story
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-tertiary)] cursor-pointer">
                        <X size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        placeholder="My Great Novel"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                    />
                    <Input
                        label="Genre"
                        placeholder="Fantasy, Sci-Fi, Mystery..."
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                            Synopsis
                        </label>
                        <textarea
                            placeholder="A brief description of your story..."
                            value={synopsis}
                            onChange={(e) => setSynopsis(e.target.value)}
                            rows={3}
                            className="w-full px-3.5 py-2.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-secondary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={creating} className="flex-1">
                            Create
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CreateSeriesModal({ onCreate, onClose }: { onCreate: (data: any) => void; onClose: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        await onCreate({ title, description });
        setCreating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[var(--surface-primary)] rounded-xl border border-[var(--border)] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            New Series
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            Create a collection for your multi-book saga
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-tertiary)] cursor-pointer">
                        <X size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Series Title"
                        placeholder="The Chronicles of..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                            Description
                        </label>
                        <textarea
                            placeholder="A brief overview of the saga..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3.5 py-2.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-secondary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={creating} className="flex-1">
                            Create Series
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ImportProjectModal({ onImport, onClose, loading }: { onImport: (file: File, metadata: { title: string; genre: string; synopsis: string }) => void; onClose: () => void; loading: boolean }) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [synopsis, setSynopsis] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            // Auto-fill title from filename
            if (!title) {
                setTitle(f.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a file to import.');
            return;
        }
        onImport(file, { title, genre, synopsis });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[var(--surface-primary)] rounded-xl border border-[var(--border)] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Import Manuscript
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                            Upload .docx, .txt, or .md file
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-tertiary)] cursor-pointer">
                        <X size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="border-2 border-dashed border-[var(--border-strong)] rounded-lg p-6 text-center hover:border-[var(--accent)] transition-colors cursor-pointer relative"
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".docx,.txt,.md"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText size={32} className="text-[var(--accent)]" />
                                <span className="text-sm font-medium text-[var(--text-primary)]">{file.name}</span>
                                <span className="text-xs text-[var(--text-tertiary)]">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-[var(--text-tertiary)]">
                                <Upload size={24} />
                                <span className="text-sm">Click to upload or drag and drop</span>
                                <span className="text-xs">Supports .docx, .txt, .md</span>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Project Title"
                        placeholder="Import Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <Input
                        label="Genre"
                        placeholder="Fantasy, imported..."
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                            Synopsis (Optional)
                        </label>
                        <textarea
                            placeholder="Brief description..."
                            value={synopsis}
                            onChange={(e) => setSynopsis(e.target.value)}
                            rows={2}
                            className="w-full px-3.5 py-2.5 text-sm rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-secondary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                            style={{ color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            Import Project
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
