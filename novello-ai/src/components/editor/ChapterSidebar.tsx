'use client';

import { Plus, Trash2, FileText, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import type { Chapter } from '@/lib/types';

interface ChapterSidebarProps {
    chapters: Chapter[];
    activeChapterId: string | null;
    onSelect: (chapterId: string) => void;
    onAdd: () => void;
    onDelete: (chapterId: string) => void;
}

export function ChapterSidebar({
    chapters,
    activeChapterId,
    onSelect,
    onAdd,
    onDelete,
}: ChapterSidebarProps) {
    return (
        <aside
            className="flex flex-col h-full border-r glass-subtle animate-fade-in"
            style={{
                width: 'var(--sidebar-width)',
                borderColor: 'var(--border)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                    Chapters
                </span>
                <Button variant="ghost" onClick={onAdd} className="!p-1.5">
                    <Plus size={14} />
                </Button>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto py-2">
                {chapters.length === 0 && (
                    <p className="text-xs text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
                        No chapters yet.
                    </p>
                )}

                {chapters.map((chapter) => {
                    const isActive = chapter.id === activeChapterId;
                    return (
                        <div
                            key={chapter.id}
                            onClick={() => onSelect(chapter.id)}
                            className={`
                group flex items-center gap-2 px-4 py-2.5 mx-2 rounded-[var(--radius-md)] cursor-pointer transition-all
                ${isActive
                                    ? 'bg-[var(--accent-muted)]'
                                    : 'hover:bg-[var(--surface-tertiary)]'
                                }
              `}
                        >
                            <GripVertical
                                size={12}
                                className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab"
                                style={{ color: 'var(--text-tertiary)' }}
                            />
                            <FileText size={14} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }} />

                            <div className="flex-1 min-w-0">
                                <div
                                    className="text-sm font-medium truncate"
                                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}
                                >
                                    {chapter.title}
                                </div>
                            </div>

                            <StatusPill status={chapter.status || 'draft'} />

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete "${chapter.title}"?`)) {
                                        onDelete(chapter.id);
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                                style={{ color: 'var(--text-tertiary)' }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
