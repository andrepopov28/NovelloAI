'use client';

import { useState } from 'react';
import { useSeries } from '@/lib/hooks/useSeries';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BookOpen, Layers, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

export default function SeriesListPage() {
    const { series, loading, createSeries, deleteSeries } = useSeries();
    const [isCreating, setIsCreating] = useState(false);
    const [newSeriesData, setNewSeriesData] = useState({ title: '', description: '' });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSeriesData.title) return;
        await createSeries(newSeriesData);
        setIsCreating(false);
        setNewSeriesData({ title: '', description: '' });
    };

    return (
        <div className="series-page">
            <header className="series-header">
                <div className="header-meta">
                    <h1 className="page-title">Series Library</h1>
                    <p className="page-subtitle">Organize your book series and shared codex entities</p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus size={18} />
                    <span>Create Series</span>
                </Button>
            </header>

            {isCreating && (
                <Card className="create-series-card">
                    <form onSubmit={handleCreate}>
                        <h2 className="card-title">New Series</h2>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={newSeriesData.title}
                                onChange={(e) => setNewSeriesData({ ...newSeriesData, title: e.target.value })}
                                placeholder="e.g. The Chronicles of Novello"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                value={newSeriesData.description}
                                onChange={(e) => setNewSeriesData({ ...newSeriesData, description: e.target.value })}
                                placeholder="A brief overview of the series arc..."
                            />
                        </div>
                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button type="submit" disabled={!newSeriesData.title}>Create Series</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="series-grid">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                    </div>
                ) : series.length === 0 ? (
                    <div className="empty-state">
                        <Layers size={48} className="empty-icon" />
                        <h3>No Series Yet</h3>
                        <p>Create a series to unify multiple projects and share characters across books.</p>
                        <Button variant="secondary" onClick={() => setIsCreating(true)}>
                            Start Your First Series
                        </Button>
                    </div>
                ) : (
                    series.map((item) => (
                        <Card key={item.id} className="series-card">
                            <Link href={`/series/${item.id}`} className="card-link">
                                <div className="card-top">
                                    <div className="series-icon-box">
                                        <Layers size={24} />
                                    </div>
                                    <div className="series-meta">
                                        <span className="project-count">{item.projectIds?.length || 0} Projects</span>
                                        <span className="entity-count">{item.sharedEntityIds?.length || 0} Shared Entities</span>
                                    </div>
                                </div>
                                <h3 className="series-title">{item.title}</h3>
                                <p className="series-description">{item.description || 'No description provided.'}</p>
                            </Link>
                            <div className="card-footer">
                                <span className="last-updated">
                                    Updated {item.updatedAt?.toDate?.().toLocaleDateString()}
                                </span>
                                <div className="footer-actions">
                                    <button className="icon-btn" title="Edit">
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="icon-btn delete-btn"
                                        title="Delete"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (confirm('Are you sure you want to delete this series?')) {
                                                deleteSeries(item.id);
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <style jsx>{`
                .series-page {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 24px;
                }
                .series-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 48px;
                }
                .page-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    letter-spacing: -0.03em;
                    color: var(--text-primary);
                }
                .page-subtitle {
                    font-size: 1.1rem;
                    color: var(--text-tertiary);
                    margin-top: 8px;
                }

                .create-series-card {
                    margin-bottom: 32px;
                    padding: 32px !important;
                    max-width: 600px;
                }
                .card-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 24px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 20px;
                }
                .form-group label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .form-group input, .form-group textarea {
                    padding: 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                    outline: none;
                }
                .form-group textarea {
                    min-height: 100px;
                    resize: vertical;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 8px;
                }

                .series-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 24px;
                }

                .series-card {
                    padding: 0 !important;
                    display: flex;
                    flex-direction: column;
                    transition: transform 0.2s, border-color 0.2s;
                    overflow: hidden;
                }
                .series-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--accent-warm);
                }
                .card-link {
                    padding: 32px;
                    text-decoration: none;
                    flex: 1;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }
                .series-icon-box {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: var(--accent-warm-muted);
                    color: var(--accent-warm);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .series-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 4px;
                }
                .project-count, .entity-count {
                    font-size: 0.75rem;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 20px;
                    background: var(--surface-tertiary);
                    color: var(--text-secondary);
                    white-space: nowrap;
                }
                .series-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                }
                .series-description {
                    font-size: 0.95rem;
                    color: var(--text-tertiary);
                    line-height: 1.6;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .card-footer {
                    padding: 16px 32px;
                    border-top: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--surface-secondary);
                }
                .last-updated {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .footer-actions {
                    display: flex;
                    gap: 8px;
                }
                .icon-btn {
                    padding: 8px;
                    border-radius: 6px;
                    background: transparent;
                    border: none;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .icon-btn:hover {
                    background: var(--surface-tertiary);
                    color: var(--text-primary);
                }
                .delete-btn:hover {
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.1);
                }

                .empty-state {
                    grid-column: 1 / -1;
                    padding: 80px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    text-align: center;
                    background: var(--surface-secondary);
                    border: 2px dashed var(--border);
                    border-radius: var(--radius-lg);
                }
                .empty-icon {
                    color: var(--text-tertiary);
                    margin-bottom: 8px;
                }
                .empty-state h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                .empty-state p {
                    max-width: 400px;
                    color: var(--text-tertiary);
                    margin-bottom: 8px;
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 2px solid var(--border);
                    border-top-color: var(--accent-warm);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .loading-state {
                    grid-column: 1 / -1;
                    display: flex;
                    justify-content: center;
                    padding: 100px;
                }
            `}</style>
        </div>
    );
}
