'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, LayoutGrid, GripVertical, ChevronRight,
    BookOpen, CheckCircle, Clock, PenLine, Plus
} from 'lucide-react';
import { useChapters } from '@/lib/hooks/useChapters';
import { useProjects } from '@/lib/hooks/useProjects';
import { Chapter } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'var(--text-tertiary)', bg: 'rgba(var(--muted-rgb, 120,120,120), 0.15)', icon: PenLine },
    review: { label: 'Review', color: 'var(--warning, #d97706)', bg: 'rgba(217, 119, 6, 0.1)', icon: Clock },
    final: { label: 'Final', color: 'var(--success, #16a34a)', bg: 'rgba(22, 163, 74, 0.1)', icon: CheckCircle },
};

function wc(html: string) {
    return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

function ChapterCard({ chapter, index, onSelect, onStatusChange, isDragging, onDragStart, onDragOver, onDrop }: {
    chapter: Chapter;
    index: number;
    onSelect: (id: string) => void;
    onStatusChange: (id: string, status: Chapter['status']) => void;
    isDragging: boolean;
    onDragStart: (i: number) => void;
    onDragOver: (i: number) => void;
    onDrop: () => void;
}) {
    const cfg = STATUS_CONFIG[chapter.status];
    const Icon = cfg.icon;
    const words = wc(chapter.content || '');

    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
            onDrop={onDrop}
            style={{
                background: 'var(--surface-secondary)',
                border: `1px solid var(--border)`,
                borderRadius: 12,
                padding: '1rem',
                cursor: 'grab',
                opacity: isDragging ? 0.4 : 1,
                transition: 'box-shadow 0.15s, opacity 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <GripVertical size={16} color="var(--text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
                        Ch. {chapter.order + 1}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chapter.title}
                    </div>
                </div>
            </div>

            {/* Synopsis */}
            {chapter.synopsis && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {chapter.synopsis}
                </p>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 8 }}>
                {/* Status selector */}
                <select
                    value={chapter.status}
                    onChange={(e) => onStatusChange(chapter.id, e.target.value as Chapter['status'])}
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: '0.72rem', background: cfg.bg, color: cfg.color, border: 'none', borderRadius: 6, padding: '3px 6px', fontWeight: 600, cursor: 'pointer' }}
                >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="final">Final</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <BookOpen size={12} />
                        {words.toLocaleString()} w
                    </span>
                </div>

                <button
                    onClick={() => onSelect(chapter.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                    Edit <ChevronRight size={12} />
                </button>
            </div>
        </div>
    );
}

export function BoardContent({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { chapters, loading, createChapter, updateChapter } = useChapters(projectId);
    const { projects } = useProjects();
    const activeProject = projects.find(p => p.id === projectId);

    const [orderedChapters, setOrderedChapters] = useState<Chapter[]>([]);
    const [dragFrom, setDragFrom] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);

    useEffect(() => {
        setOrderedChapters([...chapters].sort((a, b) => a.order - b.order));
    }, [chapters]);

    const handleDragStart = (i: number) => setDragFrom(i);
    const handleDragOver = (i: number) => setDragOver(i);

    const handleDrop = useCallback(async () => {
        if (dragFrom === null || dragOver === null || dragFrom === dragOver) {
            setDragFrom(null); setDragOver(null);
            return;
        }
        const reordered = [...orderedChapters];
        const [moved] = reordered.splice(dragFrom, 1);
        reordered.splice(dragOver, 0, moved);
        const updated = reordered.map((ch, i) => ({ ...ch, order: i }));
        setOrderedChapters(updated);
        setDragFrom(null); setDragOver(null);
        try {
            await Promise.all(updated.map(ch => updateChapter(ch.id, { order: ch.order })));
            toast.success('Chapter order saved');
        } catch {
            toast.error('Failed to save order');
        }
    }, [dragFrom, dragOver, orderedChapters, updateChapter]);

    const handleStatusChange = useCallback(async (id: string, status: Chapter['status']) => {
        try {
            await updateChapter(id, { status });
        } catch {
            toast.error('Failed to update status');
        }
    }, [updateChapter]);

    // Columns
    const draftChapters = orderedChapters.filter(c => c.status === 'draft');
    const reviewChapters = orderedChapters.filter(c => c.status === 'review');
    const finalChapters = orderedChapters.filter(c => c.status === 'final');

    if (loading) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading board...</div>
    );

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '2rem' }}>
                <button
                    onClick={() => router.push(`/project/${projectId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    <ArrowLeft size={16} /> Back to Editor
                </button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LayoutGrid size={20} color="var(--accent)" />
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            {activeProject?.title || 'Board View'}
                        </h1>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                        Drag chapters to reorder. Change status to move between columns.
                    </p>
                </div>
                <Button size="sm" onClick={() => router.push(`/project/${projectId}`)}>
                    <Plus size={14} /> New Chapter
                </Button>
            </div>

            {/* All-chapters list (linear reorder) */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                    All Chapters ({orderedChapters.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {orderedChapters.map((ch, i) => (
                        <ChapterCard
                            key={ch.id}
                            chapter={ch}
                            index={i}
                            onSelect={(id) => router.push(`/project/${projectId}?chapter=${id}`)}
                            onStatusChange={handleStatusChange}
                            isDragging={dragFrom === i}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        />
                    ))}
                </div>
            </div>

            {/* Status Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                {[
                    { label: '🖊 Draft', chapters: draftChapters, cfg: STATUS_CONFIG.draft },
                    { label: '👁 Review', chapters: reviewChapters, cfg: STATUS_CONFIG.review },
                    { label: '✅ Final', chapters: finalChapters, cfg: STATUS_CONFIG.final },
                ].map(({ label, chapters: colChapters, cfg }) => (
                    <div key={label} style={{ background: 'var(--surface-secondary)', borderRadius: 12, padding: '1rem', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: cfg.color }}>
                            {label} · {colChapters.length}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {colChapters.length === 0 && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem' }}>None</div>
                            )}
                            {colChapters.map((ch, i) => (
                                <div key={ch.id} style={{ padding: '0.6rem', background: 'var(--surface-primary)', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    onClick={() => router.push(`/project/${projectId}?chapter=${ch.id}`)}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ch. {ch.order + 1}: {ch.title}</span>
                                    <ChevronRight size={14} color="var(--text-tertiary)" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
