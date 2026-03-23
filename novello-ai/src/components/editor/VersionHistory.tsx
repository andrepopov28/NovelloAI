'use client';

import { useEffect, useState } from 'react';
import { ChapterVersion } from '@/lib/types';
import { subscribeToVersions } from '@/lib/firestore';
import { Sheet } from '@/components/ui/Sheet';
import { format } from 'date-fns';
import { Clock, RotateCcw, Eye, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VersionHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    chapterId: string;
    currentContent: string;
    onRestore: (content: string) => void;
    onSaveSnapshot: () => void;
}

export function VersionHistory({
    isOpen,
    onClose,
    chapterId,
    onRestore,
    onSaveSnapshot
}: VersionHistoryProps) {
    const [versions, setVersions] = useState<ChapterVersion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !chapterId) return;

        setLoading(true);
        const unsubscribe = subscribeToVersions(
            chapterId,
            (data) => {
                setVersions(data);
                setLoading(false);
            },
            (err) => {
                console.error('Failed to fetch versions:', err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [isOpen, chapterId]);

    const getSourceLabel = (source: ChapterVersion['source']) => {
        switch (source) {
            case 'autosave': return { label: 'Auto-Save', color: 'bg-gray-100 text-gray-600' };
            case 'manual': return { label: 'Manual Snapshot', color: 'bg-blue-100 text-blue-700' };
            case 'ai-generation': return { label: 'AI Generation', color: 'bg-purple-100 text-purple-700' };
            case 'import': return { label: 'Import', color: 'bg-green-100 text-green-700' };
            default: return { label: source, color: 'bg-gray-100 text-gray-600' };
        }
    };

    return (
        <Sheet isOpen={isOpen} onClose={onClose} title="Version History">
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-[var(--text-secondary)]">
                        Restore previous versions of this chapter.
                    </p>
                    <Button
                        onClick={onSaveSnapshot}
                        variant="secondary"
                        className="text-xs h-8"
                    >
                        <Save size={14} className="mr-2" />
                        Save Now
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="text-center p-8 text-[var(--text-secondary)] bg-[var(--surface-secondary)] rounded-lg">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No history found for this chapter.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {versions.map((version) => {
                            const { label, color } = getSourceLabel(version.source);
                            const date = version.createdAt ? new Date(version.createdAt) : new Date();

                            return (
                                <div
                                    key={version.id}
                                    className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] transition-colors bg-[var(--surface-secondary)] group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${color}`}>
                                                {label}
                                            </span>
                                            <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                                <Clock size={12} />
                                                {format(date, 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mt-3">
                                        <div className="text-xs text-[var(--text-secondary)]">
                                            {version.wordCount} words
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs hover:bg-[var(--surface-tertiary)] text-[var(--text-primary)]"
                                            onClick={() => {
                                                if (confirm('Restore this version? Current unsaved changes will be overwritten.')) {
                                                    onRestore(version.content);
                                                    onClose();
                                                }
                                            }}
                                        >
                                            <RotateCcw size={14} className="mr-1.5" />
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Sheet>
    );
}
