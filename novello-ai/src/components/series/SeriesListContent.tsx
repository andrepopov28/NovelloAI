'use client';

import { useState } from 'react';
import { useSeries } from '@/lib/hooks/useSeries';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    Library,
    Plus,
    Search,
    BookOpen,
    MoreVertical,
    Trash2,
    Edit2,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SeriesListContent() {
    const { series, loading, createSeries, deleteSeries } = useSeries();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newSeriesData, setNewSeriesData] = useState({ title: '', description: '' });

    const filteredSeries = series.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSeriesData.title.trim()) return;

        try {
            await createSeries({ title: newSeriesData.title, description: newSeriesData.description });
            setNewSeriesData({ title: '', description: '' });
            setIsCreating(false);
            toast.success('Series created successfully');
        } catch (err) {
            toast.error('Failed to create series');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this series? Projects within it will not be deleted.')) return;
        try {
            await deleteSeries(id);
            toast.success('Series deleted');
        } catch (err) {
            toast.error('Failed to delete series');
        }
    };

    if (loading && series.length === 0) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-warm"></div>
            </div>
        );
    }

    return (
        <div className="series-page">
            <header className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Series Library</h1>
                    <p className="page-subtitle">Organize your books into sagas, trilogies, and collections.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="create-btn">
                    <Plus size={18} />
                    <span>New Series</span>
                </Button>
            </header>

            <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search series..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isCreating && (
                <Card className="create-series-card">
                    <form onSubmit={handleCreate}>
                        <h3>Create New Series</h3>
                        <div className="form-group">
                            <label>Series Title</label>
                            <input
                                autoFocus
                                type="text"
                                value={newSeriesData.title}
                                onChange={e => setNewSeriesData({ ...newSeriesData, title: e.target.value })}
                                placeholder="e.g. The Chronos Chronicles"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description (Optional)</label>
                            <textarea
                                value={newSeriesData.description}
                                onChange={e => setNewSeriesData({ ...newSeriesData, description: e.target.value })}
                                placeholder="What is this series about?"
                            />
                        </div>
                        <div className="form-actions">
                            <Button variant="ghost" type="button" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button type="submit" disabled={!newSeriesData.title.trim()}>Create Series</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="series-grid">
                {filteredSeries.length === 0 ? (
                    <div className="empty-state">
                        <Library size={48} className="empty-icon" />
                        <h2>No series found</h2>
                        <p>Create your first series to start organizing your multiverse.</p>
                        <Button variant="secondary" onClick={() => setIsCreating(true)}>
                            Create Series
                        </Button>
                    </div>
                ) : (
                    filteredSeries.map((s) => (
                        <Card key={s.id} className="series-card">
                            <Link href={`/series/${s.id}`} className="series-link">
                                <div className="series-content">
                                    <div className="series-main">
                                        <h3 className="series-name">{s.title}</h3>
                                        <p className="series-description">
                                            {s.description || 'No description provided.'}
                                        </p>
                                    </div>
                                    <div className="series-footer">
                                        <div className="series-stats">
                                            <div className="stat">
                                                <BookOpen size={14} />
                                                <span>{s.projectIds?.length || 0} Books</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="chevron" />
                                    </div>
                                </div>
                            </Link>
                            <div className="series-actions">
                                <button className="action-dot-btn" onClick={() => handleDelete(s.id)}>
                                    <Trash2 size={16} />
                                </button>
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
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 32px;
                }
                .page-title {
                    font-size: 2rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    color: var(--text-primary);
                }
                .page-subtitle {
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }

                .search-bar {
                    position: relative;
                    margin-bottom: 32px;
                }
                .search-icon {
                    position: absolute;
                    left: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-tertiary);
                }
                .search-bar input {
                    width: 100%;
                    padding: 14px 14px 14px 48px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--border);
                    background: var(--surface-secondary);
                    color: var(--text-primary);
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                .search-bar input:focus {
                    outline: none;
                    border-color: var(--accent-warm);
                    background: var(--surface-tertiary);
                    box-shadow: 0 0 0 4px var(--accent-warm-muted);
                }

                .create-series-card {
                    margin-bottom: 32px;
                    padding: 32px !important;
                    border: 1px solid var(--accent-warm);
                    background: var(--accent-warm-muted);
                }
                .create-series-card h3 {
                    margin-bottom: 24px;
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                .form-group input, .form-group textarea {
                    width: 100%;
                    padding: 12px;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                    background: var(--surface-primary);
                    color: var(--text-primary);
                }
                .form-group textarea {
                    height: 100px;
                    resize: vertical;
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 24px;
                }

                .series-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                    gap: 24px;
                }

                .series-card {
                    position: relative;
                    padding: 0 !important;
                    overflow: visible;
                    transition: all 0.2s;
                }
                .series-card:hover {
                    transform: translateY(-4px);
                    border-color: var(--accent-warm);
                    box-shadow: var(--shadow-lg);
                }
                .series-link {
                    text-decoration: none;
                    display: block;
                    height: 100%;
                }
                .series-content {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 200px;
                }
                .series-main {
                    flex-grow: 1;
                }
                .series-name {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }
                .series-description {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .series-footer {
                    margin-top: 24px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .series-stats {
                    display: flex;
                    gap: 16px;
                }
                .stat {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-tertiary);
                }
                .chevron {
                    color: var(--text-tertiary);
                    transition: transform 0.2s, color 0.2s;
                }
                .series-card:hover .chevron {
                    transform: translateX(4px);
                    color: var(--accent-warm);
                }

                .series-actions {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .series-card:hover .series-actions {
                    opacity: 1;
                }
                .action-dot-btn {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--surface-primary);
                    border: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-dot-btn:hover {
                    color: #ef4444;
                    border-color: #ef4444;
                    background: rgba(239, 68, 68, 0.05);
                }

                .empty-state {
                    grid-column: 1 / -1;
                    padding: 80px 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    background: var(--surface-secondary);
                    border: 2px dashed var(--border);
                    border-radius: var(--radius-xl);
                }
                .empty-icon {
                    color: var(--text-tertiary);
                    margin-bottom: 24px;
                    opacity: 0.5;
                }
                .empty-state h2 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .empty-state p {
                    color: var(--text-tertiary);
                    max-width: 400px;
                    margin-bottom: 24px;
                }

                @media (max-width: 640px) {
                    .page-header {
                        flex-direction: column;
                        gap: 20px;
                    }
                    .create-btn {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
