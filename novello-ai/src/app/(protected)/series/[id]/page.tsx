'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscribeToSeries, subscribeToSeriesProjects } from '@/lib/firestore';
import { Project, Series } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    ChevronLeft,
    Book,
    Users,
    Settings as SettingsIcon,
    Plus,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SeriesDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [series, setSeries] = useState<Series | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        const unsubscribeSeries = subscribeToSeries(
            id,
            (data) => {
                if (!data) {
                    toast.error('Series not found');
                    router.push('/series');
                    return;
                }
                setSeries(data);
                setLoading(false);
            },
            (err) => {
                console.error(err);
                toast.error('Failed to load series');
            }
        );

        const unsubscribeProjects = subscribeToSeriesProjects(
            id,
            (list) => setProjects(list),
            (err) => console.error(err)
        );

        return () => {
            unsubscribeSeries();
            unsubscribeProjects();
        };
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-warm"></div>
            </div>
        );
    }

    return (
        <div className="series-detail-page">
            <header className="detail-header">
                <div className="header-left">
                    <Link href="/series" className="back-link">
                        <ChevronLeft size={20} />
                        <span>Back to Library</span>
                    </Link>
                    <div className="title-section">
                        <h1 className="series-title">{series?.title}</h1>
                        <p className="series-desc">{series?.description || 'No description provided.'}</p>
                    </div>
                </div>
                <div className="header-actions">
                    <Button variant="secondary">
                        <SettingsIcon size={18} />
                        <span>Series Settings</span>
                    </Button>
                </div>
            </header>

            <div className="detail-grid">
                {/* Left Column: Projects */}
                <section className="detail-section">
                    <div className="section-head">
                        <div className="head-title">
                            <Book size={20} className="head-icon" />
                            <h2>Project Library</h2>
                        </div>
                        <Button variant="ghost" size="sm">
                            <Plus size={16} />
                            <span>Add Project</span>
                        </Button>
                    </div>

                    <div className="projects-stack">
                        {projects.length === 0 ? (
                            <div className="empty-substate">
                                <p>No projects linked to this series yet.</p>
                            </div>
                        ) : (
                            projects.map((project) => (
                                <Card key={project.id} className="project-list-card">
                                    <div className="project-info">
                                        <h3 className="project-name">{project.title}</h3>
                                        <div className="project-stats">
                                            <span>{project.wordCount.toLocaleString()} words</span>
                                            <span className="dot"></span>
                                            <span>{project.chapterCount} chapters</span>
                                        </div>
                                    </div>
                                    <Link href={`/project/${project.id}`} className="view-link">
                                        <span>Open Book</span>
                                        <ExternalLink size={14} />
                                    </Link>
                                </Card>
                            ))
                        )}
                    </div>
                </section>

                {/* Right Column: Shared Entities */}
                <section className="detail-section">
                    <div className="section-head">
                        <div className="head-title">
                            <Users size={20} className="head-icon" />
                            <h2>Shared Codex</h2>
                        </div>
                        <Button variant="ghost" size="sm">
                            <Plus size={16} />
                            <span>Port Entity</span>
                        </Button>
                    </div>

                    <div className="entities-stack">
                        {(!series?.sharedEntityIds || series.sharedEntityIds.length === 0) ? (
                            <div className="empty-substate">
                                <p>No shared entities in this series.</p>
                                <p className="hint">Share characters or settings from a book's Codex to see them here.</p>
                            </div>
                        ) : (
                            <div className="entities-placeholder">
                                {series.sharedEntityIds.length} Entities Shared
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <style jsx>{`
                .series-detail-page {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 40px 24px;
                }
                .detail-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 48px;
                }
                .back-link {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: var(--text-tertiary);
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-bottom: 16px;
                    transition: color 0.2s;
                }
                .back-link:hover {
                    color: var(--accent-warm);
                }
                .series-title {
                    font-size: 2.25rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: var(--text-primary);
                }
                .series-desc {
                    font-size: 1.1rem;
                    color: var(--text-tertiary);
                    margin-top: 8px;
                    max-width: 800px;
                }

                .detail-grid {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr;
                    gap: 40px;
                }

                .detail-section {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .section-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .head-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .head-icon {
                    color: var(--accent-warm);
                }
                .head-title h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .projects-stack, .entities-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .project-list-card {
                    padding: 24px !important;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border: 1px solid var(--border);
                    transition: all 0.2s;
                }
                .project-list-card:hover {
                    border-color: var(--accent-warm);
                    background: var(--surface-secondary);
                }
                .project-name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .project-stats {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    color: var(--text-tertiary);
                }
                .dot {
                    width: 3px;
                    height: 3px;
                    border-radius: 50%;
                    background: var(--border-strong);
                }
                .view-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--accent-warm);
                    font-size: 0.85rem;
                    font-weight: 700;
                    text-decoration: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    background: var(--accent-warm-muted);
                    transition: all 0.2s;
                }
                .view-link:hover {
                    opacity: 0.8;
                    transform: translateX(4px);
                }

                .empty-substate {
                    padding: 40px;
                    background: var(--surface-secondary);
                    border: 1px dashed var(--border);
                    border-radius: var(--radius-lg);
                    text-align: center;
                    color: var(--text-tertiary);
                    font-size: 0.9rem;
                }
                .hint {
                    font-size: 0.8rem;
                    margin-top: 4px;
                }

                @media (max-width: 1024px) {
                    .detail-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
